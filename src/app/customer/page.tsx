"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit, X, Search, Users, Phone, MapPin } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function CustomerPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any | null>(null);

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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            <span>Customers & Khata Ledger</span>
          </h1>
          <p className="text-xs text-slate-400">
            Customer directory, credit balances ("udhaar"), and contact details.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customer..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-2.5" />
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse text-slate-300">
            <thead className="bg-slate-950/80 text-xs font-semibold uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Customer Name</th>
                <th className="px-4 py-3">Area</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3 text-right">Khata Due</th>
                <th className="px-4 py-3 text-center w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-500">
                    Loading customers...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-500">
                    No customers found. Click "Add Customer" to create one.
                  </td>
                </tr>
              ) : (
                filtered.map((cust) => {
                  const due = Number(cust.currentBalance || 0);
                  return (
                    <tr key={cust.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-mono text-emerald-400 font-semibold">
                        {cust.customerCode || cust.id.slice(0, 8)}
                      </td>
                      <td className="px-4 py-3 font-bold text-white">
                        {cust.name}
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {cust.area || cust.billingAddress || "-"}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-300">
                        {cust.phone}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold">
                        {due > 0 ? (
                          <span className="text-amber-400">{formatCurrency(due)}</span>
                        ) : (
                          <span className="text-emerald-400">₹0.00</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center space-x-1.5">
                        <button
                          onClick={() => openEditModal(cust)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 shadow-xs transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-3.5 h-3.5 inline" />
                        </button>
                        <button
                          onClick={() => handleDelete(cust.id)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 border border-slate-700 shadow-xs transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5 inline" />
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl border border-slate-800 max-w-md w-full shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h5 className="font-bold text-base text-white">
                {editingCustomer ? "Edit Customer" : "Add Customer"}
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
                <label className="block text-slate-400 mb-1">Customer ID / Code</label>
                <input
                  type="text"
                  value={formData.cid}
                  onChange={(e) => setFormData({ ...formData, cid: e.target.value })}
                  placeholder="e.g. C101"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Customer Name *</label>
                <input
                  required
                  type="text"
                  value={formData.cname}
                  onChange={(e) => setFormData({ ...formData, cname: e.target.value })}
                  placeholder="Customer Name"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Area / Address</label>
                <input
                  type="text"
                  value={formData.area}
                  onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                  placeholder="Area / Location"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Contact Phone *</label>
                <input
                  required
                  type="text"
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  placeholder="Mobile / Contact number"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-800 text-slate-300 hover:bg-slate-800 text-xs font-semibold"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                >
                  {editingCustomer ? "Update Customer" : "Add Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
