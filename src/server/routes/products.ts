import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../db";
import { products, stockMovements } from "../db/schema";
import { eq, ilike, or, desc, sql } from "drizzle-orm";

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
    const [prod] = await db.select().from(products).where(eq(products.id, id)).limit(1);
    if (!prod) {
      return c.json({ error: "Product not found" }, 404);
    }

    // Fetch product stock movement history
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
    zValidator(
      "json",
      z.object({
        name: z.string().min(2),
        sku: z.string().optional(),
        barcode: z.string().optional(),
        hsnSac: z.string().default("9999"),
        unitOfMeasure: z.string().default("PCS"),
        purchasePrice: z.string().default("0.00"),
        sellingPrice: z.string().min(1),
        taxPercent: z.string().default("5.00"),
        currentStock: z.string().default("0.00"),
        minStockAlert: z.string().default("5.00"),
      })
    ),
    async (c) => {
      const body = c.req.valid("json");

      const [newProduct] = await db
        .insert(products)
        .values({
          ...body,
          sku: body.sku || null,
          barcode: body.barcode || null,
        })
        .returning();

      // If initial stock is positive, record opening movement
      if (Number(newProduct.currentStock) > 0) {
        await db.insert(stockMovements).values({
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
  .post(
    "/:id/adjust-stock",
    zValidator(
      "json",
      z.object({
        delta: z.number(), // positive or negative
        reason: z.enum(["DAMAGE_WASTE", "AUDIT_ADJUSTMENT", "PURCHASE_INWARD"]),
        notes: z.string().optional(),
      })
    ),
    async (c) => {
      const id = c.req.param("id");
      const { delta, reason, notes } = c.req.valid("json");

      const [prod] = await db.select().from(products).where(eq(products.id, id)).limit(1);
      if (!prod) {
        return c.json({ error: "Product not found" }, 404);
      }

      const newBalance = Number(prod.currentStock) + delta;
      if (newBalance < 0) {
        return c.json({ error: "Insufficient stock balance" }, 400);
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
