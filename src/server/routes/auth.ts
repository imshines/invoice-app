import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../db";
import { users, organizations } from "../db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { setCookie, deleteCookie } from "hono/cookie";
import { getSessionUser } from "../auth";

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

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email.toLowerCase().trim()))
        .limit(1);

      if (!user) {
        return c.json({ error: "Invalid email or password" }, 401);
      }

      if (!user.isActive) {
        return c.json({ error: "This user account is deactivated. Contact your administrator." }, 403);
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

      // Set user session cookie (HTTP-only, secure, 7 days duration)
      setCookie(c, "user_session", user.id, {
        path: "/",
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 7, // 7 days
        sameSite: "Lax",
      });

      return c.json({
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
        },
        organization: org || null,
      });
    }
  )
  .get("/me", async (c) => {
    const user = await getSessionUser(c);
    const [org] = await db.select().from(organizations).limit(1);

    if (!user) {
      return c.json({ user: null, organization: org || null });
    }

    return c.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
      organization: org || null,
    });
  })
  .post("/logout", async (c) => {
    deleteCookie(c, "user_session", { path: "/" });
    return c.json({ success: true, message: "Logged out successfully" });
  });
