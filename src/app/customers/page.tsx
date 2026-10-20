"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Plus,
  Search,
  CreditCard,
  Phone,
  MapPin,
  X,
  UserPlus,
  ArrowUpRight,
  FileText,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);

  // New customer form
  const [newCust, setNewCust] = useState({
    name: "",
    companyName: "",
    phone: "",
    email: "",
    gstin: "",
    billingAddress: "",
    city: "Coimbatore",
    state: "Tamil Nadu",
    stateCode: "33",
    creditLimit: "50000.00",
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

  async function handleCreateCustomer(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCust),
      });
      if (res.ok) {
        setIsAddModalOpen(false);
        setNewCust({
          name: "",
          companyName: "",
          phone: "",
          email: "",
          gstin: "",
          billingAddress: "",
          city: "Coimbatore",
          state: "Tamil Nadu",
          stateCode: "33",
          creditLimit: "50000.00",
        });
        loadCustomers();
      }
    } catch (err) {
      console.error("Failed to create customer:", err);
    }
  }

  async function openCustomerLedger(id: string) {
    try {
      const res = await fetch(`/api/customers/${id}`);
      const data = await res.json();
      setSelectedCustomer(data);
    } catch (err) {
      console.error("Failed to fetch customer ledger:", err);
    }
  }

  const filtered = customers.filter(
    (c) =>
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search) ||
      c.companyName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-400" />
            <span>Customers & Khata (Credit) Ledger</span>
          </h1>
          <p className="text-xs text-slate-400">
            Track customer receivables, credit limits, contact directory, and GST details.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, phone, company..."
              className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/80 text-xs font-semibold uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Customer Name</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">City & State</th>
                <th className="px-4 py-3">GSTIN</th>
                <th className="px-4 py-3 text-right">Credit Limit</th>
                <th className="px-4 py-3 text-right">Khata Balance</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-500">
                    Loading customers...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-500">
                    No customers found. Add a customer to build your Khata directory.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => {
                  const balance = Number(c.currentBalance || 0);
                  return (
                    <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-medium text-white">
                        <div>{c.name}</div>
                        {c.companyName && (
                          <div className="text-[11px] text-slate-400">{c.companyName}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-300">
                        <div className="flex items-center gap-1 font-mono">
                          <Phone className="w-3 h-3 text-slate-500" />
                          <span>{c.phone}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">
                        {c.city}, {c.state}
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-emerald-400">
                        {c.gstin || "-"}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-400">
                        {formatCurrency(c.creditLimit)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        {balance > 0 ? (
                          <span className="font-bold text-amber-400">
                            {formatCurrency(balance)}
                          </span>
                        ) : (
                          <span className="text-emerald-400 font-semibold">₹0.00</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => openCustomerLedger(c.id)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors"
                        >
                          Ledger
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

      {/* Add Customer Modal */}
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
              <UserPlus className="w-5 h-5 text-emerald-400" />
              <span>Add Customer to Khata Directory</span>
            </h2>

            <form onSubmit={handleCreateCustomer} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Customer / Contact Name *</label>
                  <input
                    required
                    type="text"
                    value={newCust.name}
                    onChange={(e) => setNewCust({ ...newCust, name: e.target.value })}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Business / Trade Name</label>
                  <input
                    type="text"
                    value={newCust.companyName}
                    onChange={(e) => setNewCust({ ...newCust, companyName: e.target.value })}
                    placeholder="e.g. Kumar Store"
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Mobile Number *</label>
                  <input
                    required
                    type="text"
                    value={newCust.phone}
                    onChange={(e) => setNewCust({ ...newCust, phone: e.target.value })}
                    placeholder="9876543210"
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">GSTIN Number</label>
                  <input
                    type="text"
                    value={newCust.gstin}
                    onChange={(e) => setNewCust({ ...newCust, gstin: e.target.value })}
                    placeholder="33ABCDE1234F1Z5"
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2 font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Billing Address *</label>
                <input
                  required
                  type="text"
                  value={newCust.billingAddress}
                  onChange={(e) => setNewCust({ ...newCust, billingAddress: e.target.value })}
                  placeholder="Street address, area"
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">City</label>
                  <input
                    type="text"
                    value={newCust.city}
                    onChange={(e) => setNewCust({ ...newCust, city: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">State</label>
                  <input
                    type="text"
                    value={newCust.state}
                    onChange={(e) => setNewCust({ ...newCust, state: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Credit Limit (₹)</label>
                  <input
                    type="number"
                    value={newCust.creditLimit}
                    onChange={(e) => setNewCust({ ...newCust, creditLimit: e.target.value })}
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
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Ledger Drawer Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setSelectedCustomer(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
            <div>
              <div className="text-xs uppercase font-bold text-emerald-400 tracking-wider">
                Customer Khata Ledger
              </div>
              <h2 className="text-xl font-black text-white mt-0.5">
                {selectedCustomer.customer.name}
              </h2>
              <p className="text-xs text-slate-400">
                Phone: {selectedCustomer.customer.phone} • Address:{" "}
                {selectedCustomer.customer.billingAddress}
              </p>
            </div>

            {/* Balance Summary Box */}
            <div className="grid grid-cols-2 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
              <div>
                <span className="text-slate-400">Credit Limit:</span>
                <div className="text-sm font-mono font-bold text-white">
                  {formatCurrency(selectedCustomer.customer.creditLimit)}
                </div>
              </div>
              <div className="text-right">
                <span className="text-slate-400">Current Outstanding:</span>
                <div className="text-lg font-mono font-black text-amber-400">
                  {formatCurrency(selectedCustomer.customer.currentBalance)}
                </div>
              </div>
            </div>

            {/* Invoices */}
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2">
                Recent Invoices
              </h3>
              <div className="max-h-40 overflow-y-auto border border-slate-800 rounded-xl divide-y divide-slate-800 text-xs">
                {selectedCustomer.recentInvoices?.length === 0 ? (
                  <div className="p-3 text-slate-500 text-center">No invoices yet.</div>
                ) : (
                  selectedCustomer.recentInvoices?.map((inv: any) => (
                    <div key={inv.id} className="p-2.5 flex justify-between items-center">
                      <div>
                        <span className="font-mono text-emerald-400 font-bold mr-2">
                          {inv.invoiceNumber}
                        </span>
                        <span className="text-slate-400">{inv.invoiceDate}</span>
                      </div>
                      <div className="space-x-3">
                        <span className="font-mono font-bold text-white">
                          {formatCurrency(inv.grandTotal)}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 uppercase">
                          {inv.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
