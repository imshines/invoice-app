import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../db";
import { organizations } from "../db/schema";
import { eq } from "drizzle-orm";

export const organizationsRoute = new Hono()
  .get("/current", async (c) => {
    const [org] = await db.select().from(organizations).limit(1);
    if (!org) {
      return c.json({ error: "Organization not found" }, 404);
    }
    return c.json(org);
  })
  .post(
    "/current",
    zValidator(
      "json",
      z.object({
        legalName: z.string().min(2),
        tradeName: z.string().optional(),
        gstin: z.string().optional(),
        phonePrimary: z.string().min(10),
        phoneSecondary: z.string().optional(),
        upiVpa: z.string().optional(),
        addressLine: z.string().min(2),
        city: z.string().min(2),
        state: z.string().min(2),
        stateCode: z.string().length(2),
        pinCode: z.string().min(6),
        thermalHeader: z.string().optional(),
        thermalFooter: z.string().optional(),
      })
    ),
    async (c) => {
      const body = c.req.valid("json");
      const [existing] = await db.select().from(organizations).limit(1);

      if (existing) {
        const [updated] = await db
          .update(organizations)
          .set({
            ...body,
            updatedAt: new Date(),
          })
          .where(eq(organizations.id, existing.id))
          .returning();
        return c.json(updated);
      } else {
        const [created] = await db.insert(organizations).values(body).returning();
        return c.json(created, 201);
      }
    }
  );
