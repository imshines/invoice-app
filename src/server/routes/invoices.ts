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

export const invoicesRoute = new Hono()
  .get("/", async (c) => {
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
  .get("/:id", async (c) => {
    const id = c.req.param("id");

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

    // Generate fresh dynamic UPI QR for this invoice if not paid in full
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
      customer,
      organization: org,
      upi: upiData,
    });
  })
  .post(
    "/",
    zValidator(
      "json",
      z.object({
        customerId: z.string().uuid(),
        invoiceType: z.enum(["TAX_INVOICE", "RETAIL_BILL", "PROFORMA", "QUOTATION"]).default("TAX_INVOICE"),
        items: z
          .array(
            z.object({
              productId: z.string().uuid(),
              quantity: z.number().positive(),
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
      const { customerId, invoiceType, items, paymentMode, paidAmount, notes } = c.req.valid("json");

      // 1. Fetch Organization details
      const [org] = await db.select().from(organizations).limit(1);
      if (!org) {
        return c.json({ error: "Organization profile not configured" }, 400);
      }

      // 2. Fetch Customer details
      const [cust] = await db.select().from(customers).where(eq(customers.id, customerId)).limit(1);
      if (!cust) {
        return c.json({ error: "Customer not found" }, 404);
      }

      // 3. Fetch product details and check stock
      const productIds = items.map((i) => i.productId);
      const dbProducts = await db.select().from(products).where(sql`${products.id} IN ${productIds}`);

      const productMap = new Map(dbProducts.map((p) => [p.id, p]));

      // Check product existence and stock
      for (const item of items) {
        const prod = productMap.get(item.productId);
        if (!prod) {
          return c.json({ error: `Product with ID ${item.productId} not found` }, 400);
        }
        if (Number(prod.currentStock) < item.quantity) {
          return c.json(
            {
              error: `Insufficient stock for '${prod.name}'. Available: ${prod.currentStock}, Requested: ${item.quantity}`,
            },
            400
          );
        }
      }

      // 4. Calculate Taxes & Totals
      const taxItems = items.map((item) => {
        const prod = productMap.get(item.productId)!;
        return {
          productId: prod.id,
          itemName: prod.name,
          hsnSac: prod.hsnSac,
          unitOfMeasure: prod.unitOfMeasure,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          unitCost: Number(prod.purchasePrice),
          taxPercent: Number(prod.taxPercent),
          discountPercent: item.discountPercent,
        };
      });

      const taxResult = calculateInvoiceTaxes(taxItems, org.stateCode, cust.stateCode || org.stateCode);

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

      // 5. Execute Atomic Database Transaction
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

        // B. Insert Line Items & Deduct Stock
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

          // Atomic stock deduction
          const prod = productMap.get(item.productId)!;
          const updatedStock = Number(prod.currentStock) - item.quantity;

          await tx
            .update(products)
            .set({
              currentStock: updatedStock.toFixed(2),
              updatedAt: new Date(),
            })
            .where(eq(products.id, item.productId));

          // Log REA Stock Movement
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

        // C. Record Payment if paid > 0 (REA Economic Duality)
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

        // D. Update Customer Khata Balance (Accounts Receivable)
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

        // E. Increment Organization Invoice Number
        await tx
          .update(organizations)
          .set({
            nextInvoiceNumber: nextNum + 1,
            updatedAt: new Date(),
          })
          .where(eq(organizations.id, org.id));

        return inv;
      });

      return c.json(result, 201);
    }
  );
