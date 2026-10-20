import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../db";
import { organizations } from "../db/schema";
import { eq } from "drizzle-orm";
import { requireAuth, requireRole } from "../auth";

export const organizationsRoute = new Hono()
  // Any logged-in user can view organization profile info
  .get("/current", async (c) => {
    const [org] = await db.select().from(organizations).limit(1);
    if (!org) {
      return c.json({
        id: "",
        legalName: "Invoice Application",
        tradeName: "Invoice Application",
        gstin: "",
        phonePrimary: "",
        addressLine: "",
        city: "",
        pinCode: "",
      });
    }
    return c.json(org);
  })
  // Only Admin can update company profile, tax info, and thermal headers
  .post(
    "/current",
    requireRole("ORG_ADMIN", "SUPERADMIN"),
    zValidator(
      "json",
      z.object({
        company: z.string().optional(),
        legalName: z.string().optional(),
        tradeName: z.string().optional(),
        tin: z.string().optional(),
        gstin: z.string().optional(),
        mob1: z.string().optional(),
        phonePrimary: z.string().optional(),
        mob2: z.string().optional(),
        phoneSecondary: z.string().optional(),
        addr: z.string().optional(),
        addressLine: z.string().optional(),
        city: z.string().optional(),
        pin: z.string().optional(),
        pinCode: z.string().optional(),
        upiVpa: z.string().optional(),
        state: z.string().optional(),
        stateCode: z.string().optional(),
        thermalHeader: z.string().optional(),
        thermalFooter: z.string().optional(),
      })
    ),
    async (c) => {
      const body = c.req.valid("json");
      const legalName = body.company || body.legalName || body.tradeName || "Invoice Application";
      const tradeName = body.tradeName || body.company || body.legalName || "Invoice Application";
      const gstin = body.tin || body.gstin || null;
      const phonePrimary = body.mob1 || body.phonePrimary || "";
      const phoneSecondary = body.mob2 || body.phoneSecondary || null;
      const addressLine = body.addr || body.addressLine || "";
      const city = body.city || "";
      const pinCode = body.pin || body.pinCode || "";
      const upiVpa = body.upiVpa || null;
      const state = body.state || "";
      const stateCode = body.stateCode || "33";
      const thermalHeader = body.thermalHeader;
      const thermalFooter = body.thermalFooter;

      const [existing] = await db.select().from(organizations).limit(1);

      if (existing) {
        const [updated] = await db
          .update(organizations)
          .set({
            legalName,
            tradeName,
            gstin,
            phonePrimary,
            phoneSecondary,
            addressLine,
            city,
            pinCode,
            upiVpa,
            state,
            stateCode,
            thermalHeader: thermalHeader !== undefined ? thermalHeader : existing.thermalHeader,
            thermalFooter: thermalFooter !== undefined ? thermalFooter : existing.thermalFooter,
            updatedAt: new Date(),
          })
          .where(eq(organizations.id, existing.id))
          .returning();
        return c.json(updated);
      } else {
        const [created] = await db
          .insert(organizations)
          .values({
            legalName,
            tradeName,
            gstin,
            phonePrimary,
            phoneSecondary,
            addressLine,
            city,
            pinCode,
            upiVpa,
            state,
            stateCode,
            thermalHeader,
            thermalFooter,
          })
          .returning();
        return c.json(created, 201);
      }
    }
  );
