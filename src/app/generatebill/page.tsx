"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Plus,
  Minus,
  Trash2,
  Calendar,
  CheckCircle,
  AlertCircle,
  Printer,
  QrCode,
  Search,
  Zap,
  ShoppingBag,
  User,
  Users,
  PackagePlus,
  CreditCard,
  FileText,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Customer {
  id: string;
  name: string;
  area?: string | null;
  phone: string;
  gstin?: string | null;
}

interface Product {
  id: string;
  name: string;
  unitOfMeasure: string;
  sellingPrice: string;
  purchasePrice: string;
  taxPercent: string;
  currentStock: string;
  barcode?: string | null;
}

interface BillRow {
  productId?: string;
  name: string;
  unit: string;
  qty: number;
  price: number;
  taxPercent: number;
  taxAmount: number;
  amount: number;
  availableStock?: number;
}

export default function GenerateBillPage() {
  const [billDate, setBillDate] = useState<string>("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [catalogSearch, setCatalogSearch] = useState<string>("");

  // Buyer details
  const [buyerName, setBuyerName] = useState<string>("");
  const [buyerArea, setBuyerArea] = useState<string>("");
  const [buyerContact, setBuyerContact] = useState<string>("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [customerSearch, setCustomerSearch] = useState<string>("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState<boolean>(false);

  // Line items
  const [rows, setRows] = useState<BillRow[]>([]);

  // Payment
  const [paymentMode, setPaymentMode] = useState<"CASH" | "UPI" | "CARD" | "BANK_TRANSFER">("CASH");
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [completedInvoice, setCompletedInvoice] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setBillDate(new Date().toISOString().split("T")[0]);
    loadData();
  }, []);

  async function loadData() {
    try {
      const [custRes, prodRes] = await Promise.all([
        fetch("/api/customers").then((r) => r.json()),
        fetch("/api/products").then((r) => r.json()),
      ]);
      if (Array.isArray(custRes)) setCustomers(custRes);
      if (Array.isArray(prodRes)) setProducts(prodRes);
    } catch (err) {
      console.error("Failed to load reference data:", err);
    }
  }

  // 1-Click Select Walk-in Customer
  function selectWalkInCustomer() {
    setBuyerName("Walk-in Customer");
    setBuyerArea("Counter Sale");
    setBuyerContact("Walk-in");
    setSelectedCustomerId("");
    setShowCustomerDropdown(false);
  }

  function handleSelectExistingCustomer(c: Customer) {
    setSelectedCustomerId(c.id);
    setBuyerName(c.name);
    setBuyerArea(c.area || "Local");
    setBuyerContact(c.phone);
    setShowCustomerDropdown(false);
  }

  // Quick Add Product to Bill (Effortless 1-click!)
  function addProductToBill(prod: Product) {
    setRows((prev) => {
      const existingIdx = prev.findIndex((r) => r.productId === prod.id);
      if (existingIdx !== -1) {
        // Increment quantity
        return prev.map((r, i) => {
          if (i !== existingIdx) return r;
          const newQty = r.qty + 1;
          const rawTotal = newQty * r.price;
          const taxAmount = (rawTotal * r.taxPercent) / 100;
          return {
            ...r,
            qty: newQty,
            taxAmount: parseFloat(taxAmount.toFixed(2)),
            amount: parseFloat((rawTotal + taxAmount).toFixed(2)),
          };
        });
      }

      // Add new row
      const price = parseFloat(prod.sellingPrice) || 0;
      const taxPercent = parseFloat(prod.taxPercent) || 0;
      const rawTotal = 1 * price;
      const taxAmount = (rawTotal * taxPercent) / 100;
      return [
        ...prev,
        {
          productId: prod.id,
          name: prod.name,
          unit: prod.unitOfMeasure,
          qty: 1,
          price,
          taxPercent,
          taxAmount: parseFloat(taxAmount.toFixed(2)),
          amount: parseFloat((rawTotal + taxAmount).toFixed(2)),
          availableStock: parseFloat(prod.currentStock) || 0,
        },
      ];
    });
  }

  // Add ad-hoc Custom Item on the fly
  function addCustomItem() {
    const customName = prompt("Enter Custom Item Name:", "Delivery / Misc Service");
    if (!customName) return;
    const priceStr = prompt("Enter Price (₹):", "100");
    const price = parseFloat(priceStr || "0") || 0;

    setRows((prev) => [
      ...prev,
      {
        name: customName,
        unit: "PCS",
        qty: 1,
        price,
        taxPercent: 0,
        taxAmount: 0,
        amount: price,
        availableStock: 999,
      },
    ]);
  }

  function updateQuantity(idx: number, delta: number) {
    setRows((prev) =>
      prev
        .map((r, i) => {
          if (i !== idx) return r;
          const newQty = Math.max(1, r.qty + delta);
          const rawTotal = newQty * r.price;
          const taxAmount = (rawTotal * r.taxPercent) / 100;
          return {
            ...r,
            qty: newQty,
            taxAmount: parseFloat(taxAmount.toFixed(2)),
            amount: parseFloat((rawTotal + taxAmount).toFixed(2)),
          };
        })
        .filter((r) => r.qty > 0)
    );
  }

  function setQuantityDirect(idx: number, qtyVal: number) {
    const newQty = Math.max(1, qtyVal);
    setRows((prev) =>
      prev.map((r, i) => {
        if (i !== idx) return r;
        const rawTotal = newQty * r.price;
        const taxAmount = (rawTotal * r.taxPercent) / 100;
        return {
          ...r,
          qty: newQty,
          taxAmount: parseFloat(taxAmount.toFixed(2)),
          amount: parseFloat((rawTotal + taxAmount).toFixed(2)),
        };
      })
    );
  }

  function deleteRow(idx: number) {
    setRows((prev) => prev.filter((_, i) => i !== idx));
  }

  // Live Totals
  const subtotal = rows.reduce((acc, r) => acc + r.qty * r.price, 0);
  const totalTax = rows.reduce((acc, r) => acc + r.taxAmount, 0);
  const rawGrandTotal = subtotal + totalTax;
  const grandTotal = Math.round(rawGrandTotal);

  useEffect(() => {
    if (grandTotal > 0 && paidAmount === 0) {
      setPaidAmount(grandTotal);
    }
  }, [grandTotal]);

  // Submit Invoice to PostgreSQL
  async function handleSaveInvoice() {
    if (rows.length === 0) {
      setErrorMessage("Please add at least one product to the invoice.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedCustomerId || undefined,
          customerName: buyerName.trim() || "Walk-in Buyer",
          customerPhone: buyerContact.trim() || "Walk-in",
          customerArea: buyerArea.trim() || "Local",
          items: rows.map((r) => ({
            productId: r.productId,
            name: r.name,
            unitOfMeasure: r.unit,
            taxPercent: r.taxPercent,
            quantity: r.qty,
            unitPrice: r.price,
            discountPercent: 0,
          })),
          paymentMode,
          paidAmount: Number(paidAmount),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save invoice");
      }

      setCompletedInvoice(data);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to process invoice");
    } finally {
      setIsSubmitting(false);
    }
  }

  function resetForm() {
    setRows([]);
    setBuyerName("");
    setBuyerArea("");
    setBuyerContact("");
    setSelectedCustomerId("");
    setCompletedInvoice(null);
    setErrorMessage("");
    setPaidAmount(0);
  }

  const filteredCatalog = products.filter(
    (p) =>
      p.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      p.barcode?.includes(catalogSearch) ||
      p.sellingPrice.includes(catalogSearch)
  );

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-emerald-400 fill-emerald-400" />
            <span>Generate Bill & Counter POS</span>
          </h1>
          <p className="text-xs text-slate-400">
            Click products to add instantly, bill existing or walk-in buyers, and print professional receipts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <Calendar className="w-4 h-4 text-slate-500" />
            <span className="text-slate-400 font-semibold">Date:</span>
            <input
              type="date"
              value={billDate}
              onChange={(e) => setBillDate(e.target.value)}
              className="bg-transparent text-white font-mono text-xs focus:outline-none"
            />
          </div>

          <button
            onClick={resetForm}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Grid: Left Catalog, Right Invoice Builder */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT 5 COLS: FAST PRODUCT CATALOG (Click to Add Effortlessly!) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-emerald-400" />
                <span>Quick-Pick Products (Click to Add)</span>
              </h2>
              <button
                type="button"
                onClick={addCustomItem}
                className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Custom Item</span>
              </button>
            </div>

            {/* Catalog search bar */}
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                placeholder="Search products by name or barcode..."
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
              />
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            </div>

            {/* Product Cards List */}
            <div className="max-h-[520px] overflow-y-auto space-y-2 pr-1">
              {filteredCatalog.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  No matching products. Click "+ Custom Item" to add an ad-hoc line.
                </div>
              ) : (
                filteredCatalog.map((prod) => {
                  const inBill = rows.find((r) => r.productId === prod.id);
                  return (
                    <div
                      key={prod.id}
                      onClick={() => addProductToBill(prod)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                        inBill
                          ? "bg-emerald-500/10 border-emerald-500/40 hover:bg-emerald-500/20"
                          : "bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40"
                      }`}
                    >
                      <div>
                        <div className="font-bold text-xs text-white flex items-center gap-1.5">
                          <span>{prod.name}</span>
                          {inBill && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-extrabold bg-emerald-500 text-slate-950">
                              x{inBill.qty}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Stock: {prod.currentStock} {prod.unitOfMeasure} • Tax: {prod.taxPercent}%
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-mono font-extrabold text-sm text-emerald-400">
                          {formatCurrency(prod.sellingPrice)}
                        </div>
                        <div className="text-[10px] text-slate-500">Click to add</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* RIGHT 7 COLS: INVOICE DETAILS & LINE ITEMS */}
        <div className="lg:col-span-7 space-y-4">
          {/* Buyer Details Card (Seamless: Walk-in, Existing, or New on the fly!) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-4 h-4 text-emerald-400" />
                <span>Buyer Details</span>
              </h2>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={selectWalkInCustomer}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold"
                >
                  ⚡ Walk-in Customer
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {/* Buyer Name with Search Dropdown */}
              <div className="relative">
                <label className="block text-slate-400 font-semibold mb-1">Name *</label>
                <input
                  type="text"
                  value={buyerName}
                  onChange={(e) => {
                    setBuyerName(e.target.value);
                    setCustomerSearch(e.target.value);
                    setShowCustomerDropdown(true);
                  }}
                  onFocus={() => setShowCustomerDropdown(true)}
                  placeholder="Enter or select name..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500 font-medium"
                />

                {showCustomerDropdown && (
                  <div className="absolute z-30 left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-xl max-h-48 overflow-y-auto shadow-2xl divide-y divide-slate-800">
                    <div
                      onMouseDown={(e) => {
                        e.preventDefault();
                        selectWalkInCustomer();
                      }}
                      className="p-2.5 hover:bg-slate-800 cursor-pointer text-xs font-bold text-emerald-400"
                    >
                      ⚡ Quick Walk-in Customer
                    </div>
                    {customers
                      .filter((c) =>
                        customerSearch
                          ? c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
                            c.phone.includes(customerSearch)
                          : true
                      )
                      .map((c) => (
                        <div
                          key={c.id}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleSelectExistingCustomer(c);
                          }}
                          className="p-2.5 hover:bg-slate-800 cursor-pointer text-xs"
                        >
                          <div className="font-bold text-white">{c.name}</div>
                          <div className="text-[11px] text-slate-400">
                            {c.phone} • {c.area || "Local"}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Area */}
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Area</label>
                <input
                  type="text"
                  value={buyerArea}
                  onChange={(e) => setBuyerArea(e.target.value)}
                  placeholder="Area / Location"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Contact */}
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={buyerContact}
                  onChange={(e) => setBuyerContact(e.target.value)}
                  placeholder="Phone number"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Current Bill Line Items Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
                  <tr>
                    <th className="px-3 py-2.5 text-center w-10">#</th>
                    <th className="px-3 py-2.5">Product Name</th>
                    <th className="px-3 py-2.5 text-center w-28">Quantity</th>
                    <th className="px-3 py-2.5 text-right w-20">Price</th>
                    <th className="px-3 py-2.5 text-right w-24">Total</th>
                    <th className="px-3 py-2.5 text-center w-12">Del</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-slate-500">
                        Click any product on the left catalog or "+ Custom Item" to start adding items.
                      </td>
                    </tr>
                  ) : (
                    rows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30">
                        <td className="px-3 py-2.5 text-center font-mono text-slate-500">{idx + 1}</td>
                        <td className="px-3 py-2.5 font-bold text-white">
                          <div>{row.name}</div>
                          <div className="text-[10px] text-slate-400 font-normal">
                            Unit: {row.unit} • GST: {row.taxPercent}%
                          </div>
                        </td>

                        {/* Quantity with +/- Buttons */}
                        <td className="px-3 py-2.5 text-center">
                          <div className="inline-flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-0.5">
                            <button
                              type="button"
                              onClick={() => updateQuantity(idx, -1)}
                              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <input
                              type="number"
                              min="1"
                              value={row.qty}
                              onChange={(e) => setQuantityDirect(idx, parseFloat(e.target.value) || 1)}
                              className="w-10 text-center font-bold text-white bg-transparent text-xs focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => updateQuantity(idx, 1)}
                              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </td>

                        <td className="px-3 py-2.5 text-right font-mono text-slate-300">
                          {formatCurrency(row.price)}
                        </td>

                        <td className="px-3 py-2.5 text-right font-mono font-bold text-emerald-400">
                          {formatCurrency(row.amount)}
                        </td>

                        <td className="px-3 py-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => deleteRow(idx)}
                            className="text-slate-500 hover:text-rose-400 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Calculations & Checkout Box */}
            <div className="p-4 bg-slate-950/80 border-t border-slate-800 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Subtotal:</span>
                <span className="font-mono text-white font-bold">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Tax (GST):</span>
                <span className="font-mono text-white">{formatCurrency(totalTax)}</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline">
                <span className="text-sm font-bold text-white">Grand Total:</span>
                <span className="text-2xl font-black font-mono text-emerald-400">
                  {formatCurrency(grandTotal)}
                </span>
              </div>

              {/* Payment selector */}
              <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 font-semibold mr-1">Pay Mode:</span>
                  {(["CASH", "UPI", "CARD"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setPaymentMode(mode)}
                      className={`px-3 py-1 rounded-lg font-bold border transition-colors ${
                        paymentMode === mode
                          ? "bg-emerald-500 text-slate-950 border-emerald-400"
                          : "bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-850"
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-semibold">Paid (₹):</span>
                  <input
                    type="number"
                    min="0"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                    className="w-24 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Complete button */}
              <button
                type="button"
                onClick={handleSaveInvoice}
                disabled={isSubmitting || rows.length === 0}
                className={`w-full py-3 rounded-xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 transition-all ${
                  isSubmitting || rows.length === 0
                    ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                    : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 active:scale-95"
                }`}
              >
                <Zap className="w-4 h-4 fill-slate-950" />
                <span>{isSubmitting ? "Generating Bill..." : "Generate Bill & Save"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SUCCESS & PRINT MODAL */}
      {completedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 text-center space-y-5 shadow-2xl">
            <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-2xl mx-auto flex items-center justify-center">
              <CheckCircle className="w-7 h-7" />
            </div>

            <div>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
                Bill Generated & Persisted
              </span>
              <h2 className="text-2xl font-black text-white mt-1">
                {completedInvoice.invoiceNumber}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Total: <b className="text-white">{formatCurrency(completedInvoice.grandTotal)}</b>
              </p>
            </div>

            {/* Print Options */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Link
                href={`/invoices/${completedInvoice.id}/print`}
                target="_blank"
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span>Print Document</span>
              </Link>

              <button
                type="button"
                onClick={resetForm}
                className="py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black shadow-lg shadow-emerald-500/20 transition-all"
              >
                <span>Next Bill</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
