"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  Search,
  Eye,
  Printer,
  X,
  CreditCard,
  QrCode,
  Calendar,
  User,
  Plus,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInvoices();
  }, []);

  async function loadInvoices() {
    try {
      setLoading(true);
      const res = await fetch("/api/invoices");
      const data = await res.json();
      if (Array.isArray(data)) {
        setInvoices(data);
      }
    } catch (err) {
      console.error("Failed to load invoices:", err);
    } finally {
      setLoading(false);
    }
  }

  const filteredInvoices = invoices.filter(
    (inv) =>
      inv.invoiceNumber?.toLowerCase().includes(search.toLowerCase()) ||
      inv.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      inv.customerPhone?.includes(search)
  );

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            <span>Invoices & Billing History</span>
          </h1>
          <p className="text-xs text-slate-400">
            View, audit, print, and track all finalized sales transactions.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search invoice # or customer..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-2.5" />
          </div>

          <Link
            href="/generatebill"
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Generate Bill</span>
          </Link>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse text-slate-300">
            <thead className="bg-slate-950/80 text-xs font-semibold uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Invoice #</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3 text-right">Grand Total</th>
                <th className="px-4 py-3 text-right">Balance Due</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center w-36">Print / Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-500">
                    Loading invoices...
                  </td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-500">
                    No invoices recorded yet. Click "Generate Bill" to create your first bill.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-emerald-400">
                      {inv.invoiceNumber}
                    </td>
                    <td className="px-4 py-3 text-slate-400">{inv.invoiceDate}</td>
                    <td className="px-4 py-3 font-bold text-white">
                      {inv.customerName || "Walk-in Buyer"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-white">
                      {formatCurrency(inv.grandTotal)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold">
                      {Number(inv.balanceAmount) > 0 ? (
                        <span className="text-amber-400">{formatCurrency(inv.balanceAmount)}</span>
                      ) : (
                        <span className="text-slate-500">₹0.00</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
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
                    <td className="px-4 py-3 text-center">
                      <Link
                        href={`/invoices/${inv.id}/print`}
                        target="_blank"
                        className="p-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 inline-flex items-center gap-1 shadow-xs transition-colors"
                      >
                        <Printer className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Print Bill</span>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
