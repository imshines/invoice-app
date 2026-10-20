"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit, X, Search, Package } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function StockPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);

  // Form matching stock.php / stockinsert.php
  const [formData, setFormData] = useState({
    id: "", // ID / SKU
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
      percent: "0",
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
        // Update product
        await fetch(`/api/products/${editingProduct.id}`, {
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
      } else {
        // Insert product (stockinsert.php)
        await fetch("/api/products", {
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
        await fetch(`/api/products/${id}`, { method: "DELETE" });
        loadProducts();
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3 rounded-lg border border-gray-200 shadow-xs">
        <h1 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <span>Stock</span>
        </h1>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search product..."
              className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
            />
            <Search className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-2.5" />
          </div>
        </div>
      </div>

      {/* Stock Table matching stock.php */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-gray-100 text-xs font-semibold text-gray-700 border-b border-gray-200">
              <tr>
                <th className="px-4 py-2.5 border-r border-gray-200">ID</th>
                <th className="px-4 py-2.5 border-r border-gray-200">Product Name</th>
                <th className="px-4 py-2.5 border-r border-gray-200">Unit Of Measure</th>
                <th className="px-4 py-2.5 border-r border-gray-200 text-center">Quantity</th>
                <th className="px-4 py-2.5 border-r border-gray-200 text-right">Price</th>
                <th className="px-4 py-2 text-center w-28">
                  <button
                    type="button"
                    onClick={openAddModal}
                    className="p-1 px-2.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs inline-flex items-center gap-1 shadow-xs"
                    title="Add Product"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500">
                    Loading stock...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500">
                    0 results
                  </td>
                </tr>
              ) : (
                filtered.map((prod) => (
                  <tr key={prod.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 border-r border-gray-200 font-mono text-gray-600">
                      {prod.sku || prod.id.slice(0, 8)}
                    </td>
                    <td className="px-4 py-2.5 border-r border-gray-200 font-semibold text-gray-900">
                      {prod.name}
                    </td>
                    <td className="px-4 py-2.5 border-r border-gray-200 text-gray-700">
                      {prod.unitOfMeasure}
                    </td>
                    <td className="px-4 py-2.5 border-r border-gray-200 text-center font-bold font-mono text-gray-900">
                      {prod.currentStock}
                    </td>
                    <td className="px-4 py-2.5 border-r border-gray-200 text-right font-mono font-bold text-gray-900">
                      {prod.sellingPrice}
                    </td>
                    <td className="px-4 py-2 text-center space-x-1">
                      <button
                        onClick={() => handleDelete(prod.id)}
                        className="p-1 px-2 rounded bg-red-600 hover:bg-red-700 text-white shadow-xs"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5 inline" />
                      </button>
                      <button
                        onClick={() => openEditModal(prod)}
                        className="p-1 px-2 rounded bg-green-600 hover:bg-green-700 text-white shadow-xs"
                        title="Edit"
                      >
                        <Edit className="w-3.5 h-3.5 inline" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal (faithful to exampleModal in stock.php) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-gray-200 max-w-md w-full shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
              <h5 className="font-bold text-sm text-gray-800">
                {editingProduct ? "Edit Product" : "Add Product"}
              </h5>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-3 text-xs">
              <div className="grid grid-cols-4 items-center gap-2">
                <label className="text-gray-600 font-semibold">ID</label>
                <div className="col-span-3">
                  <input
                    type="text"
                    value={formData.id}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                    placeholder="ID"
                    className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-2">
                <label className="text-gray-600 font-semibold">Name *</label>
                <div className="col-span-3">
                  <input
                    required
                    type="text"
                    value={formData.pname}
                    onChange={(e) => setFormData({ ...formData, pname: e.target.value })}
                    placeholder="Name"
                    className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-2">
                <label className="text-gray-600 font-semibold">Unit</label>
                <div className="col-span-3">
                  <input
                    type="text"
                    value={formData.unit_measure}
                    onChange={(e) => setFormData({ ...formData, unit_measure: e.target.value })}
                    placeholder="Unit"
                    className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-2">
                <label className="text-gray-600 font-semibold">Qty</label>
                <div className="col-span-3">
                  <input
                    type="number"
                    value={formData.qty}
                    onChange={(e) => setFormData({ ...formData, qty: e.target.value })}
                    placeholder="Qty"
                    className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-2">
                <label className="text-gray-600 font-semibold">Tax</label>
                <div className="col-span-3 grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={formData.percent}
                    onChange={(e) => setFormData({ ...formData, percent: e.target.value })}
                    placeholder="%"
                    className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-blue-500 font-mono"
                  />
                  <input
                    type="text"
                    value={formData.tax_amount}
                    onChange={(e) => setFormData({ ...formData, tax_amount: e.target.value })}
                    placeholder="Amount"
                    className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-2">
                <label className="text-gray-600 font-semibold">Price *</label>
                <div className="col-span-3">
                  <input
                    required
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="Price"
                    className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs font-bold font-mono text-gray-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-gray-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-medium"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs"
                >
                  {editingProduct ? "UPDATE" : "ADD"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
