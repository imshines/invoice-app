"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Calendar,
  CheckCircle,
  AlertCircle,
  Printer,
  QrCode,
  Search,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Customer {
  id: string;
  name: string;
  area?: string | null;
  phone: string;
  gstin?: string | null;
  stateCode?: string | null;
  billingAddress?: string | null;
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
  productId: string;
  name: string;
  unit: string;
  qty: number;
  price: number;
  taxPercent: number;
  taxAmount: number;
  amount: number;
  availableStock: number;
}

export default function GenerateBillPage() {
  const [billDate, setBillDate] = useState<string>("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [organization, setOrganization] = useState<any>(null);

  // Buyer inputs
  const [buyerName, setBuyerName] = useState<string>("");
  const [buyerArea, setBuyerArea] = useState<string>("");
  const [buyerContact, setBuyerContact] = useState<string>("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [customerSuggestions, setCustomerSuggestions] = useState<Customer[]>([]);

  // Rows matching generatebill.php
  const [rows, setRows] = useState<BillRow[]>([
    {
      productId: "",
      name: "",
      unit: "",
      qty: 1,
      price: 0,
      taxPercent: 0,
      taxAmount: 0,
      amount: 0,
      availableStock: 0,
    },
  ]);

  const [activeProductIndex, setActiveProductIndex] = useState<number | null>(null);
  const [productFilter, setProductFilter] = useState<string>("");

  // Payment
  const [paymentMode, setPaymentMode] = useState<"CASH" | "UPI" | "CARD" | "BANK_TRANSFER">("CASH");
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [completedInvoice, setCompletedInvoice] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Load Reference Data
  useEffect(() => {
    setBillDate(new Date().toISOString().split("T")[0]);
    async function init() {
      try {
        const [custRes, prodRes, orgRes] = await Promise.all([
          fetch("/api/customers").then((r) => r.json()),
          fetch("/api/products").then((r) => r.json()),
          fetch("/api/organization/current").then((r) => r.json()),
        ]);

        if (Array.isArray(custRes)) setCustomers(custRes);
        if (Array.isArray(prodRes)) setProducts(prodRes);
        if (orgRes && !orgRes.error) setOrganization(orgRes);
      } catch (err) {
        console.error("Failed to load initial data:", err);
      }
    }
    init();
  }, []);

  // Customer Autocomplete logic
  function handleCustomerSearch(query: string) {
    setBuyerName(query);
    if (!query.trim()) {
      setCustomerSuggestions([]);
      setSelectedCustomerId("");
      setBuyerArea("");
      setBuyerContact("");
      return;
    }
    const filtered = customers.filter(
      (c) =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.phone.includes(query) ||
        (c.area && c.area.toLowerCase().includes(query.toLowerCase()))
    );
    setCustomerSuggestions(filtered);
  }

  function selectCustomer(cust: Customer) {
    setBuyerName(cust.name);
    setBuyerArea(cust.area || cust.billingAddress || "");
    setBuyerContact(cust.phone);
    setSelectedCustomerId(cust.id);
    setCustomerSuggestions([]);
  }

  // Row Manipulation
  function addRow() {
    setRows([
      ...rows,
      {
        productId: "",
        name: "",
        unit: "",
        qty: 1,
        price: 0,
        taxPercent: 0,
        taxAmount: 0,
        amount: 0,
        availableStock: 0,
      },
    ]);
  }

  function deleteRow(index: number) {
    if (rows.length === 1) {
      setRows([
        {
          productId: "",
          name: "",
          unit: "",
          qty: 1,
          price: 0,
          taxPercent: 0,
          taxAmount: 0,
          amount: 0,
          availableStock: 0,
        },
      ]);
      return;
    }
    setRows(rows.filter((_, idx) => idx !== index));
  }

  function selectProduct(index: number, product: Product) {
    const qty = rows[index].qty || 1;
    const price = parseFloat(product.sellingPrice) || 0;
    const taxPercent = parseFloat(product.taxPercent) || 0;
    const rawTotal = qty * price;
    const taxAmount = (rawTotal * taxPercent) / 100;
    const amount = rawTotal + taxAmount;

    setRows(
      rows.map((row, idx) =>
        idx === index
          ? {
              ...row,
              productId: product.id,
              name: product.name,
              unit: product.unitOfMeasure,
              price,
              taxPercent,
              taxAmount: parseFloat(taxAmount.toFixed(2)),
              amount: parseFloat(amount.toFixed(2)),
              availableStock: parseFloat(product.currentStock) || 0,
            }
          : row
      )
    );
    setActiveProductIndex(null);
    setProductFilter("");
  }

  function updateQuantity(index: number, newQty: number) {
    const qty = Math.max(1, newQty);
    setRows(
      rows.map((row, idx) => {
        if (idx !== index) return row;
        const rawTotal = qty * row.price;
        const taxAmount = (rawTotal * row.taxPercent) / 100;
        const amount = rawTotal + taxAmount;
        return {
          ...row,
          qty,
          taxAmount: parseFloat(taxAmount.toFixed(2)),
          amount: parseFloat(amount.toFixed(2)),
        };
      })
    );
  }

  // Calculations
  const grandTotal = Math.round(
    rows.reduce((acc, r) => acc + (r.amount || 0), 0)
  );

  useEffect(() => {
    if (grandTotal > 0 && paidAmount === 0) {
      setPaidAmount(grandTotal);
    }
  }, [grandTotal]);

  // Submit Invoice to Hono Backend
  async function handleSaveBill() {
    const validRows = rows.filter((r) => r.productId && r.qty > 0);
    if (validRows.length === 0) {
      setErrorMessage("Please select at least one product.");
      return;
    }

    let customerIdToUse = selectedCustomerId;

    // If new customer typed directly, auto-create customer first
    if (!customerIdToUse && buyerName.trim()) {
      try {
        const custRes = await fetch("/api/customers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: buyerName.trim(),
            area: buyerArea.trim(),
            phone: buyerContact.trim() || "N/A",
            billingAddress: buyerArea.trim() || "Local",
          }),
        });
        const newCustData = await custRes.json();
        if (newCustData.id) {
          customerIdToUse = newCustData.id;
          setSelectedCustomerId(newCustData.id);
        }
      } catch (err) {
        console.error("Auto customer creation error:", err);
      }
    }

    if (!customerIdToUse) {
      setErrorMessage("Please select or enter Buyer details (Name and Contact).");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: customerIdToUse,
          invoiceType: "TAX_INVOICE",
          items: validRows.map((r) => ({
            productId: r.productId,
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
        throw new Error(data.error || "Failed to save bill");
      }

      setCompletedInvoice(data);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to process bill");
    } finally {
      setIsSubmitting(false);
    }
  }

  function resetBill() {
    setRows([
      {
        productId: "",
        name: "",
        unit: "",
        qty: 1,
        price: 0,
        taxPercent: 0,
        taxAmount: 0,
        amount: 0,
        availableStock: 0,
      },
    ]);
    setBuyerName("");
    setBuyerArea("");
    setBuyerContact("");
    setSelectedCustomerId("");
    setCompletedInvoice(null);
    setErrorMessage("");
    setPaidAmount(0);
  }

  return (
    <div className="space-y-4">
      {/* Top Date Bar (matching generatebill.php layout) */}
      <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200 shadow-xs">
        <h1 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <span>Generate Bill</span>
        </h1>
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="w-4 h-4 text-gray-500" />
          <b className="text-gray-700">Date:</b>
          <input
            type="date"
            value={billDate}
            onChange={(e) => setBillDate(e.target.value)}
            className="border border-gray-300 rounded px-2.5 py-1 text-sm bg-white text-gray-800 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Buyer Details Card (faithful to generatebill.php) */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-xs overflow-visible">
        <div className="px-4 py-3 border-b border-gray-100">
          <h5 className="font-bold text-gray-800 text-sm">Buyer Details</h5>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Customer Name input with Autocomplete */}
            <div className="relative">
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Name
              </label>
              <input
                type="text"
                value={buyerName}
                onChange={(e) => handleCustomerSearch(e.target.value)}
                placeholder="Name"
                className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm bg-white text-gray-900 focus:outline-none focus:border-blue-500"
              />
              {customerSuggestions.length > 0 && (
                <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto divide-y divide-gray-100">
                  {customerSuggestions.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => selectCustomer(c)}
                      className="p-2.5 hover:bg-blue-50 cursor-pointer text-xs transition-colors"
                    >
                      <div className="font-bold text-gray-900">{c.name}</div>
                      <div className="text-gray-500 text-[11px]">
                        Area: {c.area || "N/A"} • Contact: {c.phone}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Area input (auto-populated, matching legacy) */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Area
              </label>
              <input
                type="text"
                value={buyerArea}
                onChange={(e) => setBuyerArea(e.target.value)}
                placeholder="Area"
                className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm bg-gray-50 text-gray-800 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Contact input (auto-populated, matching legacy) */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Contact
              </label>
              <input
                type="text"
                value={buyerContact}
                onChange={(e) => setBuyerContact(e.target.value)}
                placeholder="Contact"
                className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm bg-gray-50 text-gray-800 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Line Items Table (faithful to generatebill.php table-sm table-bordered) */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-xs overflow-visible">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-200 text-xs font-bold text-gray-700">
                <th className="border border-gray-300 px-3 py-2 text-center w-12">Sr.No</th>
                <th className="border border-gray-300 px-3 py-2 text-center">Product Name</th>
                <th className="border border-gray-300 px-3 py-2 text-center w-28">Unit Measure</th>
                <th className="border border-gray-300 px-3 py-2 text-center w-24">Quantity</th>
                <th className="border border-gray-300 px-3 py-2 text-center w-28">Price</th>
                <th colSpan={2} className="border border-gray-300 px-3 py-1 text-center w-36">
                  Tax
                </th>
                <th className="border border-gray-300 px-3 py-2 text-center w-32">Amount</th>
                <th className="border border-gray-300 px-3 py-2 text-center w-14">
                  <button
                    type="button"
                    onClick={addRow}
                    className="p-1 rounded bg-blue-600 hover:bg-blue-700 text-white shadow-xs inline-flex items-center justify-center"
                    title="Add Row"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </th>
              </tr>
              {/* Sub-header row for Tax % and Tax Amount (matching legacy) */}
              <tr className="bg-gray-50 border-b border-gray-300 text-[11px] font-semibold text-gray-500">
                <th className="border border-gray-300"></th>
                <th className="border border-gray-300"></th>
                <th className="border border-gray-300"></th>
                <th className="border border-gray-300"></th>
                <th className="border border-gray-300"></th>
                <th className="border border-gray-300 text-center py-1">%</th>
                <th className="border border-gray-300 text-center py-1">Amount</th>
                <th className="border border-gray-300"></th>
                <th className="border border-gray-300"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => {
                const isInsufficientStock = row.productId && row.qty > row.availableStock;
                return (
                  <tr key={idx} className="hover:bg-gray-50/50">
                    {/* Sr.No */}
                    <th scope="row" className="border border-gray-300 px-2 py-2 text-center text-xs text-gray-600 font-mono">
                      {idx + 1}
                    </th>

                    {/* Product Name (Searchable Input with dropdown) */}
                    <td className="border border-gray-300 p-1.5 relative">
                      <input
                        type="text"
                        value={row.name}
                        onFocus={() => {
                          setActiveProductIndex(idx);
                          setProductFilter("");
                        }}
                        onChange={(e) => {
                          setRows(
                            rows.map((r, i) => (i === idx ? { ...r, name: e.target.value } : r))
                          );
                          setProductFilter(e.target.value);
                          setActiveProductIndex(idx);
                        }}
                        placeholder="Type product name..."
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm bg-white text-gray-900 focus:outline-none focus:border-blue-500"
                      />

                      {/* Product Autocomplete Dropdown */}
                      {activeProductIndex === idx && (
                        <div className="absolute z-40 left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-xl max-h-52 overflow-y-auto divide-y divide-gray-100">
                          {products
                            .filter((p) =>
                              productFilter
                                ? p.name.toLowerCase().includes(productFilter.toLowerCase())
                                : true
                            )
                            .map((p) => (
                              <div
                                key={p.id}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  selectProduct(idx, p);
                                }}
                                className="p-2 hover:bg-blue-50 cursor-pointer text-xs flex justify-between items-center transition-colors"
                              >
                                <div>
                                  <div className="font-bold text-gray-900">{p.name}</div>
                                  <div className="text-gray-500 text-[11px]">
                                    Stock: {p.currentStock} {p.unitOfMeasure} • Tax: {p.taxPercent}%
                                  </div>
                                </div>
                                <div className="text-right font-bold text-blue-600">
                                  {formatCurrency(p.sellingPrice)}
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </td>

                    {/* Unit Measure */}
                    <td className="border border-gray-300 p-1.5">
                      <input
                        type="text"
                        readOnly
                        value={row.unit}
                        className="w-full border border-gray-200 bg-gray-50 rounded px-2 py-1 text-sm text-gray-700 text-center"
                      />
                    </td>

                    {/* Quantity */}
                    <td className="border border-gray-300 p-1.5">
                      <input
                        type="number"
                        min="1"
                        value={row.qty}
                        onChange={(e) => updateQuantity(idx, parseFloat(e.target.value) || 1)}
                        className={`w-full border rounded px-2 py-1 text-sm text-center font-bold focus:outline-none ${
                          isInsufficientStock
                            ? "border-red-400 bg-red-50 text-red-700"
                            : "border-gray-300 bg-white text-gray-900 focus:border-blue-500"
                        }`}
                      />
                    </td>

                    {/* Price */}
                    <td className="border border-gray-300 p-1.5">
                      <input
                        type="text"
                        readOnly
                        value={row.price ? row.price.toFixed(2) : ""}
                        className="w-full border border-gray-200 bg-gray-50 rounded px-2 py-1 text-sm text-right text-gray-700 font-mono"
                      />
                    </td>

                    {/* Tax % */}
                    <td className="border border-gray-300 p-1.5">
                      <input
                        type="text"
                        readOnly
                        value={row.taxPercent ? `${row.taxPercent}%` : ""}
                        className="w-full border border-gray-200 bg-gray-50 rounded px-2 py-1 text-xs text-center text-gray-600 font-mono"
                      />
                    </td>

                    {/* Tax Amount */}
                    <td className="border border-gray-300 p-1.5">
                      <input
                        type="text"
                        readOnly
                        value={row.taxAmount ? row.taxAmount.toFixed(2) : ""}
                        className="w-full border border-gray-200 bg-gray-50 rounded px-2 py-1 text-sm text-right text-gray-700 font-mono"
                      />
                    </td>

                    {/* Total Amount */}
                    <td className="border border-gray-300 p-1.5">
                      <input
                        type="text"
                        readOnly
                        value={row.amount ? row.amount.toFixed(2) : ""}
                        className="w-full border border-gray-200 bg-gray-50 rounded px-2 py-1 text-sm text-right font-bold text-gray-900 font-mono"
                      />
                    </td>

                    {/* Action (Delete row) */}
                    <td className="border border-gray-300 p-1.5 text-center">
                      <button
                        type="button"
                        onClick={() => deleteRow(idx)}
                        className="p-1 rounded bg-amber-500 hover:bg-amber-600 text-white shadow-xs inline-flex items-center justify-center transition-colors"
                        title="Delete Row"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              {/* Grand Total Footer Row (matching legacy generatebill.php) */}
              <tr className="bg-gray-100 border-t-2 border-gray-300 font-bold text-gray-900">
                <td colSpan={9} className="p-3 text-center text-lg font-black tracking-wide">
                  Total : <span className="text-blue-700 font-mono">{formatCurrency(grandTotal)}</span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Payment & Save Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold text-gray-600 uppercase">Payment Mode:</span>
          {(["CASH", "UPI", "CARD", "BANK_TRANSFER"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setPaymentMode(mode)}
              className={`px-3 py-1.5 rounded text-xs font-bold border transition-colors ${
                paymentMode === mode
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              {mode}
            </button>
          ))}

          <div className="flex items-center gap-2 ml-2">
            <span className="text-xs font-bold text-gray-600">Paid (₹):</span>
            <input
              type="number"
              min="0"
              value={paidAmount}
              onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
              className="w-28 border border-gray-300 rounded px-2.5 py-1 text-sm font-bold font-mono text-gray-900 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={resetBill}
            className="px-4 py-2 rounded text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 border border-gray-300"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={handleSaveBill}
            disabled={isSubmitting || grandTotal === 0}
            className={`px-6 py-2 rounded font-bold text-sm text-white shadow-xs transition-colors ${
              isSubmitting || grandTotal === 0
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isSubmitting ? "Saving..." : "Save & Generate Invoice"}
          </button>
        </div>
      </div>

      {/* Modal on Bill Completion */}
      {completedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-gray-200 max-w-md w-full p-6 text-center space-y-4 shadow-xl">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full mx-auto flex items-center justify-center">
              <CheckCircle className="w-7 h-7" />
            </div>

            <div>
              <div className="text-xs font-bold text-green-600 uppercase tracking-wider">
                Bill Generated Successfully
              </div>
              <h2 className="text-2xl font-black text-gray-900 mt-1">
                {completedInvoice.invoiceNumber}
              </h2>
              <p className="text-sm text-gray-600 mt-0.5">
                Grand Total: <b className="text-gray-900">{formatCurrency(completedInvoice.grandTotal)}</b>
              </p>
            </div>

            {/* Dynamic UPI QR */}
            {completedInvoice.upiPaymentUrl && (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs space-y-1">
                <div className="font-bold text-gray-800 flex items-center justify-center gap-1">
                  <QrCode className="w-4 h-4 text-blue-600" />
                  <span>UPI Payment Link</span>
                </div>
                <div className="font-mono text-[11px] text-gray-500 break-all">
                  {completedInvoice.upiPaymentUrl}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => window.print()}
                className="py-2 px-3 rounded text-xs font-bold bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-800 flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Print Bill</span>
              </button>
              <button
                onClick={resetBill}
                className="py-2 px-3 rounded text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Next Bill</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
