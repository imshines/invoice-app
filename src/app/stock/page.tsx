"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit, X, Search, Boxes, AlertTriangle, ShieldCheck } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

export default function StockPage() {
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);

  // Form matching stock.php / stockinsert.php
  const [formData, setFormData] = useState({
    id: "",
    pname: "",
    unit_measure: "PCS",
    qty: "0",
    percent: "0",
    tax_amount: "0",
    price: "",
  });

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
      console.error("Failed to load stock:", err);
    } finally {
      setLoading(false);
    }
  }

  function openAddModal() {
    setEditingProduct(null);
    setFormData({
      id: `P${String(products.length + 1).padStart(3, "0")}`,
      pname: "",
      unit_measure: "PCS",
      qty: "0",
      percent: "5.00",
      tax_amount: "0",
      price: "",
    });
    setIsModalOpen(true);
  }

  function openEditModal(prod: any) {
    setEditingProduct(prod);
    setFormData({
      id: prod.sku || prod.id.slice(0, 8),
      pname: prod.name,
      unit_measure: prod.unitOfMeasure,
      qty: prod.currentStock,
      percent: prod.taxPercent,
      tax_amount: "0",
      price: prod.sellingPrice,
    });
    setIsModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editingProduct) {
        const res = await fetch(`/api/products/${editingProduct.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sku: formData.id,
            name: formData.pname,
            unitOfMeasure: formData.unit_measure,
            currentStock: formData.qty,
            taxPercent: formData.percent,
            sellingPrice: formData.price,
          }),
        });
        if (!res.ok) {
          const errData = await res.json();
          alert(errData.error || "Failed to update product");
          return;
        }
      } else {
        const res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sku: formData.id,
            name: formData.pname,
            unitOfMeasure: formData.unit_measure,
            currentStock: formData.qty,
            taxPercent: formData.percent,
            sellingPrice: formData.price,
          }),
        });
        if (!res.ok) {
          const errData = await res.json();
          alert(errData.error || "Failed to create product");
          return;
        }
      }

      setIsModalOpen(false);
      loadProducts();
    } catch (err) {
      console.error("Failed to save product:", err);
    }
  }

  async function handleDelete(id: string) {
    if (confirm("Are you sure you want to delete this product?")) {
      try {
        const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
        if (res.ok) {
          loadProducts();
        } else {
          const errData = await res.json();
          alert(errData.error || "Failed to delete product");
        }
      } catch (err) {
        console.error("Failed to delete product:", err);
      }
    }
  }

  const filtered = products.filter(
    (p) =>
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Boxes className="w-5 h-5 text-emerald-400" />
            <span>Stock & Inventory Catalog</span>
          </h1>
          <p className="text-xs text-slate-400">
            Real-time inventory levels, pricing, units of measure, and stock ledger.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search product..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-2.5" />
          </div>

          {isAdmin ? (
            <button
              onClick={openAddModal}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add Product</span>
            </button>
          ) : (
            <div className="text-[11px] text-slate-400 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 font-mono">
              Cashier Read-Only
            </div>
          )}
        </div>
      </div>

      {/* Stock Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse text-slate-300">
            <thead className="bg-slate-950/80 text-xs font-semibold uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Product Name</th>
                <th className="px-4 py-3">Unit Of Measure</th>
                <th className="px-4 py-3 text-center">Available Stock</th>
                <th className="px-4 py-3 text-right">Selling Price</th>
                <th className="px-4 py-3 text-center w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-500">
                    Loading stock...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-500">
                    No products found in catalog.
                  </td>
                </tr>
              ) : (
                filtered.map((prod) => {
                  const stockNum = parseFloat(prod.currentStock) || 0;
                  const isOutOfStock = stockNum <= 0;
                  const isLow = stockNum > 0 && stockNum <= 5;

                  return (
                    <tr key={prod.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-mono text-emerald-400 font-semibold">
                        {prod.sku || prod.id.slice(0, 8)}
                      </td>
                      <td className="px-4 py-3 font-bold text-white">
                        {prod.name}
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {prod.unitOfMeasure}
                      </td>
                      <td className="px-4 py-3 text-center font-bold font-mono">
                        <span
                          className={
                            isOutOfStock
                              ? "text-rose-500 font-black"
                              : isLow
                              ? "text-amber-400"
                              : "text-white"
                          }
                        >
                          {prod.currentStock}
                        </span>
                        {isOutOfStock && (
                          <span className="ml-1.5 text-[10px] text-rose-400 font-bold">
                            Out of Stock
                          </span>
                        )}
                        {isLow && (
                          <span className="ml-1.5 text-[10px] text-amber-400 font-bold">
                            ⚠️ Low
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-emerald-400">
                        {formatCurrency(prod.sellingPrice)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isAdmin ? (
                          <div className="space-x-1.5">
                            <button
                              onClick={() => openEditModal(prod)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 shadow-xs transition-colors"
                              title="Edit"
                            >
                              <Edit className="w-3.5 h-3.5 inline" />
                            </button>
                            <button
                              onClick={() => handleDelete(prod.id)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 border border-slate-700 shadow-xs transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5 inline" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500 font-mono">View Only</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal (Admin Only) */}
      {isModalOpen && isAdmin && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl border border-slate-800 max-w-md w-full shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h5 className="font-bold text-base text-white">
                {editingProduct ? "Edit Product" : "Add Product"}
              </h5>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Product ID / Code</label>
                <input
                  type="text"
                  value={formData.id}
                  onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Product Name *</label>
                <input
                  required
                  type="text"
                  value={formData.pname}
                  onChange={(e) => setFormData({ ...formData, pname: e.target.value })}
                  placeholder="e.g. Prestige Pressure Cooker 5L"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Unit of Measure</label>
                  <select
                    value={formData.unit_measure}
                    onChange={(e) => setFormData({ ...formData, unit_measure: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="PCS">PCS (Pieces)</option>
                    <option value="KG">KG (Kilograms)</option>
                    <option value="BAG">BAG (Bags/Sacks)</option>
                    <option value="TIN">TIN (Tins/Cans)</option>
                    <option value="BOX">BOX (Boxes)</option>
                    <option value="LTR">LTR (Liters)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Available Stock (Qty) *</label>
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.qty}
                    onChange={(e) => setFormData({ ...formData, qty: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Selling Price (₹) *</label>
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">GST Tax (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.percent}
                    onChange={(e) => setFormData({ ...formData, percent: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                >
                  {editingProduct ? "Save Changes" : "Insert Stock"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
