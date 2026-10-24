import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../db";
import {
  invoices,
  invoiceItems,
  products,
  stockMovements,
  customers,
  organizations,
  payments,
} from "../db/schema";
import { eq, desc, sql, ilike, or } from "drizzle-orm";
import { calculateInvoiceTaxes } from "../services/tax-calculator";
import { generateDynamicUpiQr } from "../services/upi-generator";
import { requireAuth } from "../auth";

export const invoicesRoute = new Hono()
  .get("/", requireAuth, async (c) => {
    const q = c.req.query("q");
    const status = c.req.query("status");

    let query = db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        invoiceDate: invoices.invoiceDate,
        dueDate: invoices.dueDate,
        status: invoices.status,
        customerName: customers.name,
        customerPhone: customers.phone,
        grandTotal: invoices.grandTotal,
        paidAmount: invoices.paidAmount,
        balanceAmount: invoices.balanceAmount,
        createdAt: invoices.createdAt,
      })
      .from(invoices)
      .leftJoin(customers, eq(invoices.customerId, customers.id));

    const list = await query.orderBy(desc(invoices.createdAt)).limit(100);
    return c.json(list);
  })
  .get("/:id", requireAuth, async (c) => {
    const id = c.req.param("id");
    if (!id) return c.json({ error: "Missing ID" }, 400);

    const [inv] = await db.select().from(invoices).where(eq(invoices.id, id)).limit(1);
    if (!inv) {
      return c.json({ error: "Invoice not found" }, 404);
    }

    const items = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, id));
    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, inv.customerId))
      .limit(1);
    const [org] = await db.select().from(organizations).limit(1);

    // Generate dynamic UPI QR for this invoice if not paid in full
    let upiData = { upiUrl: "", qrDataUrl: "" };
    if (org && org.upiVpa && Number(inv.balanceAmount) > 0) {
      upiData = await generateDynamicUpiQr({
        vpa: org.upiVpa,
        payeeName: org.tradeName || org.legalName,
        amount: Number(inv.balanceAmount),
        invoiceNumber: inv.invoiceNumber,
      });
    }

    return c.json({
      invoice: inv,
      items,
      customer: customer || inv.customerSnapshot,
      organization: org || inv.sellerSnapshot,
      upi: upiData,
    });
  })
  .post(
    "/",
    requireAuth,
    zValidator(
      "json",
      z.object({
        customerId: z.string().optional(),
        customerName: z.string().optional(),
        customerPhone: z.string().optional(),
        customerArea: z.string().optional(),
        invoiceType: z
          .enum(["TAX_INVOICE", "RETAIL_BILL", "PROFORMA", "QUOTATION"])
          .default("TAX_INVOICE"),
        items: z
          .array(
            z.object({
              productId: z.string().optional(),
              name: z.string().optional(),
              unitOfMeasure: z.string().optional(),
              taxPercent: z.number().optional(),
              quantity: z.number().positive("Quantity must be greater than zero"),
              unitPrice: z.number().nonnegative(),
              discountPercent: z.number().min(0).max(100).default(0),
            })
          )
          .min(1, "At least one item is required"),
        paymentMode: z.enum(["CASH", "UPI", "BANK_TRANSFER", "CHEQUE", "CARD"]).default("CASH"),
        paidAmount: z.number().min(0).default(0),
        notes: z.string().optional(),
      })
    ),
    async (c) => {
      const {
        customerId,
        customerName,
        customerPhone,
        customerArea,
        invoiceType,
        items,
        paymentMode,
        paidAmount,
        notes,
      } = c.req.valid("json");

      // 1. Fetch Organization details
      const [org] = await db.select().from(organizations).limit(1);
      if (!org) {
        return c.json({ error: "Organization profile not configured" }, 400);
      }

      // 2. Fetch or Auto-create Customer on the fly (never fail because customer doesn't exist)
      let cust;
      if (customerId) {
        [cust] = await db.select().from(customers).where(eq(customers.id, customerId)).limit(1);
      }

      if (!cust && customerPhone && customerPhone.trim().length > 3) {
        [cust] = await db
          .select()
          .from(customers)
          .where(eq(customers.phone, customerPhone.trim()))
          .limit(1);
      }

      if (!cust) {
        // Auto-create customer on the fly
        const finalName = customerName?.trim() || "Walk-in Buyer";
        const finalPhone = customerPhone?.trim() || "Walk-in";
        const finalArea = customerArea?.trim() || "Local";

        [cust] = await db
          .insert(customers)
          .values({
            organizationId: org.id,
            name: finalName,
            phone: finalPhone,
            area: finalArea,
            billingAddress: finalArea,
            city: org.city || "Local",
            state: org.state || "Tamil Nadu",
            stateCode: org.stateCode || "33",
          })
          .returning();
      }

      // 3. Process products and check or auto-create items + STRICT INVENTORY VALIDATION
      const resolvedItems: Array<{
        product: any;
        quantity: number;
        unitPrice: number;
        discountPercent: number;
      }> = [];

      for (const item of items) {
        let prod;
        if (item.productId) {
          [prod] = await db.select().from(products).where(eq(products.id, item.productId)).limit(1);
        }

        // If product not in catalog, create an ad-hoc product on the fly
        if (!prod) {
          const prodName = item.name || "Custom Item";
          [prod] = await db
            .insert(products)
            .values({
              organizationId: org.id,
              name: prodName,
              unitOfMeasure: item.unitOfMeasure || "PCS",
              purchasePrice: (item.unitPrice * 0.8).toFixed(2),
              sellingPrice: item.unitPrice.toFixed(2),
              taxPercent: (item.taxPercent || 0).toFixed(2),
              currentStock: "1000.00", // virtual stock for ad-hoc custom items
            })
            .returning();
        } else {
          // Pre-validation: Product exists in catalog -> Verify Available Stock
          const availableStock = Number(prod.currentStock);
          if (availableStock <= 0) {
            return c.json(
              {
                error: `Product '${prod.name}' is out of stock (Available: 0 ${prod.unitOfMeasure}).`,
              },
              400
            );
          }
          if (item.quantity > availableStock) {
            return c.json(
              {
                error: `Insufficient stock for product '${prod.name}'. Requested ${item.quantity} ${prod.unitOfMeasure}, but only ${availableStock} ${prod.unitOfMeasure} available in inventory.`,
              },
              400
            );
          }
        }

        resolvedItems.push({
          product: prod,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountPercent: item.discountPercent,
        });
      }

      // 4. Calculate Taxes & Totals
      const taxItems = resolvedItems.map((r) => {
        return {
          productId: r.product.id,
          itemName: r.product.name,
          hsnSac: r.product.hsnSac || "9999",
          unitOfMeasure: r.product.unitOfMeasure || "PCS",
          quantity: r.quantity,
          unitPrice: r.unitPrice,
          unitCost: Number(r.product.purchasePrice) || 0,
          taxPercent: Number(r.product.taxPercent) || 0,
          discountPercent: r.discountPercent,
        };
      });

      const taxResult = calculateInvoiceTaxes(
        taxItems,
        org.stateCode || "33",
        cust.stateCode || org.stateCode || "33"
      );

      // Determine payment status
      const grandTotal = taxResult.grandTotal;
      const actualPaid = Math.min(paidAmount, grandTotal);
      const balanceAmount = Number((grandTotal - actualPaid).toFixed(2));

      let status: "PAID" | "PARTIALLY_PAID" | "ISSUED" = "ISSUED";
      if (balanceAmount === 0 && actualPaid > 0) {
        status = "PAID";
      } else if (actualPaid > 0) {
        status = "PARTIALLY_PAID";
      }

      // Generate invoice number
      const nextNum = org.nextInvoiceNumber || 101;
      const invoiceNumber = `${org.invoicePrefix || "INV-"}${String(nextNum).padStart(4, "0")}`;

      // Generate UPI payment URL
      let upiPaymentUrl: string | null = null;
      if (org.upiVpa && balanceAmount > 0) {
        const upi = await generateDynamicUpiQr({
          vpa: org.upiVpa,
          payeeName: org.tradeName || org.legalName,
          amount: balanceAmount,
          invoiceNumber,
        });
        upiPaymentUrl = upi.upiUrl;
      }

      // 5. Execute Atomic Database Transaction with Row-Level Locks
      try {
        const result = await db.transaction(async (tx) => {
          // A. Insert Invoice
          const [inv] = await tx
            .insert(invoices)
            .values({
              organizationId: org.id,
              customerId: cust.id,
              invoiceType,
              invoiceNumber,
              invoiceDate: new Date().toISOString().split("T")[0],
              status,
              customerSnapshot: cust,
              sellerSnapshot: org,
              subtotal: taxResult.subtotal.toFixed(2),
              discountAmount: taxResult.itemDiscountTotal.toFixed(2),
              taxableAmount: taxResult.taxableAmount.toFixed(2),
              cgstAmount: taxResult.cgstAmount.toFixed(2),
              sgstAmount: taxResult.sgstAmount.toFixed(2),
              igstAmount: taxResult.igstAmount.toFixed(2),
              totalTaxAmount: taxResult.totalTaxAmount.toFixed(2),
              roundOff: taxResult.roundOff.toFixed(2),
              grandTotal: taxResult.grandTotal.toFixed(2),
              paidAmount: actualPaid.toFixed(2),
              balanceAmount: balanceAmount.toFixed(2),
              upiPaymentUrl,
              notes,
            })
            .returning();

          // B. Insert Line Items & Deduct Stock Atomically
          for (const item of taxResult.items) {
            await tx.insert(invoiceItems).values({
              invoiceId: inv.id,
              productId: item.productId,
              itemName: item.itemName,
              hsnSac: item.hsnSac,
              unitOfMeasure: item.unitOfMeasure,
              quantity: item.quantity.toFixed(2),
              unitCost: item.unitCost.toFixed(2),
              unitPrice: item.unitPrice.toFixed(2),
              discountPercent: item.discountPercent.toFixed(2),
              discountAmount: item.discountAmount.toFixed(2),
              taxableValue: item.taxableValue.toFixed(2),
              taxPercent: item.taxPercent.toFixed(2),
              cgstRate: item.cgstRate.toFixed(2),
              cgstAmount: item.cgstAmount.toFixed(2),
              sgstRate: item.sgstRate.toFixed(2),
              sgstAmount: item.sgstAmount.toFixed(2),
              igstRate: item.igstRate.toFixed(2),
              igstAmount: item.igstAmount.toFixed(2),
              totalAmount: item.totalAmount.toFixed(2),
            });

            // Stock deduction with PostgreSQL Row-Level Lock (FOR UPDATE)
            const [currentProd] = await tx
              .select()
              .from(products)
              .where(eq(products.id, item.productId))
              .for("update")
              .limit(1);

            if (currentProd) {
              const currentStockNum = Number(currentProd.currentStock);
              if (item.quantity > currentStockNum) {
                throw new Error(
                  `Insufficient stock for product '${currentProd.name}'. Requested ${item.quantity}, but only ${currentStockNum} available in inventory.`
                );
              }

              const updatedStock = currentStockNum - item.quantity;
              if (updatedStock < 0) {
                throw new Error(
                  `Negative inventory violation: Stock for '${currentProd.name}' cannot be less than zero.`
                );
              }

              await tx
                .update(products)
                .set({
                  currentStock: updatedStock.toFixed(2),
                  updatedAt: new Date(),
                })
                .where(eq(products.id, item.productId));

              // Log Stock Movement
              await tx.insert(stockMovements).values({
                organizationId: org.id,
                productId: item.productId,
                movementType: "SALE_INVOICE",
                referenceId: inv.id,
                quantityDelta: (-item.quantity).toFixed(2),
                unitCost: item.unitCost.toFixed(2),
                balanceAfterMovement: updatedStock.toFixed(2),
                notes: `Sale invoice ${invoiceNumber}`,
              });
            }
          }

          // C. Record Payment if paid > 0
          if (actualPaid > 0) {
            await tx.insert(payments).values({
              organizationId: org.id,
              invoiceId: inv.id,
              customerId: cust.id,
              paymentNumber: `PAY-${invoiceNumber}`,
              paymentDate: new Date().toISOString().split("T")[0],
              amount: actualPaid.toFixed(2),
              paymentMode,
              notes: `Payment for invoice ${invoiceNumber}`,
            });
          }

          // D. Update Customer Khata Balance
          if (balanceAmount > 0) {
            const newCustomerBalance = Number(cust.currentBalance || 0) + balanceAmount;
            await tx
              .update(customers)
              .set({
                currentBalance: newCustomerBalance.toFixed(2),
                updatedAt: new Date(),
              })
              .where(eq(customers.id, cust.id));
          }

          // E. Increment Organization Invoice Sequence
          await tx
            .update(organizations)
            .set({
              nextInvoiceNumber: nextNum + 1,
              updatedAt: new Date(),
            })
            .where(eq(organizations.id, org.id));

          return {
            invoice: inv,
            taxResult,
            customer: cust,
            upiUrl: upiPaymentUrl,
          };
        });

        return c.json(result, 201);
      } catch (err: any) {
        return c.json({ error: err.message || "Failed to process invoice transaction" }, 400);
      }
    }
  );
