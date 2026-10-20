import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../db";
import { customers, invoices, payments } from "../db/schema";
import { eq, ilike, or, desc } from "drizzle-orm";

export const customersRoute = new Hono()
  .get("/", async (c) => {
    const q = c.req.query("q");
    let query = db.select().from(customers);

    if (q) {
      query = db
        .select()
        .from(customers)
        .where(or(ilike(customers.name, `%${q}%`), ilike(customers.phone, `%${q}%`))) as any;
    }

    const list = await query.orderBy(desc(customers.updatedAt));
    return c.json(list);
  })
  .get("/:id", async (c) => {
    const id = c.req.param("id");
    const [customer] = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
    if (!customer) {
      return c.json({ error: "Customer not found" }, 404);
    }

    // Fetch recent invoices and payments for customer Khata ledger
    const customerInvoices = await db
      .select()
      .from(invoices)
      .where(eq(invoices.customerId, id))
      .orderBy(desc(invoices.invoiceDate))
      .limit(10);

    const customerPayments = await db
      .select()
      .from(payments)
      .where(eq(payments.customerId, id))
      .orderBy(desc(payments.paymentDate))
      .limit(10);

    return c.json({
      customer,
      recentInvoices: customerInvoices,
      recentPayments: customerPayments,
    });
  })
  .post(
    "/",
    zValidator(
      "json",
      z.object({
        name: z.string().min(2),
        companyName: z.string().optional(),
        gstin: z.string().optional(),
        phone: z.string().min(10),
        email: z.string().email().optional().or(z.literal("")),
        billingAddress: z.string().min(1),
        city: z.string().default("Coimbatore"),
        state: z.string().default("Tamil Nadu"),
        stateCode: z.string().default("33"),
        pinCode: z.string().optional(),
        creditLimit: z.string().default("0.00"),
      })
    ),
    async (c) => {
      const body = c.req.valid("json");
      const [org] = await db.select().from(db.query ? (customers as any) : customers).limit(1); // placeholder for multi-tenant context

      const [newCustomer] = await db
        .insert(customers)
        .values({
          ...body,
          email: body.email || null,
          creditLimit: body.creditLimit || "0.00",
        })
        .returning();

      return c.json(newCustomer, 201);
    }
  );
