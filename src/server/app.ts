import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { authRoute } from "./routes/auth";
import { customersRoute } from "./routes/customers";
import { productsRoute } from "./routes/products";
import { invoicesRoute } from "./routes/invoices";
import { dashboardRoute } from "./routes/dashboard";
import { organizationsRoute } from "./routes/organizations";

export const app = new Hono().basePath("/api");

app.use("*", logger());
app.use("*", cors());

// Healthcheck
app.get("/health", (c) => {
  return c.json({
    status: "ok",
    version: "2.0.0",
    engine: "Next.js 16 + Hono + PostgreSQL 18",
    time: new Date().toISOString(),
  });
});

// Mount Routes
const routes = app
  .route("/auth", authRoute)
  .route("/customers", customersRoute)
  .route("/products", productsRoute)
  .route("/invoices", invoicesRoute)
  .route("/dashboard", dashboardRoute)
  .route("/organization", organizationsRoute);

export type AppType = typeof routes;
export default app;
