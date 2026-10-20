"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  TrendingUp,
  CreditCard,
  AlertTriangle,
  FileCheck,
  Plus,
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
      <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">
            {companyName} — Overview
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Real-time stock levels, customer ledger balances, and sales summary.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/generatebill"
            className="flex items-center gap-1.5 px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors"
          >
            <FileText className="w-4 h-4" />
            <span>Generate Bill</span>
          </Link>
          <Link
            href="/stock"
            className="flex items-center gap-1.5 px-3 py-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 font-semibold text-xs transition-colors"
          >
            <Boxes className="w-4 h-4" />
            <span>Stock</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Sales */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Today's Sales</span>
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-gray-900 font-mono">
            {formatCurrency(salesSummary?.todaySales || "0")}
          </div>
          <p className="text-[11px] text-gray-500 mt-1">
            {salesSummary?.todayInvoices || 0} bills generated today
          </p>
        </div>

        {/* Total Invoiced Volume */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Sales</span>
            <div className="p-1.5 bg-green-50 text-green-600 rounded">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-gray-900 font-mono">
            {formatCurrency(salesSummary?.totalSales || "0")}
          </div>
          <p className="text-[11px] text-gray-500 mt-1">
            Across {salesSummary?.totalInvoices || 0} invoices
          </p>
        </div>

        {/* Outstanding Receivables */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Customer Due</span>
            <div className="p-1.5 bg-amber-50 text-amber-600 rounded">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-amber-600 font-mono">
            {formatCurrency(salesSummary?.totalOutstanding || "0")}
          </div>
          <p className="text-[11px] text-gray-500 mt-1">Total pending from credit buyers</p>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Low Stock</span>
            <div className="p-1.5 bg-red-50 text-red-600 rounded">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-red-600 font-mono">
            {lowStockProducts.length} Items
          </div>
          <p className="text-[11px] text-gray-500 mt-1">Products below safety stock level</p>
        </div>
      </div>

      {/* Main Grid: Recent Invoices & Top Debtors */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Invoices */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg shadow-xs overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-sm text-gray-800">Recent Invoices</h2>
            <Link
              href="/invoices"
              className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-600 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-2">Invoice #</th>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Customer</th>
                  <th className="px-3 py-2 text-right">Amount</th>
                  <th className="px-3 py-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {recentInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-gray-400">
                      No invoices yet. Click "Generate Bill" to create your first bill.
                    </td>
                  </tr>
                ) : (
                  recentInvoices.map((inv: any) => (
                    <tr key={inv.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2.5 font-mono font-bold text-blue-600">
                        {inv.invoiceNumber}
                      </td>
                      <td className="px-3 py-2.5 text-gray-500">{inv.invoiceDate}</td>
                      <td className="px-3 py-2.5 font-semibold text-gray-800">
                        {inv.customerName || "Walk-in Buyer"}
                      </td>
                      <td className="px-3 py-2.5 text-right font-bold text-gray-900 font-mono">
                        {formatCurrency(inv.grandTotal)}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            inv.status === "PAID"
                              ? "bg-green-100 text-green-700"
                              : inv.status === "PARTIALLY_PAID"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-red-100 text-red-700"
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
        <div className="space-y-4">
          {/* Customer Due List */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-xs p-4">
            <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
              <h3 className="font-bold text-xs uppercase text-gray-700 tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-amber-600" />
                <span>Customer Balances</span>
              </h3>
              <Link href="/customer" className="text-xs text-blue-600 hover:underline">
                View
              </Link>
            </div>
            <div className="space-y-2">
              {topDebtors.length === 0 ? (
                <p className="text-xs text-gray-400 py-2 text-center">No outstanding balances.</p>
              ) : (
                topDebtors.map((cust: any) => (
                  <div
                    key={cust.id}
                    className="flex items-center justify-between p-2 rounded bg-gray-50 text-xs"
                  >
                    <div>
                      <div className="font-bold text-gray-800">{cust.name}</div>
                      <div className="text-[11px] text-gray-500">{cust.phone}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-amber-600 font-mono">
                        {formatCurrency(cust.currentBalance || "0")}
                      </div>
                      <div className="text-[10px] text-gray-400">Due</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Low Stock List */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-xs p-4">
            <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
              <h3 className="font-bold text-xs uppercase text-gray-700 tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                <span>Low Stock Watch</span>
              </h3>
              <Link href="/stock" className="text-xs text-blue-600 hover:underline">
                Stock
              </Link>
            </div>
            <div className="space-y-2">
              {lowStockProducts.length === 0 ? (
                <p className="text-xs text-gray-400 py-2 text-center">All products well stocked.</p>
              ) : (
                lowStockProducts.map((p: any) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-2 rounded bg-gray-50 text-xs"
                  >
                    <div>
                      <div className="font-bold text-gray-800">{p.name}</div>
                      <div className="text-[11px] text-gray-500">Unit: {p.unitOfMeasure}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-red-600 font-mono">
                        {p.currentStock} {p.unitOfMeasure}
                      </div>
                      <div className="text-[10px] text-red-500 font-medium">Reorder</div>
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
