"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  TrendingUp,
  CreditCard,
  AlertTriangle,
  FileCheck,
  Zap,
  ArrowRight,
  Boxes,
  Users,
  FileText,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function DashboardPage() {
  const [data, setData] = useState<{
    sales?: any;
    lowStock?: any[];
    topDebtors?: any[];
    recentInvoices?: any[];
  }>({});
  const [companyName, setCompanyName] = useState<string>("Invoice Application");

  useEffect(() => {
    async function loadStats() {
      try {
        const [statsRes, orgRes] = await Promise.all([
          fetch("/api/dashboard/stats").then((r) => r.json()),
          fetch("/api/organization/current").then((r) => r.json()),
        ]);
        setData(statsRes);
        if (orgRes && (orgRes.tradeName || orgRes.legalName)) {
          setCompanyName(orgRes.tradeName || orgRes.legalName);
        }
      } catch (err) {
        console.error("Failed to load dashboard stats:", err);
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
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            {companyName} — Overview
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time sales velocity, inventory health, and customer Khata receivables.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/generatebill"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
          >
            <Zap className="w-4 h-4 fill-slate-950" />
            <span>Generate Bill</span>
          </Link>
          <Link
            href="/stock"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition-colors"
          >
            <Boxes className="w-4 h-4" />
            <span>Stock</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Sales */}
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Today's Sales</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-white font-mono">
            {formatCurrency(salesSummary?.todaySales || "0")}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {salesSummary?.todayInvoices || 0} bills generated today
          </p>
        </div>

        {/* Total Invoiced Volume */}
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">All-Time Revenue</span>
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-white font-mono">
            {formatCurrency(salesSummary?.totalSales || "0")}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Across {salesSummary?.totalInvoices || 0} total invoices
          </p>
        </div>

        {/* Khata Receivables Overdue */}
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Khata Receivables</span>
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-amber-400 font-mono">
            {formatCurrency(salesSummary?.totalOutstanding || "0")}
          </div>
          <p className="text-xs text-slate-400 mt-1">Total pending from credit buyers</p>
        </div>

        {/* Low Stock Watch */}
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Stock Alerts</span>
            <div className="p-2 bg-rose-500/10 text-rose-400 rounded-xl">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-rose-400 font-mono">
            {lowStockProducts.length} Items
          </div>
          <p className="text-xs text-slate-400 mt-1">Products at or below safety limit</p>
        </div>
      </div>

      {/* Main Grid: Recent Invoices & Top Debtors */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Invoices */}
        <div className="lg:col-span-2 bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white">Recent Invoices</h2>
              <p className="text-xs text-slate-400">Latest sales transactions and payment statuses</p>
            </div>
            <Link
              href="/invoices"
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/80 text-xs font-semibold uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-3 py-2.5">Invoice #</th>
                  <th className="px-3 py-2.5">Date</th>
                  <th className="px-3 py-2.5">Customer</th>
                  <th className="px-3 py-2.5 text-right">Amount</th>
                  <th className="px-3 py-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {recentInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-slate-500">
                      No invoices recorded yet. Click "Generate Bill" to create your first bill.
                    </td>
                  </tr>
                ) : (
                  recentInvoices.map((inv: any) => (
                    <tr key={inv.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-3 py-3 font-mono font-bold text-emerald-400">
                        {inv.invoiceNumber}
                      </td>
                      <td className="px-3 py-3 text-slate-400">{inv.invoiceDate}</td>
                      <td className="px-3 py-3 font-semibold text-white">
                        {inv.customerName || "Walk-in Buyer"}
                      </td>
                      <td className="px-3 py-3 text-right font-bold text-white font-mono">
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

        {/* Right 1 Col: Customer Due & Low Stock */}
        <div className="space-y-5">
          {/* Customer Due List */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
              <h3 className="font-bold text-xs uppercase text-slate-300 tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-amber-400" />
                <span>Customer Balances</span>
              </h3>
              <Link href="/customer" className="text-xs text-emerald-400 hover:underline">
                View
              </Link>
            </div>
            <div className="space-y-2.5">
              {topDebtors.length === 0 ? (
                <p className="text-xs text-slate-500 py-2 text-center">No outstanding balances.</p>
              ) : (
                topDebtors.map((cust: any) => (
                  <div
                    key={cust.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs"
                  >
                    <div>
                      <div className="font-bold text-white">{cust.name}</div>
                      <div className="text-[11px] text-slate-400">{cust.phone}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-amber-400 font-mono">
                        {formatCurrency(cust.currentBalance || "0")}
                      </div>
                      <div className="text-[10px] text-slate-500">Due</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Low Stock List */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
              <h3 className="font-bold text-xs uppercase text-slate-300 tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span>Low Stock Watch</span>
              </h3>
              <Link href="/stock" className="text-xs text-emerald-400 hover:underline">
                Stock
              </Link>
            </div>
            <div className="space-y-2.5">
              {lowStockProducts.length === 0 ? (
                <p className="text-xs text-slate-500 py-2 text-center">All products well stocked.</p>
              ) : (
                lowStockProducts.map((p: any) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs"
                  >
                    <div>
                      <div className="font-bold text-white">{p.name}</div>
                      <div className="text-[11px] text-slate-400">Unit: {p.unitOfMeasure}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-rose-400 font-mono">
                        {p.currentStock} {p.unitOfMeasure}
                      </div>
                      <div className="text-[10px] text-rose-500/80 font-medium">Reorder</div>
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
