import { hc } from "hono/client";
import type { AppType } from "@/server/app";

// End-to-end typed client for client and server components
export const client = hc<AppType>(
  typeof window !== "undefined"
    ? window.location.origin
    : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
);
