import { Context, Next } from "hono";
import { getCookie, deleteCookie } from "hono/cookie";
import { db } from "./db";
import { users, organizations } from "./db/schema";
import { eq } from "drizzle-orm";

export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  role: "SUPERADMIN" | "ORG_ADMIN" | "BILLING_CASHIER" | "INVENTORY_MANAGER" | "ACCOUNTANT";
  organizationId: string | null;
}

/**
 * Retrieves the currently logged in user based on the `user_session` cookie.
 * If the session cookie is invalid or user no longer exists, clears the stale cookie.
 */
export async function getSessionUser(c: Context): Promise<SessionUser | null> {
  const sessionUserId = getCookie(c, "user_session");
  if (!sessionUserId) {
    return null;
  }

  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      role: users.role,
      organizationId: users.organizationId,
      isActive: users.isActive,
    })
    .from(users)
    .where(eq(users.id, sessionUserId))
    .limit(1);

  if (!user || !user.isActive) {
    // Clear stale or deleted session cookie
    deleteCookie(c, "user_session", { path: "/" });
    return null;
  }

  return user as SessionUser;
}

/**
 * Hono Middleware: Requires that a user is authenticated.
 */
export async function requireAuth(c: Context, next: Next) {
  const user = await getSessionUser(c);
  if (!user) {
    deleteCookie(c, "user_session", { path: "/" });
    return c.json({ error: "Unauthorized: Please log in to continue." }, 401);
  }

  c.set("user", user);
  await next();
}

/**
 * Hono Middleware: Requires specific roles (e.g. ORG_ADMIN).
 */
export function requireRole(...allowedRoles: Array<SessionUser["role"]>) {
  return async (c: Context, next: Next) => {
    const user = await getSessionUser(c);
    if (!user) {
      deleteCookie(c, "user_session", { path: "/" });
      return c.json({ error: "Unauthorized: Please log in to continue." }, 401);
    }

    if (!allowedRoles.includes(user.role)) {
      return c.json(
        {
          error: `Forbidden: This action requires one of the following roles: [${allowedRoles.join(", ")}]. Your role is '${user.role}'.`,
        },
        403
      );
    }

    c.set("user", user);
    await next();
  };
}
