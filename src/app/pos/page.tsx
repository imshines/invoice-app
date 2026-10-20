"use client";

import { useState, useEffect, useRef } from "react";
import {
  Zap,
  Plus,
  Trash2,
  Scan,
  User,
  CreditCard,
  QrCode,
  Printer,
  Share2,
  CheckCircle,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Customer {
  id: string;
  name: string;
  phone: string;
  gstin?: string | null;
  stateCode?: string | null;
  currentBalance?: string | null;
}

interface Product {
  id: string;
  barcode?: string | null;
  name: string;
  sku?: string | null;
  unitOfMeasure: string;
  purchasePrice: string;
  sellingPrice: string;
  taxPercent: string;
  currentStock: string;
}

interface LineItem {
  productId: string;
  name: string;
  unitOfMeasure: string;
  quantity: number;
  unitPrice: number;
  purchasePrice: number;
  taxPercent: number;
  discountPercent: number;
  currentStock: number;
}

export default function PosPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [barcodeInput, setBarcodeInput] = useState<string>("");
  const [productSearch, setProductSearch] = useState<string>("");
  const [paymentMode, setPaymentMode] = useState<"CASH" | "UPI" | "CARD" | "BANK_TRANSFER">("CASH");
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedInvoice, setCompletedInvoice] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Load initial customers and products
  useEffect(() => {
    async function loadData() {
      try {
        const [custRes, prodRes] = await Promise.all([
          fetch("/api/customers").then((r) => r.json()),
          fetch("/api/products").then((r) => r.json()),
        ]);
        if (Array.isArray(custRes)) {
          setCustomers(custRes);
          if (custRes.length > 0) setSelectedCustomerId(custRes[0].id);
        }
        if (Array.isArray(prodRes)) setProducts(prodRes);
      } catch (err) {
        console.error("Failed to load POS reference data:", err);
      }
    }
    loadData();
  }, []);

  // Keyboard shortcut listener (F2: new bill, Focus barcode)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "F2") {
        e.preventDefault();
        resetForm();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  function resetForm() {
    setLineItems([]);
    setCompletedInvoice(null);
    setErrorMessage("");
    setBarcodeInput("");
    setPaidAmount(0);
    barcodeInputRef.current?.focus();
  }

  // Add product to line items
  function addProductToBill(product: Product) {
    setLineItems((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      } else {
        return [
          ...prev,
          {
            productId: product.id,
            name: product.name,
            unitOfMeasure: product.unitOfMeasure,
            quantity: 1,
            unitPrice: parseFloat(product.sellingPrice),
            purchasePrice: parseFloat(product.purchasePrice),
            taxPercent: parseFloat(product.taxPercent),
            discountPercent: 0,
            currentStock: parseFloat(product.currentStock),
          },
        ];
      }
    });
    setProductSearch("");
  }

  // Handle barcode scanner input
  function handleBarcodeSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const matched = products.find(
      (p) => p.barcode === barcodeInput.trim() || p.sku === barcodeInput.trim()
    );

    if (matched) {
      addProductToBill(matched);
      setBarcodeInput("");
    } else {
      setErrorMessage(`No product found with barcode: ${barcodeInput}`);
      setTimeout(() => setErrorMessage(""), 3000);
    }
  }

  function updateQuantity(index: number, qty: number) {
    if (qty <= 0) return;
    setLineItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, quantity: qty } : item))
    );
  }

  function updateUnitPrice(index: number, price: number) {
    if (price < 0) return;
    setLineItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, unitPrice: price } : item))
    );
  }

  function removeItem(index: number) {
    setLineItems((prev) => prev.filter((_, idx) => idx !== index));
  }

  // Real-time financial calculations
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  const subtotal = lineItems.reduce((acc, i) => acc + i.quantity * i.unitPrice, 0);
  const totalCost = lineItems.reduce((acc, i) => acc + i.quantity * i.purchasePrice, 0);
  const grossMargin = subtotal > 0 ? ((subtotal - totalCost) / subtotal) * 100 : 0;

  // Approximate tax (intra-state standard 50% CGST + 50% SGST)
  const totalTax = lineItems.reduce((acc, i) => {
    const itemTotal = i.quantity * i.unitPrice;
    return acc + (itemTotal * i.taxPercent) / 100;
  }, 0);

  const rawGrandTotal = subtotal + totalTax;
  const grandTotal = Math.round(rawGrandTotal);
  const roundOff = (grandTotal - rawGrandTotal).toFixed(2);

  // Auto-set paid amount to grand total if exact cash selected
  useEffect(() => {
    if (grandTotal > 0 && paidAmount === 0) {
      setPaidAmount(grandTotal);
    }
  }, [grandTotal]);

  const balanceDue = Math.max(0, grandTotal - paidAmount);

  // Submit invoice to Hono API
  async function handleCheckout() {
    if (lineItems.length === 0) {
      setErrorMessage("Please add at least one product to the invoice.");
      return;
    }
    if (!selectedCustomerId) {
      setErrorMessage("Please select a customer.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedCustomerId,
          items: lineItems.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            discountPercent: i.discountPercent,
          })),
          paymentMode,
          paidAmount: Number(paidAmount),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate invoice");
      }

      setCompletedInvoice(data);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to process invoice");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Zap className="w-6 h-6 text-emerald-400 fill-emerald-400" />
            <span>High-Speed Counter POS</span>
          </h1>
          <p className="text-xs text-slate-400">
            Barcode-ready checkout with atomic inventory reconciliation and dynamic UPI QR.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={resetForm}
            className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-all"
          >
            New Bill (F2)
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Grid: Left Catalog/Entry, Right Totals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Barcode Input + Line Items Table */}
        <div className="lg:col-span-2 space-y-4">
          {/* Customer Selection & Barcode Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-900/80 p-4 rounded-xl border border-slate-800">
            {/* Customer Picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Customer / Buyer
              </label>
              <div className="relative">
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone}) {Number(c.currentBalance || 0) > 0 ? `[Khata: ₹${c.currentBalance}]` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Barcode Scanner / SKU Search */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Scan Barcode or Enter SKU
              </label>
              <form onSubmit={handleBarcodeSubmit} className="relative">
                <input
                  ref={barcodeInputRef}
                  type="text"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  placeholder="Scan barcode..."
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-emerald-500 font-mono"
                />
                <Scan className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              </form>
            </div>
          </div>

          {/* Quick Product Search Dropdown */}
          <div className="relative">
            <input
              type="text"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder="Search products by name (e.g. Basmati Rice, Oil, Sugar)..."
              className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
            />
            {productSearch.trim().length > 0 && (
              <div className="absolute z-20 left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-xl max-h-60 overflow-y-auto shadow-2xl divide-y divide-slate-800">
                {products
                  .filter((p) => p.name.toLowerCase().includes(productSearch.toLowerCase()))
                  .map((p) => (
                    <div
                      key={p.id}
                      onClick={() => addProductToBill(p)}
                      className="p-3 hover:bg-slate-800 cursor-pointer flex items-center justify-between text-sm transition-colors"
                    >
                      <div>
                        <div className="font-semibold text-white">{p.name}</div>
                        <div className="text-xs text-slate-400">
                          Stock: {p.currentStock} {p.unitOfMeasure} • Tax: {p.taxPercent}%
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-emerald-400">{formatCurrency(p.sellingPrice)}</div>
                        <div className="text-[10px] text-slate-500">Click to add</div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Line Items Table */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/80 text-xs font-semibold uppercase text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-3 py-3">#</th>
                    <th className="px-3 py-3">Product</th>
                    <th className="px-3 py-3 text-center">Qty</th>
                    <th className="px-3 py-3 text-right">Rate</th>
                    <th className="px-3 py-3 text-right">Tax</th>
                    <th className="px-3 py-3 text-right">Total</th>
                    <th className="px-3 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {lineItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-500">
                        No items added. Scan a barcode or search products above to start the bill.
                      </td>
                    </tr>
                  ) : (
                    lineItems.map((item, idx) => {
                      const itemTotal = item.quantity * item.unitPrice;
                      const isLowStock = item.quantity > item.currentStock;
                      return (
                        <tr key={item.productId} className="hover:bg-slate-800/40">
                          <td className="px-3 py-3 text-slate-500 text-xs font-mono">{idx + 1}</td>
                          <td className="px-3 py-3 font-medium text-white">
                            <div>{item.name}</div>
                            <div className="text-[11px] text-slate-400">
                              Avail: {item.currentStock} {item.unitOfMeasure}
                              {isLowStock && (
                                <span className="ml-2 text-rose-400 font-bold">⚠️ Insufficient Stock!</span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-center">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateQuantity(idx, parseFloat(e.target.value) || 1)}
                              className="w-16 bg-slate-950 border border-slate-700 text-center text-white rounded px-1.5 py-1 text-sm font-bold focus:outline-none focus:border-emerald-500"
                            />
                          </td>
                          <td className="px-3 py-3 text-right font-mono">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) => updateUnitPrice(idx, parseFloat(e.target.value) || 0)}
                              className="w-20 bg-slate-950 border border-slate-700 text-right text-white rounded px-1.5 py-1 text-sm font-mono focus:outline-none focus:border-emerald-500"
                            />
                          </td>
                          <td className="px-3 py-3 text-right text-xs text-slate-400 font-mono">
                            {item.taxPercent}%
                          </td>
                          <td className="px-3 py-3 text-right font-bold text-white font-mono">
                            {formatCurrency(itemTotal)}
                          </td>
                          <td className="px-3 py-3 text-center">
                            <button
                              onClick={() => removeItem(idx)}
                              className="text-slate-500 hover:text-rose-400 p-1 rounded transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Live Gross Profit Indicator */}
            {lineItems.length > 0 && (
              <div className="p-3 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <TrendingUp className="w-4 h-4" />
                  <span>Real-Time Estimated Margin: {grossMargin.toFixed(1)}%</span>
                </div>
                <span>Total Items: {lineItems.reduce((acc, i) => acc + i.quantity, 0)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Totals, Payment & Finalize */}
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <h2 className="text-base font-bold text-white uppercase tracking-wider text-xs border-b border-slate-800 pb-2">
              Payment & Checkout
            </h2>

            {/* Bill Financial Breakdown */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal</span>
                <span className="font-mono text-slate-200">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Total Tax (GST)</span>
                <span className="font-mono text-slate-200">{formatCurrency(totalTax)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Round Off</span>
                <span className="font-mono text-slate-200">{roundOff}</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline">
                <span className="text-base font-bold text-white">Grand Total</span>
                <span className="text-2xl font-black text-emerald-400 font-mono">
                  {formatCurrency(grandTotal)}
                </span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Payment Mode
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(["CASH", "UPI", "CARD", "BANK_TRANSFER"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setPaymentMode(mode)}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
                      paymentMode === mode
                        ? "bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20"
                        : "bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Amount Paid & Khata Balance */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-400 uppercase tracking-wider">Amount Paid</span>
                <button
                  type="button"
                  onClick={() => setPaidAmount(grandTotal)}
                  className="text-emerald-400 hover:underline font-bold text-[11px]"
                >
                  Exact (₹{grandTotal})
                </button>
              </div>
              <input
                type="number"
                min="0"
                value={paidAmount}
                onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg px-3 py-2 text-lg font-bold font-mono focus:outline-none focus:border-emerald-500"
              />

              {balanceDue > 0 && (
                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs">
                  Remaining balance of <b>{formatCurrency(balanceDue)}</b> will be recorded in customer's{" "}
                  <b>Khata credit ledger</b>.
                </div>
              )}
            </div>

            {/* Complete Invoice Button */}
            <button
              onClick={handleCheckout}
              disabled={isSubmitting || lineItems.length === 0}
              className={`w-full py-3.5 rounded-xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                isSubmitting || lineItems.length === 0
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                  : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-xl shadow-emerald-500/20 active:scale-95"
              }`}
            >
              <Zap className="w-4 h-4 fill-slate-950" />
              <span>{isSubmitting ? "Processing..." : "Generate Bill & Complete (Ctrl+Enter)"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Invoice Complete / Success Modal with Dynamic UPI QR */}
      {completedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 text-center space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="w-14 h-14 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 rounded-2xl mx-auto flex items-center justify-center">
              <CheckCircle className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
                Invoice Finalized & Saved
              </span>
              <h2 className="text-2xl font-black text-white mt-1">
                {completedInvoice.invoiceNumber}
              </h2>
              <p className="text-sm text-slate-400">
                Amount: <b className="text-white">{formatCurrency(completedInvoice.grandTotal)}</b>
              </p>
            </div>

            {/* Dynamic UPI QR Code (if balance due) */}
            {completedInvoice.upiPaymentUrl && (
              <div className="p-4 bg-white rounded-2xl inline-block shadow-inner">
                {/* QR code will be rendered via dynamic URL or canvas */}
                <div className="text-slate-950 text-xs font-bold mb-2">Scan & Pay via UPI</div>
                <div className="font-mono text-[10px] text-slate-600 break-all max-w-[220px]">
                  {completedInvoice.upiPaymentUrl}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => window.print()}
                className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition-all"
              >
                <Printer className="w-4 h-4" />
                <span>Thermal Print</span>
              </button>
              <button
                onClick={resetForm}
                className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black shadow-lg shadow-emerald-500/20 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Next Customer</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
