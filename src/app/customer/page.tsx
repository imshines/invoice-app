"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit, X, Search, User } from "lucide-react";

export default function CustomerPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any | null>(null);

  // Form matching customer.php / addcustomer.php
  const [formData, setFormData] = useState({
    cid: "",
    cname: "",
    area: "",
    contact: "",
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  async function loadCustomers() {
    try {
      setLoading(true);
      const res = await fetch("/api/customers");
      const data = await res.json();
      if (Array.isArray(data)) setCustomers(data);
    } catch (err) {
      console.error("Failed to load customers:", err);
    } finally {
      setLoading(false);
    }
  }

  function openAddModal() {
    setEditingCustomer(null);
    setFormData({
      cid: `C${String(customers.length + 1).padStart(3, "0")}`,
      cname: "",
      area: "",
      contact: "",
    });
    setIsModalOpen(true);
  }

  function openEditModal(cust: any) {
    setEditingCustomer(cust);
    setFormData({
      cid: cust.customerCode || cust.id.slice(0, 8),
      cname: cust.name,
      area: cust.area || cust.billingAddress || "",
      contact: cust.phone,
    });
    setIsModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editingCustomer) {
        // Update customer (customer_update.php)
        await fetch(`/api/customers/${editingCustomer.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerCode: formData.cid,
            name: formData.cname,
            area: formData.area,
            phone: formData.contact,
            billingAddress: formData.area,
          }),
        });
      } else {
        // Add customer (addcustomer.php)
        await fetch("/api/customers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerCode: formData.cid,
            name: formData.cname,
            area: formData.area,
            phone: formData.contact,
            billingAddress: formData.area,
          }),
        });
      }

      setIsModalOpen(false);
      loadCustomers();
    } catch (err) {
      console.error("Failed to save customer:", err);
    }
  }

  async function handleDelete(id: string) {
    if (confirm("Are you sure you want to delete this customer?")) {
      try {
        await fetch(`/api/customers/${id}`, { method: "DELETE" });
        loadCustomers();
      } catch (err) {
        console.error("Failed to delete customer:", err);
      }
    }
  }

  const filtered = customers.filter(
    (c) =>
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search) ||
      c.area?.toLowerCase().includes(search.toLowerCase()) ||
      c.customerCode?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3 rounded-lg border border-gray-200 shadow-xs">
        <h1 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <span>Customer</span>
        </h1>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customer..."
              className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
            />
            <Search className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-2.5" />
          </div>
        </div>
      </div>

      {/* Customer Table matching customer.php */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-gray-100 text-xs font-semibold text-gray-700 border-b border-gray-200">
              <tr>
                <th className="px-4 py-2.5 border-r border-gray-200">ID</th>
                <th className="px-4 py-2.5 border-r border-gray-200">Customer Name</th>
                <th className="px-4 py-2.5 border-r border-gray-200">Area</th>
                <th className="px-4 py-2.5 border-r border-gray-200">Contact</th>
                <th className="px-4 py-2 text-center w-28">
                  <button
                    type="button"
                    onClick={openAddModal}
                    className="p-1 px-2.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs inline-flex items-center gap-1 shadow-xs"
                    title="Add Customer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500">
                    Loading customers...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500">
                    0 results
                  </td>
                </tr>
              ) : (
                filtered.map((cust) => (
                  <tr key={cust.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 border-r border-gray-200 font-mono text-gray-600">
                      {cust.customerCode || cust.id.slice(0, 8)}
                    </td>
                    <td className="px-4 py-2.5 border-r border-gray-200 font-semibold text-gray-900">
                      {cust.name}
                    </td>
                    <td className="px-4 py-2.5 border-r border-gray-200 text-gray-700">
                      {cust.area || cust.billingAddress || "-"}
                    </td>
                    <td className="px-4 py-2.5 border-r border-gray-200 font-mono text-gray-800">
                      {cust.phone}
                    </td>
                    <td className="px-4 py-2 text-center space-x-1">
                      <button
                        onClick={() => handleDelete(cust.id)}
                        className="p-1 px-2 rounded bg-red-600 hover:bg-red-700 text-white shadow-xs"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5 inline" />
                      </button>
                      <button
                        onClick={() => openEditModal(cust)}
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

      {/* Add / Edit Customer Modal (faithful to exampleModal in customer.php) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-gray-200 max-w-md w-full shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
              <h5 className="font-bold text-sm text-gray-800">
                {editingCustomer ? "Edit Customer" : "Add Customer"}
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
                    value={formData.cid}
                    onChange={(e) => setFormData({ ...formData, cid: e.target.value })}
                    placeholder="ID"
                    className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-2">
                <label className="text-gray-600 font-semibold">Customer Name *</label>
                <div className="col-span-3">
                  <input
                    required
                    type="text"
                    value={formData.cname}
                    onChange={(e) => setFormData({ ...formData, cname: e.target.value })}
                    placeholder="Customer Name"
                    className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-2">
                <label className="text-gray-600 font-semibold">Area</label>
                <div className="col-span-3">
                  <input
                    type="text"
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    placeholder="Area"
                    className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-2">
                <label className="text-gray-600 font-semibold">Contact *</label>
                <div className="col-span-3">
                  <input
                    required
                    type="text"
                    value={formData.contact}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                    placeholder="Contact"
                    className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs font-mono text-gray-900 focus:outline-none focus:border-blue-500"
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
                  {editingCustomer ? "UPDATE" : "ADD Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
