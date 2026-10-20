"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
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

  async function openInvoiceDetails(id: string) {
    try {
      const res = await fetch(`/api/invoices/${id}`);
      const data = await res.json();
      setSelectedInvoice(data);
    } catch (err) {
      console.error("Failed to fetch invoice details:", err);
    }
  }

  const filteredInvoices = invoices.filter(
    (inv) =>
      inv.invoiceNumber?.toLowerCase().includes(search.toLowerCase()) ||
      inv.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      inv.customerPhone?.includes(search)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-emerald-400" />
            <span>Sales Invoices History</span>
          </h1>
          <p className="text-xs text-slate-400">
            View, audit, and print finalized GST tax invoices and customer receivables.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by invoice # or customer..."
            className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/80 text-xs font-semibold uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Invoice #</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3 text-right">Grand Total</th>
                <th className="px-4 py-3 text-right">Balance Due</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-500">
                    Loading invoices...
                  </td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-500">
                    No invoices found. Generate an invoice using Quick POS.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-emerald-400">
                      {inv.invoiceNumber}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">{inv.invoiceDate}</td>
                    <td className="px-4 py-3 font-medium text-white">
                      <div>{inv.customerName || "Walk-in Buyer"}</div>
                      <div className="text-[11px] text-slate-500">{inv.customerPhone}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-white">
                      {formatCurrency(inv.grandTotal)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {Number(inv.balanceAmount) > 0 ? (
                        <span className="text-amber-400 font-bold">
                          {formatCurrency(inv.balanceAmount)}
                        </span>
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
                      <button
                        onClick={() => openInvoiceDetails(inv.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Detail Modal with Printable Tax Invoice Layout */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-6 space-y-6 shadow-2xl relative my-8">
            <button
              onClick={() => setSelectedInvoice(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-lg bg-slate-800 border border-slate-700"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Print Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-800 pb-4 pr-12">
              <div>
                <h2 className="text-xl font-black text-white">
                  {selectedInvoice.organization?.legalName || "Sri Hari Traders"}
                </h2>
                <p className="text-xs text-slate-400">
                  {selectedInvoice.organization?.addressLine}, {selectedInvoice.organization?.city}
                </p>
                <p className="text-xs text-emerald-400 font-mono font-semibold">
                  GSTIN: {selectedInvoice.organization?.gstin || "33AAAAA0000A1Z5"} • State Code:{" "}
                  {selectedInvoice.organization?.stateCode || "33"}
                </p>
              </div>
              <div className="mt-3 sm:mt-0 text-left sm:text-right">
                <div className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                  Tax Invoice
                </div>
                <div className="text-lg font-mono font-black text-emerald-400">
                  {selectedInvoice.invoice.invoiceNumber}
                </div>
                <div className="text-xs text-slate-400">
                  Date: {selectedInvoice.invoice.invoiceDate}
                </div>
              </div>
            </div>

            {/* Buyer Details */}
            <div className="grid grid-cols-2 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
              <div>
                <div className="font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Bill To (Customer)
                </div>
                <div className="font-bold text-white text-sm">
                  {selectedInvoice.customer?.name}
                </div>
                <div className="text-slate-400">{selectedInvoice.customer?.billingAddress}</div>
                <div className="text-slate-400">Phone: {selectedInvoice.customer?.phone}</div>
                {selectedInvoice.customer?.gstin && (
                  <div className="text-emerald-400 font-mono font-medium mt-0.5">
                    GSTIN: {selectedInvoice.customer.gstin}
                  </div>
                )}
              </div>
              <div className="text-right space-y-1">
                <div>
                  <span className="text-slate-500">Status: </span>
                  <span className="font-bold text-emerald-400 uppercase">
                    {selectedInvoice.invoice.status}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Paid Amount: </span>
                  <span className="font-mono font-bold text-white">
                    {formatCurrency(selectedInvoice.invoice.paidAmount)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Balance Due: </span>
                  <span className="font-mono font-bold text-amber-400">
                    {formatCurrency(selectedInvoice.invoice.balanceAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="overflow-x-auto border border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
                  <tr>
                    <th className="px-3 py-2.5">Item</th>
                    <th className="px-3 py-2.5">HSN</th>
                    <th className="px-3 py-2.5 text-center">Qty</th>
                    <th className="px-3 py-2.5 text-right">Rate</th>
                    <th className="px-3 py-2.5 text-right">Taxable</th>
                    <th className="px-3 py-2.5 text-right">CGST</th>
                    <th className="px-3 py-2.5 text-right">SGST</th>
                    <th className="px-3 py-2.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {selectedInvoice.items?.map((item: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-800/20">
                      <td className="px-3 py-2 font-medium text-white">{item.itemName}</td>
                      <td className="px-3 py-2 text-slate-400 font-mono">{item.hsnSac}</td>
                      <td className="px-3 py-2 text-center font-mono">
                        {item.quantity} {item.unitOfMeasure}
                      </td>
                      <td className="px-3 py-2 text-right font-mono">{formatCurrency(item.unitPrice)}</td>
                      <td className="px-3 py-2 text-right font-mono">
                        {formatCurrency(item.taxableValue)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-slate-400">
                        {formatCurrency(item.cgstAmount)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-slate-400">
                        {formatCurrency(item.sgstAmount)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-white">
                        {formatCurrency(item.totalAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer Calculation & Dynamic UPI QR */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              {/* Dynamic UPI QR */}
              {selectedInvoice.upi?.qrDataUrl ? (
                <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <img
                    src={selectedInvoice.upi.qrDataUrl}
                    alt="UPI QR"
                    className="w-20 h-20 rounded-lg bg-white p-1"
                  />
                  <div className="text-xs">
                    <div className="font-bold text-white flex items-center gap-1">
                      <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Instant UPI Payment</span>
                    </div>
                    <div className="text-slate-400 text-[11px] mt-0.5">
                      Scan with GPay/PhonePe to settle balance of{" "}
                      <b className="text-emerald-400">
                        {formatCurrency(selectedInvoice.invoice.balanceAmount)}
                      </b>
                    </div>
                  </div>
                </div>
              ) : (
                <div />
              )}

              {/* Totals */}
              <div className="w-full sm:w-64 space-y-1.5 text-xs text-right">
                <div className="flex justify-between text-slate-400">
                  <span>Taxable Value:</span>
                  <span className="font-mono text-white">
                    {formatCurrency(selectedInvoice.invoice.taxableAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Total GST:</span>
                  <span className="font-mono text-white">
                    {formatCurrency(selectedInvoice.invoice.totalTaxAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Round Off:</span>
                  <span className="font-mono text-white">
                    {selectedInvoice.invoice.roundOff}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline text-sm">
                  <span className="font-bold text-white">Grand Total:</span>
                  <span className="font-mono font-black text-emerald-400 text-lg">
                    {formatCurrency(selectedInvoice.invoice.grandTotal)}
                  </span>
                </div>
              </div>
            </div>

            {/* Print Button */}
            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all"
              >
                <Printer className="w-4 h-4" />
                <span>Print Tax Invoice</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
