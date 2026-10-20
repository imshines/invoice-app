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
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3 rounded-lg border border-gray-200 shadow-xs">
        <h1 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <span>Invoices History</span>
        </h1>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search invoice # or customer..."
              className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
            />
            <Search className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-2.5" />
          </div>

          <Link
            href="/generatebill"
            className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs inline-flex items-center gap-1 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Bill</span>
          </Link>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-gray-100 text-xs font-semibold text-gray-700 border-b border-gray-200">
              <tr>
                <th className="px-4 py-2.5 border-r border-gray-200">Invoice #</th>
                <th className="px-4 py-2.5 border-r border-gray-200">Date</th>
                <th className="px-4 py-2.5 border-r border-gray-200">Customer</th>
                <th className="px-4 py-2.5 border-r border-gray-200 text-right">Grand Total</th>
                <th className="px-4 py-2.5 border-r border-gray-200 text-right">Balance Due</th>
                <th className="px-4 py-2.5 border-r border-gray-200 text-center">Status</th>
                <th className="px-4 py-2.5 text-center w-24">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">
                    Loading invoices...
                  </td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">
                    No invoices recorded yet.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 border-r border-gray-200 font-mono font-bold text-blue-600">
                      {inv.invoiceNumber}
                    </td>
                    <td className="px-4 py-2.5 border-r border-gray-200 text-gray-600">
                      {inv.invoiceDate}
                    </td>
                    <td className="px-4 py-2.5 border-r border-gray-200 font-semibold text-gray-900">
                      {inv.customerName || "Walk-in Buyer"}
                    </td>
                    <td className="px-4 py-2.5 border-r border-gray-200 text-right font-mono font-bold text-gray-900">
                      {formatCurrency(inv.grandTotal)}
                    </td>
                    <td className="px-4 py-2.5 border-r border-gray-200 text-right font-mono font-bold">
                      {Number(inv.balanceAmount) > 0 ? (
                        <span className="text-amber-600">{formatCurrency(inv.balanceAmount)}</span>
                      ) : (
                        <span className="text-gray-400">₹0.00</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 border-r border-gray-200 text-center">
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
                    <td className="px-4 py-2.5 text-center">
                      <button
                        onClick={() => openInvoiceDetails(inv.id)}
                        className="p-1 px-2.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold border border-gray-300 inline-flex items-center gap-1 shadow-xs"
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

      {/* Invoice Detail Modal with Clean Tax Invoice Layout */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-lg border border-gray-200 max-w-2xl w-full p-6 space-y-4 shadow-xl relative my-8">
            <button
              onClick={() => setSelectedInvoice(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1.5"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Print Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-gray-200 pb-3 pr-8">
              <div>
                <h2 className="text-lg font-black text-gray-900">
                  {selectedInvoice.organization?.legalName || selectedInvoice.organization?.tradeName || "Invoice Application"}
                </h2>
                <p className="text-xs text-gray-600">
                  {selectedInvoice.organization?.addressLine}, {selectedInvoice.organization?.city}
                </p>
                {selectedInvoice.organization?.gstin && (
                  <p className="text-xs text-blue-700 font-mono font-semibold">
                    GSTIN: {selectedInvoice.organization.gstin}
                  </p>
                )}
              </div>
              <div className="mt-2 sm:mt-0 text-left sm:text-right">
                <div className="text-xs uppercase font-bold text-gray-500">Tax Invoice</div>
                <div className="text-base font-mono font-black text-blue-700">
                  {selectedInvoice.invoice.invoiceNumber}
                </div>
                <div className="text-xs text-gray-500">
                  Date: {selectedInvoice.invoice.invoiceDate}
                </div>
              </div>
            </div>

            {/* Buyer Details */}
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-md border border-gray-200 text-xs">
              <div>
                <div className="font-semibold text-gray-500 uppercase tracking-wider mb-0.5">
                  Buyer Details
                </div>
                <div className="font-bold text-gray-900 text-sm">
                  {selectedInvoice.customer?.name}
                </div>
                <div className="text-gray-600">
                  Area: {selectedInvoice.customer?.area || selectedInvoice.customer?.billingAddress || "-"}
                </div>
                <div className="text-gray-600">Contact: {selectedInvoice.customer?.phone}</div>
              </div>
              <div className="text-right space-y-1">
                <div>
                  <span className="text-gray-500">Status: </span>
                  <span className="font-bold text-green-700 uppercase">
                    {selectedInvoice.invoice.status}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Paid: </span>
                  <span className="font-mono font-bold text-gray-900">
                    {formatCurrency(selectedInvoice.invoice.paidAmount)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Balance: </span>
                  <span className="font-mono font-bold text-amber-600">
                    {formatCurrency(selectedInvoice.invoice.balanceAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="overflow-x-auto border border-gray-200 rounded">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-gray-100 text-gray-700 font-semibold border-b border-gray-200">
                  <tr>
                    <th className="px-3 py-2">Item</th>
                    <th className="px-3 py-2 text-center">Qty</th>
                    <th className="px-3 py-2 text-right">Price</th>
                    <th className="px-3 py-2 text-right">Tax</th>
                    <th className="px-3 py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {selectedInvoice.items?.map((item: any, i: number) => (
                    <tr key={i}>
                      <td className="px-3 py-2 font-medium text-gray-900">{item.itemName}</td>
                      <td className="px-3 py-2 text-center font-mono">
                        {item.quantity} {item.unitOfMeasure}
                      </td>
                      <td className="px-3 py-2 text-right font-mono">{formatCurrency(item.unitPrice)}</td>
                      <td className="px-3 py-2 text-right font-mono text-gray-600">
                        {formatCurrency(item.cgstAmount ? Number(item.cgstAmount) + Number(item.sgstAmount) : 0)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-gray-900">
                        {formatCurrency(item.totalAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end pt-2">
              <div className="w-56 space-y-1 text-xs text-right">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal:</span>
                  <span className="font-mono">{formatCurrency(selectedInvoice.invoice.subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Total Tax:</span>
                  <span className="font-mono">{formatCurrency(selectedInvoice.invoice.totalTaxAmount)}</span>
                </div>
                <div className="pt-2 border-t border-gray-200 flex justify-between items-baseline text-sm font-bold text-gray-900">
                  <span>Grand Total:</span>
                  <span className="font-mono text-blue-700 text-base">
                    {formatCurrency(selectedInvoice.invoice.grandTotal)}
                  </span>
                </div>
              </div>
            </div>

            {/* Print Action */}
            <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
              <button
                onClick={() => setSelectedInvoice(null)}
                className="px-3 py-1.5 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-medium"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Bill</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
