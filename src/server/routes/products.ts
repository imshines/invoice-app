import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../db";
import { products, stockMovements, organizations } from "../db/schema";
import { eq, ilike, or, desc } from "drizzle-orm";
import { requireAuth, requireRole } from "../auth";

export const productsRoute = new Hono()
  .get("/", async (c) => {
    const q = c.req.query("q");
    const barcode = c.req.query("barcode");

    if (barcode) {
      const [prod] = await db.select().from(products).where(eq(products.barcode, barcode)).limit(1);
      return c.json(prod ? [prod] : []);
    }

    let query = db.select().from(products);
    if (q) {
      query = db
        .select()
        .from(products)
        .where(
          or(
            ilike(products.name, `%${q}%`),
            ilike(products.sku, `%${q}%`),
            ilike(products.barcode, `%${q}%`)
          )
        ) as any;
    }

    const list = await query.orderBy(desc(products.updatedAt));
    return c.json(list);
  })
  .get("/:id", async (c) => {
    const id = c.req.param("id");
    if (!id) return c.json({ error: "Missing ID" }, 400);
    const [prod] = await db.select().from(products).where(eq(products.id, id)).limit(1);
    if (!prod) {
      return c.json({ error: "Product not found" }, 404);
    }

    const movements = await db
      .select()
      .from(stockMovements)
      .where(eq(stockMovements.productId, id))
      .orderBy(desc(stockMovements.createdAt))
      .limit(20);

    return c.json({ product: prod, movements });
  })
  .post(
    "/",
    requireRole("ORG_ADMIN", "SUPERADMIN", "INVENTORY_MANAGER"),
    zValidator(
      "json",
      z.object({
        sku: z.string().optional(),
        name: z.string().min(1, "Product name is required"),
        unitOfMeasure: z.string().min(1, "Unit of measure is required"),
        currentStock: z.string().default("0"),
        taxPercent: z.string().default("0.00"),
        purchasePrice: z.string().default("0.00"),
        sellingPrice: z.string().min(1, "Price is required"),
        barcode: z.string().optional(),
        hsnSac: z.string().default("9999"),
        minStockAlert: z.string().default("5.00"),
      })
    ),
    async (c) => {
      const body = c.req.valid("json");
      const [org] = await db.select().from(organizations).limit(1);

      const [newProduct] = await db
        .insert(products)
        .values({
          organizationId: org ? org.id : undefined,
          sku: body.sku || undefined,
          name: body.name,
          unitOfMeasure: body.unitOfMeasure,
          currentStock: body.currentStock,
          taxPercent: body.taxPercent,
          purchasePrice: body.purchasePrice || "0.00",
          sellingPrice: body.sellingPrice,
          barcode: body.barcode || null,
          hsnSac: body.hsnSac || "9999",
          minStockAlert: body.minStockAlert || "5.00",
        })
        .returning();

      if (Number(newProduct.currentStock) > 0) {
        await db.insert(stockMovements).values({
          organizationId: org ? org.id : undefined,
          productId: newProduct.id,
          movementType: "PURCHASE_INWARD",
          quantityDelta: newProduct.currentStock,
          unitCost: newProduct.purchasePrice,
          balanceAfterMovement: newProduct.currentStock,
          notes: "Initial inventory setup",
        });
      }

      return c.json(newProduct, 201);
    }
  )
  .put(
    "/:id",
    requireRole("ORG_ADMIN", "SUPERADMIN", "INVENTORY_MANAGER"),
    zValidator(
      "json",
      z.object({
        sku: z.string().optional(),
        name: z.string().min(1),
        unitOfMeasure: z.string().min(1),
        currentStock: z.string().optional(),
        taxPercent: z.string().optional(),
        purchasePrice: z.string().optional(),
        sellingPrice: z.string().min(1),
        barcode: z.string().optional(),
        hsnSac: z.string().optional(),
      })
    ),
    async (c) => {
      const id = c.req.param("id");
      if (!id) return c.json({ error: "Missing ID" }, 400);
      const body = c.req.valid("json");

      const [updated] = await db
        .update(products)
        .set({
          ...body,
          updatedAt: new Date(),
        })
        .where(eq(products.id, id))
        .returning();

      return c.json(updated);
    }
  )
  .delete("/:id", requireRole("ORG_ADMIN", "SUPERADMIN"), async (c) => {
    const id = c.req.param("id");
    if (!id) return c.json({ error: "Missing ID" }, 400);
    await db.delete(products).where(eq(products.id, id));
    return c.json({ success: true });
  })
  .post(
    "/:id/adjust-stock",
    requireRole("ORG_ADMIN", "SUPERADMIN", "INVENTORY_MANAGER"),
    zValidator(
      "json",
      z.object({
        delta: z.number(),
        reason: z.enum(["DAMAGE_WASTE", "AUDIT_ADJUSTMENT", "PURCHASE_INWARD"]),
        notes: z.string().optional(),
      })
    ),
    async (c) => {
      const id = c.req.param("id");
      if (!id) return c.json({ error: "Missing ID" }, 400);
      const { delta, reason, notes } = c.req.valid("json");

      const [prod] = await db.select().from(products).where(eq(products.id, id)).limit(1);
      if (!prod) {
        return c.json({ error: "Product not found" }, 404);
      }

      const newBalance = Number(prod.currentStock) + delta;
      if (newBalance < 0) {
        return c.json({ error: "Insufficient stock balance: stock cannot be negative" }, 400);
      }

      const [updated] = await db
        .update(products)
        .set({
          currentStock: newBalance.toFixed(2),
          updatedAt: new Date(),
        })
        .where(eq(products.id, id))
        .returning();

      await db.insert(stockMovements).values({
        productId: id,
        movementType: reason,
        quantityDelta: delta.toFixed(2),
        unitCost: prod.purchasePrice,
        balanceAfterMovement: newBalance.toFixed(2),
        notes: notes || `Manual stock adjustment: ${reason}`,
      });

      return c.json(updated);
    }
  );
