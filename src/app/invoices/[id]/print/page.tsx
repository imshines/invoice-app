"use client";

import { useState, useEffect, use, Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, Printer, FileText, Receipt } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

function InvoicePrintContent({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [printFormat, setPrintFormat] = useState<"A4" | "THERMAL">("A4");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/invoices/${id}`);
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("Failed to load invoice for printing:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-slate-400 text-sm">
        Preparing printable document...
      </div>
    );
  }

  if (!data || !data.invoice) {
    return (
      <div className="p-8 text-center text-rose-400 text-sm">
        Invoice not found. <Link href="/invoices" className="underline">Back to invoices</Link>
      </div>
    );
  }

  const { invoice, items, customer, organization, upi } = data;

  return (
    <div className="min-h-screen py-4">
      {/* Top action toolbar (hidden during print via .no-print) */}
      <div className="no-print max-w-4xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl">
        <Link
          href="/invoices"
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Invoices</span>
        </Link>

        {/* Format Toggle */}
        <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setPrintFormat("A4")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
              printFormat === "A4"
                ? "bg-emerald-500 text-slate-950 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>A4 Tax Invoice</span>
          </button>
          <button
            type="button"
            onClick={() => setPrintFormat("THERMAL")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
              printFormat === "THERMAL"
                ? "bg-emerald-500 text-slate-950 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>80mm Thermal Receipt</span>
          </button>
        </div>

        {/* Print button */}
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
        >
          <Printer className="w-4 h-4" />
          <span>Print Document (Ctrl+P)</span>
        </button>
      </div>

      {/* DOCUMENT CONTAINER */}
      <div className="flex justify-center">
        {printFormat === "A4" ? (
          /* ==================== A4 FORMAL TAX INVOICE ==================== */
          <div className="printable-document bg-white text-slate-950 p-8 sm:p-10 rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200">
            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-5">
              <div>
                <h1 className="text-2xl font-black text-slate-950 tracking-tight uppercase">
                  {organization?.legalName || organization?.tradeName || "Invoice Application"}
                </h1>
                <p className="text-xs text-slate-700 mt-0.5">
                  {organization?.addressLine}, {organization?.city} - {organization?.pinCode}
                </p>
                <p className="text-xs text-slate-700">
                  Phone: {organization?.phonePrimary}{" "}
                  {organization?.phoneSecondary ? `• ${organization.phoneSecondary}` : ""}
                </p>
                {organization?.gstin && (
                  <p className="text-xs font-bold text-slate-900 font-mono mt-1">
                    GSTIN: {organization.gstin} • State: {organization.state} (Code:{" "}
                    {organization.stateCode})
                  </p>
                )}
              </div>

              <div className="text-right">
                <span className="inline-block px-3 py-1 rounded bg-slate-950 text-white font-bold text-xs uppercase tracking-wider">
                  TAX INVOICE
                </span>
                <div className="text-lg font-black font-mono text-slate-950 mt-2">
                  {invoice.invoiceNumber}
                </div>
                <div className="text-xs text-slate-700">Date: {invoice.invoiceDate}</div>
              </div>
            </div>

            {/* Buyer Details Row */}
            <div className="grid grid-cols-2 gap-6 my-6 p-4 rounded-xl border border-slate-300 bg-slate-50/50 text-xs">
              <div>
                <div className="font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Billed To (Buyer)
                </div>
                <div className="text-base font-black text-slate-950">{customer?.name}</div>
                <div className="text-slate-700 mt-0.5">
                  {customer?.area || customer?.billingAddress || "Local Buyer"}
                </div>
                <div className="text-slate-700">Contact: {customer?.phone}</div>
                {customer?.gstin && (
                  <div className="font-mono font-bold text-slate-900 mt-0.5">
                    GSTIN: {customer.gstin}
                  </div>
                )}
              </div>

              <div className="text-right space-y-1">
                <div>
                  <span className="text-slate-600">Payment Status: </span>
                  <span className="font-black uppercase text-slate-950">{invoice.status}</span>
                </div>
                <div>
                  <span className="text-slate-600">Paid Amount: </span>
                  <span className="font-mono font-bold text-slate-950">
                    {formatCurrency(invoice.paidAmount)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-600">Balance Due: </span>
                  <span className="font-mono font-black text-slate-950">
                    {formatCurrency(invoice.balanceAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <table className="w-full text-left text-xs border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-300">
                  <th className="border border-slate-300 p-2 w-10 text-center">#</th>
                  <th className="border border-slate-300 p-2">Item Description</th>
                  <th className="border border-slate-300 p-2 text-center w-16">HSN</th>
                  <th className="border border-slate-300 p-2 text-center w-16">Qty</th>
                  <th className="border border-slate-300 p-2 text-right w-20">Rate</th>
                  <th className="border border-slate-300 p-2 text-right w-20">Taxable</th>
                  <th className="border border-slate-300 p-2 text-right w-20">CGST</th>
                  <th className="border border-slate-300 p-2 text-right w-20">SGST</th>
                  <th className="border border-slate-300 p-2 text-right w-24">Total</th>
                </tr>
              </thead>
              <tbody>
                {items?.map((item: any, idx: number) => (
                  <tr key={idx} className="border-b border-slate-300">
                    <td className="border border-slate-300 p-2 text-center font-mono">{idx + 1}</td>
                    <td className="border border-slate-300 p-2 font-bold text-slate-950">
                      {item.itemName}
                    </td>
                    <td className="border border-slate-300 p-2 text-center font-mono text-slate-700">
                      {item.hsnSac || "-"}
                    </td>
                    <td className="border border-slate-300 p-2 text-center font-mono">
                      {item.quantity} {item.unitOfMeasure}
                    </td>
                    <td className="border border-slate-300 p-2 text-right font-mono">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="border border-slate-300 p-2 text-right font-mono">
                      {formatCurrency(item.taxableValue)}
                    </td>
                    <td className="border border-slate-300 p-2 text-right font-mono text-slate-700">
                      {formatCurrency(item.cgstAmount)}
                    </td>
                    <td className="border border-slate-300 p-2 text-right font-mono text-slate-700">
                      {formatCurrency(item.sgstAmount)}
                    </td>
                    <td className="border border-slate-300 p-2 text-right font-mono font-black text-slate-950">
                      {formatCurrency(item.totalAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Calculations & Dynamic UPI QR */}
            <div className="flex justify-between items-start my-6 pt-2">
              {/* Dynamic UPI QR Code */}
              {upi?.qrDataUrl && Number(invoice.balanceAmount) > 0 ? (
                <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-300 bg-slate-50/50">
                  <img src={upi.qrDataUrl} alt="UPI QR" className="w-24 h-24 rounded-lg bg-white p-1 border border-slate-200" />
                  <div className="text-xs">
                    <div className="font-black text-slate-950">Scan & Pay via UPI</div>
                    <div className="text-slate-600 text-[11px] mt-0.5">
                      Pay <b className="text-slate-950">{formatCurrency(invoice.balanceAmount)}</b> directly to:
                    </div>
                    <div className="font-mono text-[11px] font-bold text-slate-900 mt-1">
                      {organization?.upiVpa}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-600 italic">
                  Thank you for your business!
                </div>
              )}

              {/* Totals Box */}
              <div className="w-64 space-y-1.5 text-xs text-right">
                <div className="flex justify-between text-slate-700">
                  <span>Taxable Amount:</span>
                  <span className="font-mono font-bold">{formatCurrency(invoice.taxableAmount)}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Total GST:</span>
                  <span className="font-mono font-bold">{formatCurrency(invoice.totalTaxAmount)}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Round Off:</span>
                  <span className="font-mono font-bold">{invoice.roundOff}</span>
                </div>
                <div className="pt-2 border-t-2 border-slate-900 flex justify-between items-baseline">
                  <span className="text-sm font-black text-slate-950">Grand Total:</span>
                  <span className="text-xl font-black font-mono text-slate-950">
                    {formatCurrency(invoice.grandTotal)}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer / Signatures */}
            <div className="grid grid-cols-2 gap-8 pt-8 mt-6 border-t border-slate-300 text-xs">
              <div>
                <div className="font-bold text-slate-800 mb-1">Terms & Conditions:</div>
                <p className="text-slate-600 text-[11px]">
                  {organization?.thermalFooter || "Goods once sold will not be taken back or exchanged. Interest @18% will be charged if not paid within due date."}
                </p>
              </div>
              <div className="text-right">
                <div className="font-bold text-slate-900 mb-12">
                  For {organization?.legalName || organization?.tradeName || "Invoice Application"}
                </div>
                <div className="border-t border-slate-400 inline-block pt-1 px-8 text-slate-600 font-semibold text-[11px]">
                  Authorized Signatory
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ==================== 80mm THERMAL RECEIPT ==================== */
          <div className="printable-document bg-white text-slate-950 p-6 rounded-2xl shadow-2xl max-w-xs w-full font-mono text-xs border border-slate-200 leading-tight">
            <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-400">
              <h2 className="text-base font-black uppercase">
                {organization?.tradeName || organization?.legalName || "Invoice Application"}
              </h2>
              <p className="text-[11px] text-slate-600">{organization?.addressLine}, {organization?.city}</p>
              <p className="text-[11px] text-slate-600">Mob: {organization?.phonePrimary}</p>
              {organization?.gstin && <p className="font-bold">GSTIN: {organization.gstin}</p>}
            </div>

            <div className="py-2.5 border-b border-dashed border-slate-400 text-[11px] space-y-0.5">
              <div className="flex justify-between">
                <span>Bill: {invoice.invoiceNumber}</span>
                <span>{invoice.invoiceDate}</span>
              </div>
              <div>Customer: {customer?.name}</div>
              <div>Contact: {customer?.phone}</div>
            </div>

            <div className="py-2 border-b border-dashed border-slate-400 space-y-1.5">
              {items?.map((item: any, i: number) => (
                <div key={i} className="text-[11px]">
                  <div className="font-bold">{item.itemName}</div>
                  <div className="flex justify-between text-slate-700">
                    <span>
                      {item.quantity} {item.unitOfMeasure} x {item.unitPrice}
                    </span>
                    <span className="font-bold text-slate-950">{formatCurrency(item.totalAmount)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="py-2 border-b border-dashed border-slate-400 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax (GST):</span>
                <span>{formatCurrency(invoice.totalTaxAmount)}</span>
              </div>
              <div className="flex justify-between font-black text-sm pt-1 border-t border-slate-300">
                <span>TOTAL:</span>
                <span>{formatCurrency(invoice.grandTotal)}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span>Paid:</span>
                <span>{formatCurrency(invoice.paidAmount)}</span>
              </div>
              {Number(invoice.balanceAmount) > 0 && (
                <div className="flex justify-between font-bold text-rose-600">
                  <span>Balance Due:</span>
                  <span>{formatCurrency(invoice.balanceAmount)}</span>
                </div>
              )}
            </div>

            {upi?.qrDataUrl && Number(invoice.balanceAmount) > 0 && (
              <div className="text-center py-3 border-b border-dashed border-slate-400">
                <img src={upi.qrDataUrl} alt="UPI" className="w-28 h-28 mx-auto" />
                <div className="text-[10px] font-bold mt-1">Scan & Pay via UPI</div>
              </div>
            )}

            <div className="text-center pt-3 text-[10px] text-slate-600">
              {organization?.thermalFooter || "Thank you for shopping with us!"}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function InvoicePrintPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading invoice document...</div>}>
      <InvoicePrintContent params={params} />
    </Suspense>
  );
}
