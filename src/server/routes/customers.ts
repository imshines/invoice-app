import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../db";
import { customers, invoices, payments, organizations } from "../db/schema";
import { eq, ilike, or, desc } from "drizzle-orm";

export const customersRoute = new Hono()
  .get("/", async (c) => {
    const q = c.req.query("q");
    let query = db.select().from(customers);

    if (q) {
      query = db
        .select()
        .from(customers)
        .where(
          or(
            ilike(customers.name, `%${q}%`),
            ilike(customers.phone, `%${q}%`),
            ilike(customers.area, `%${q}%`),
            ilike(customers.customerCode, `%${q}%`)
          )
        ) as any;
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
        customerCode: z.string().optional(),
        name: z.string().min(1, "Customer name is required"),
        area: z.string().optional(),
        phone: z.string().min(1, "Contact is required"),
        companyName: z.string().optional(),
        gstin: z.string().optional(),
        email: z.string().email().optional().or(z.literal("")),
        billingAddress: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        stateCode: z.string().optional(),
        pinCode: z.string().optional(),
        creditLimit: z.string().default("0.00"),
      })
    ),
    async (c) => {
      const body = c.req.valid("json");
      const [org] = await db.select().from(organizations).limit(1);

      const [newCustomer] = await db
        .insert(customers)
        .values({
          organizationId: org ? org.id : undefined,
          customerCode: body.customerCode || undefined,
          name: body.name,
          area: body.area || body.billingAddress || "",
          phone: body.phone,
          companyName: body.companyName || undefined,
          gstin: body.gstin || undefined,
          email: body.email || null,
          billingAddress: body.billingAddress || body.area || "Local",
          city: body.city || org?.city || "",
          state: body.state || org?.state || "",
          stateCode: body.stateCode || org?.stateCode || "",
          pinCode: body.pinCode || org?.pinCode || "",
          creditLimit: body.creditLimit || "0.00",
        })
        .returning();

      return c.json(newCustomer, 201);
    }
  )
  .put(
    "/:id",
    zValidator(
      "json",
      z.object({
        customerCode: z.string().optional(),
        name: z.string().min(1),
        area: z.string().optional(),
        phone: z.string().min(1),
        companyName: z.string().optional(),
        gstin: z.string().optional(),
        billingAddress: z.string().optional(),
        city: z.string().optional(),
        creditLimit: z.string().optional(),
      })
    ),
    async (c) => {
      const id = c.req.param("id");
      const body = c.req.valid("json");

      const [updated] = await db
        .update(customers)
        .set({
          ...body,
          updatedAt: new Date(),
        })
        .where(eq(customers.id, id))
        .returning();

      return c.json(updated);
    }
  )
  .delete("/:id", async (c) => {
    const id = c.req.param("id");
    await db.delete(customers).where(eq(customers.id, id));
    return c.json({ success: true });
  });
