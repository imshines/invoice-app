import { Hono } from "hono";
import { db } from "../db";
import { invoices, products, customers, organizations } from "../db/schema";
import { sql, desc, eq } from "drizzle-orm";
import { requireAuth } from "../auth";

export const dashboardRoute = new Hono().get("/stats", requireAuth, async (c) => {
  const today = new Date().toISOString().split("T")[0];

  // 1. Total & Today's Sales
  const [salesSummary] = await db
    .select({
      totalSales: sql<string>`COALESCE(SUM(${invoices.grandTotal}), 0)`,
      totalInvoices: sql<number>`COUNT(${invoices.id})`,
      todaySales: sql<string>`COALESCE(SUM(CASE WHEN ${invoices.invoiceDate} = ${today} THEN ${invoices.grandTotal} ELSE 0 END), 0)`,
      todayInvoices: sql<number>`COUNT(CASE WHEN ${invoices.invoiceDate} = ${today} THEN 1 END)`,
      totalOutstanding: sql<string>`COALESCE(SUM(${invoices.balanceAmount}), 0)`,
    })
    .from(invoices);

  // 2. Low Stock Alerts
  const lowStockProducts = await db
    .select()
    .from(products)
    .where(sql`${products.currentStock} <= ${products.minStockAlert}`)
    .orderBy(products.currentStock)
    .limit(10);

  // 3. Top Customers with Outstanding Khata Balance
  const topDebtors = await db
    .select()
    .from(customers)
    .where(sql`${customers.currentBalance} > 0`)
    .orderBy(desc(customers.currentBalance))
    .limit(5);

  // 4. Recent Invoices
  const recentInvoices = await db
    .select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      invoiceDate: invoices.invoiceDate,
      customerName: customers.name,
      grandTotal: invoices.grandTotal,
      balanceAmount: invoices.balanceAmount,
      status: invoices.status,
    })
    .from(invoices)
    .leftJoin(customers, eq(invoices.customerId, customers.id))
    .orderBy(desc(invoices.createdAt))
    .limit(5);

  return c.json({
    sales: salesSummary,
    lowStock: lowStockProducts,
    topDebtors,
    recentInvoices,
  });
});
