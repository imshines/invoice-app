import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../db";
import { users, organizations } from "../db/schema";
import { eq, desc } from "drizzle-orm";
import bcrypt from "bcryptjs";

export const usersRoute = new Hono()
  .get("/", async (c) => {
    const list = await db
      .select({
        id: users.id,
        email: users.email,
        fullName: users.fullName,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt));

    return c.json(list);
  })
  .post(
    "/",
    zValidator(
      "json",
      z.object({
        fullName: z.string().min(1, "Full name or username is required"),
        email: z.string().email(),
        password: z.string().min(4, "Password must be at least 4 characters"),
        role: z.enum(["SUPERADMIN", "ORG_ADMIN", "BILLING_CASHIER", "INVENTORY_MANAGER", "ACCOUNTANT"]).default("BILLING_CASHIER"),
      })
    ),
    async (c) => {
      const { fullName, email, password, role } = c.req.valid("json");
      const [org] = await db.select().from(organizations).limit(1);

      const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (existing.length > 0) {
        return c.json({ error: "User with this email already exists" }, 400);
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const [newUser] = await db
        .insert(users)
        .values({
          organizationId: org ? org.id : undefined,
          fullName,
          email,
          passwordHash,
          role,
        })
        .returning({
          id: users.id,
          fullName: users.fullName,
          email: users.email,
          role: users.role,
          createdAt: users.createdAt,
        });

      return c.json(newUser, 201);
    }
  )
  .delete("/:id", async (c) => {
    const id = c.req.param("id");
    await db.delete(users).where(eq(users.id, id));
    return c.json({ success: true });
  });
