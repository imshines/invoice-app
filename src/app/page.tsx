"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  TrendingUp,
  CreditCard,
  AlertTriangle,
  FileCheck,
  Zap,
  ArrowUpRight,
  Package,
  Users,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function DashboardPage() {
  const [data, setData] = useState<{
    sales?: any;
    lowStock?: any[];
    topDebtors?: any[];
    recentInvoices?: any[];
  }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch("/api/dashboard/stats");
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("Failed to load dashboard stats:", err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const salesSummary = data.sales;
  const lowStockProducts = data.lowStock || [];
  const topDebtors = data.topDebtors || [];
  const recentInvoices = data.recentInvoices || [];

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero Actions */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Business Overview & POS Control
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time sales velocity, inventory health, and customer Khata receivables.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/pos"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95"
          >
            <Zap className="w-5 h-5 fill-slate-950" />
            <span>Launch Quick POS</span>
          </Link>
          <Link
            href="/products"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-sm font-medium transition-all"
          >
            <Package className="w-4 h-4" />
            <span>Manage Stock</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Sales */}
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-xl relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Today's Sales</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-white">
            {formatCurrency(salesSummary?.todaySales || "0")}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {salesSummary?.todayInvoices || 0} bills generated today
          </p>
        </div>

        {/* Total Invoiced Volume */}
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-xl relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">All-Time Revenue</span>
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-white">
            {formatCurrency(salesSummary?.totalSales || "0")}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Across {salesSummary?.totalInvoices || 0} total invoices
          </p>
        </div>

        {/* Khata Receivables Overdue */}
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-xl relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Khata Receivables</span>
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-amber-400">
            {formatCurrency(salesSummary?.totalOutstanding || "0")}
          </div>
          <p className="text-xs text-slate-400 mt-1">Total pending from credit customers</p>
        </div>

        {/* Low Stock Watch */}
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-xl relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Stock Alerts</span>
            <div className="p-2 bg-rose-500/10 text-rose-400 rounded-lg">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-rose-400">
            {lowStockProducts.length} Items
          </div>
          <p className="text-xs text-slate-400 mt-1">Items at or below reorder safety limit</p>
        </div>
      </div>

      {/* Main Grid: Recent Invoices & Sidebar Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Invoices */}
        <div className="lg:col-span-2 bg-slate-900/70 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-white">Recent Invoices</h2>
              <p className="text-xs text-slate-400">Latest sales transactions and payment statuses</p>
            </div>
            <Link
              href="/invoices"
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800/60 text-xs font-semibold uppercase text-slate-400">
                <tr>
                  <th className="px-3 py-2.5 rounded-l-lg">Invoice #</th>
                  <th className="px-3 py-2.5">Date</th>
                  <th className="px-3 py-2.5">Customer</th>
                  <th className="px-3 py-2.5 text-right">Amount</th>
                  <th className="px-3 py-2.5 text-center rounded-r-lg">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {recentInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-slate-500">
                      No invoices recorded yet. Start billing via Quick POS!
                    </td>
                  </tr>
                ) : (
                  recentInvoices.map((inv: any) => (
                    <tr key={inv.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-3 py-3 font-mono font-medium text-emerald-400">
                        {inv.invoiceNumber}
                      </td>
                      <td className="px-3 py-3 text-slate-400 text-xs">{inv.invoiceDate}</td>
                      <td className="px-3 py-3 font-medium text-white">
                        {inv.customerName || "Walk-in Buyer"}
                      </td>
                      <td className="px-3 py-3 text-right font-bold text-white">
                        {formatCurrency(inv.grandTotal)}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            inv.status === "PAID"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                              : inv.status === "PARTIALLY_PAID"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                              : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Khata Debtors & Low Stock */}
        <div className="space-y-6">
          {/* Khata Outstanding */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                <span>Customer Khata Balances</span>
              </h3>
              <Link href="/customers" className="text-xs text-emerald-400 hover:underline">
                View
              </Link>
            </div>
            <div className="space-y-3">
              {topDebtors.length === 0 ? (
                <p className="text-xs text-slate-500 py-3 text-center">No outstanding credit.</p>
              ) : (
                topDebtors.map((cust: any) => (
                  <div
                    key={cust.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 border border-slate-800"
                  >
                    <div>
                      <div className="font-medium text-sm text-slate-200">{cust.name}</div>
                      <div className="text-[11px] text-slate-400">{cust.phone}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-sm text-amber-400">
                        {formatCurrency(cust.currentBalance || "0")}
                      </div>
                      <div className="text-[10px] text-slate-500">Overdue</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Low Stock Items */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>Stock Low Alerts</span>
              </h3>
              <Link href="/products" className="text-xs text-emerald-400 hover:underline">
                Restock
              </Link>
            </div>
            <div className="space-y-2.5">
              {lowStockProducts.length === 0 ? (
                <p className="text-xs text-slate-500 py-3 text-center">All products well stocked.</p>
              ) : (
                lowStockProducts.map((p: any) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 border border-slate-800"
                  >
                    <div>
                      <div className="font-medium text-sm text-slate-200">{p.name}</div>
                      <div className="text-[11px] text-slate-400">
                        SKU: {p.sku || "-"} • Alert at {p.minStockAlert} {p.unitOfMeasure}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-sm text-rose-400">
                        {p.currentStock} {p.unitOfMeasure}
                      </div>
                      <div className="text-[10px] text-rose-500/80 font-medium">Reorder Now</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
