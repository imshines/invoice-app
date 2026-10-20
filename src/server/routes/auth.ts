import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../db";
import { users, organizations } from "../db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";

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

      // Set cookie session
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
        organization: org,
      });
    }
  )
  .get("/me", async (c) => {
    const sessionUserId = getCookie(c, "user_session");

    let user;
    if (sessionUserId) {
      [user] = await db.select().from(users).where(eq(users.id, sessionUserId)).limit(1);
    }

    // Default to the first admin user in database if no session cookie
    if (!user) {
      [user] = await db.select().from(users).limit(1);
    }

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
      organization: org,
    });
  })
  .post("/logout", async (c) => {
    deleteCookie(c, "user_session", { path: "/" });
    return c.json({ success: true });
  });
