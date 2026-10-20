"use client";

import { useState, useEffect } from "react";
import {
  Boxes,
  Plus,
  Search,
  AlertTriangle,
  ArrowUpDown,
  X,
  PackagePlus,
  CheckCircle,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [adjustProduct, setAdjustProduct] = useState<any | null>(null);

  // New product form
  const [newProd, setNewProd] = useState({
    name: "",
    sku: "",
    barcode: "",
    hsnSac: "9999",
    unitOfMeasure: "PCS",
    purchasePrice: "0.00",
    sellingPrice: "0.00",
    taxPercent: "5.00",
    currentStock: "0.00",
    minStockAlert: "5.00",
  });

  // Adjust stock form
  const [adjustDelta, setAdjustDelta] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<"PURCHASE_INWARD" | "DAMAGE_WASTE" | "AUDIT_ADJUSTMENT">("PURCHASE_INWARD");
  const [adjustNotes, setAdjustNotes] = useState<string>("");

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    try {
      setLoading(true);
      const res = await fetch("/api/products");
      const data = await res.json();
      if (Array.isArray(data)) setProducts(data);
    } catch (err) {
      console.error("Failed to load products:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateProduct(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProd),
      });
      if (res.ok) {
        setIsAddModalOpen(false);
        setNewProd({
          name: "",
          sku: "",
          barcode: "",
          hsnSac: "9999",
          unitOfMeasure: "PCS",
          purchasePrice: "0.00",
          sellingPrice: "0.00",
          taxPercent: "5.00",
          currentStock: "0.00",
          minStockAlert: "5.00",
        });
        loadProducts();
      }
    } catch (err) {
      console.error("Failed to add product:", err);
    }
  }

  async function handleAdjustStock(e: React.FormEvent) {
    e.preventDefault();
    if (!adjustProduct) return;

    try {
      const res = await fetch(`/api/products/${adjustProduct.id}/adjust-stock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          delta: Number(adjustDelta),
          reason: adjustReason,
          notes: adjustNotes,
        }),
      });

      if (res.ok) {
        setAdjustProduct(null);
        setAdjustDelta(0);
        setAdjustNotes("");
        loadProducts();
      }
    } catch (err) {
      console.error("Failed to adjust stock:", err);
    }
  }

  const filteredProducts = products.filter(
    (p) =>
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode?.includes(search) ||
      p.sku?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Boxes className="w-6 h-6 text-emerald-400" />
            <span>Stock & Inventory Management</span>
          </h1>
          <p className="text-xs text-slate-400">
            Real-time double-entry inventory ledger, barcoding, and reorder levels.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, barcode, SKU..."
              className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/80 text-xs font-semibold uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Product Name</th>
                <th className="px-4 py-3">Barcode / SKU</th>
                <th className="px-4 py-3">HSN Code</th>
                <th className="px-4 py-3 text-right">Cost</th>
                <th className="px-4 py-3 text-right">Selling Price</th>
                <th className="px-4 py-3 text-center">Tax %</th>
                <th className="px-4 py-3 text-right">Stock</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-500">
                    Loading products...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-500">
                    No products found. Add a product to get started.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isLow = Number(p.currentStock) <= Number(p.minStockAlert);
                  return (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-medium text-white">
                        <div>{p.name}</div>
                        <div className="text-[11px] text-slate-500">Unit: {p.unitOfMeasure}</div>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-slate-400">
                        <div>{p.barcode || "-"}</div>
                        <div className="text-[10px] text-slate-500">{p.sku}</div>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-slate-400">{p.hsnSac}</td>
                      <td className="px-4 py-3 text-right font-mono text-slate-400">
                        {formatCurrency(p.purchasePrice)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-white">
                        {formatCurrency(p.sellingPrice)}
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-xs text-slate-400">
                        {p.taxPercent}%
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        <div className={`font-bold ${isLow ? "text-rose-400" : "text-emerald-400"}`}>
                          {p.currentStock} {p.unitOfMeasure}
                        </div>
                        {isLow && (
                          <div className="text-[10px] text-rose-500 font-semibold flex items-center justify-end gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Low Stock!</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setAdjustProduct(p)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors"
                        >
                          Adjust
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <PackagePlus className="w-5 h-5 text-emerald-400" />
              <span>Add New Product to Catalog</span>
            </h2>

            <form onSubmit={handleCreateProduct} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Product Name *</label>
                <input
                  required
                  type="text"
                  value={newProd.name}
                  onChange={(e) => setNewProd({ ...newProd, name: e.target.value })}
                  placeholder="e.g. Royal Basmati Rice 25kg"
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Barcode</label>
                  <input
                    type="text"
                    value={newProd.barcode}
                    onChange={(e) => setNewProd({ ...newProd, barcode: e.target.value })}
                    placeholder="890123456789"
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">SKU Code</label>
                  <input
                    type="text"
                    value={newProd.sku}
                    onChange={(e) => setNewProd({ ...newProd, sku: e.target.value })}
                    placeholder="RICE-BAS-25"
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">HSN / SAC</label>
                  <input
                    type="text"
                    value={newProd.hsnSac}
                    onChange={(e) => setNewProd({ ...newProd, hsnSac: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Unit of Measure</label>
                  <input
                    type="text"
                    value={newProd.unitOfMeasure}
                    onChange={(e) => setNewProd({ ...newProd, unitOfMeasure: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">GST Tax %</label>
                  <input
                    type="number"
                    value={newProd.taxPercent}
                    onChange={(e) => setNewProd({ ...newProd, taxPercent: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Purchase Price (Cost)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newProd.purchasePrice}
                    onChange={(e) => setNewProd({ ...newProd, purchasePrice: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Selling Price *</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    value={newProd.sellingPrice}
                    onChange={(e) => setNewProd({ ...newProd, sellingPrice: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2 font-mono font-bold text-emerald-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Initial Stock</label>
                  <input
                    type="number"
                    value={newProd.currentStock}
                    onChange={(e) => setNewProd({ ...newProd, currentStock: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Min Stock Alert</label>
                  <input
                    type="number"
                    value={newProd.minStockAlert}
                    onChange={(e) => setNewProd({ ...newProd, minStockAlert: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2 font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {adjustProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setAdjustProduct(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ArrowUpDown className="w-5 h-5 text-emerald-400" />
              <span>Adjust Inventory Balance</span>
            </h2>
            <div className="text-xs text-slate-400">
              Product: <b className="text-white">{adjustProduct.name}</b> (Current:{" "}
              {adjustProduct.currentStock} {adjustProduct.unitOfMeasure})
            </div>

            <form onSubmit={handleAdjustStock} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Adjustment Type</label>
                <select
                  value={adjustReason}
                  onChange={(e: any) => setAdjustReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2"
                >
                  <option value="PURCHASE_INWARD">Purchase Inward / Restock (+)</option>
                  <option value="DAMAGE_WASTE">Damage / Spoilage / Wastage (-)</option>
                  <option value="AUDIT_ADJUSTMENT">Physical Audit Correction (+ / -)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">
                  Quantity Delta (Use negative for deduction)
                </label>
                <input
                  required
                  type="number"
                  step="0.01"
                  value={adjustDelta}
                  onChange={(e) => setAdjustDelta(parseFloat(e.target.value) || 0)}
                  placeholder="e.g. 10 or -5"
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Notes / Supplier Reference</label>
                <input
                  type="text"
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  placeholder="e.g. Inward from supplier bill #402"
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustProduct(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold"
                >
                  Record Movement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
