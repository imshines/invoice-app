import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../db";
import { users, organizations } from "../db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export const authRoute = new Hono()
  .post(
    "/login",
    zValidator(
      "json",
      z.object({
        email: z.string().email(),
        password: z.string().min(1),
      })
    ),
    async (c) => {
      const { email, password } = c.req.valid("json");

      const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (!user) {
        return c.json({ error: "Invalid email or password" }, 401);
      }

      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return c.json({ error: "Invalid email or password" }, 401);
      }

      const [org] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, user.organizationId!))
        .limit(1);

      return c.json({
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
        },
        organization: org,
      });
    }
  )
  .get("/me", async (c) => {
    // Default to the first org & admin user in dev
    const [user] = await db.select().from(users).limit(1);
    const [org] = await db.select().from(organizations).limit(1);

    if (!user || !org) {
      return c.json({ error: "No organization found" }, 404);
    }

    return c.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
      organization: org,
    });
  });
