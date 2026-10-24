"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Trash2, X, Users, UserPlus, ShieldCheck, ShieldAlert } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function UsersPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "BILLING_CASHIER" as const,
  });

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin]);

  async function loadUsers() {
    try {
      setLoading(true);
      const res = await fetch("/api/users");
      const data = await res.json();
      if (Array.isArray(data)) setUsers(data);
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setForm({ fullName: "", email: "", password: "", role: "BILLING_CASHIER" });
        loadUsers();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to create user");
      }
    } catch (err) {
      console.error("Failed to create user:", err);
    }
  }

  async function handleDelete(id: string) {
    if (confirm("Are you sure you want to delete this user?")) {
      try {
        const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
        if (res.ok) {
          loadUsers();
        } else {
          const data = await res.json();
          alert(data.error || "Failed to delete user");
        }
      } catch (err) {
        console.error("Failed to delete user:", err);
      }
    }
  }

  if (!authLoading && !isAdmin) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl mx-auto flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">Administrator Access Required</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            You are currently logged in as <span className="text-white font-semibold">{user?.fullName || "Cashier"}</span> ({user?.role}). Only Organization Administrators have permission to view, create, or manage staff user accounts.
          </p>
          <Link
            href="/generatebill"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
          >
            <span>Return to Billing POS</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-5xl">
      <div className="flex items-center justify-between bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            <span>User Accounts & RBAC</span>
          </h1>
          <p className="text-xs text-slate-400">
            Cashiers, managers, and administrators authorized to generate bills.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 inline-flex items-center gap-1.5 transition-all active:scale-95"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add User Account</span>
        </button>
      </div>

      {/* Users table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse text-slate-300">
            <thead className="bg-slate-950/80 text-xs font-semibold uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3 w-16">#</th>
                <th className="px-4 py-3">Full Name</th>
                <th className="px-4 py-3">Email Address</th>
                <th className="px-4 py-3">Assigned Role</th>
                <th className="px-4 py-3">Created At</th>
                <th className="px-4 py-3 text-center w-20">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-500">
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-500">
                    No users registered. Click "Add User Account".
                  </td>
                </tr>
              ) : (
                users.map((u, i) => (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-mono text-slate-500">{i + 1}</td>
                    <td className="px-4 py-3 font-bold text-white flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold text-xs">
                        {u.fullName?.charAt(0) || "U"}
                      </div>
                      <span>{u.fullName}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-400">{u.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                          u.role === "ORG_ADMIN" || u.role === "SUPERADMIN"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                            : "bg-blue-500/10 text-blue-400 border border-blue-500/30"
                        }`}
                      >
                        <ShieldCheck className="w-3 h-3" />
                        <span>{u.role}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleDelete(u.id)}
                        className="text-slate-500 hover:text-rose-400 p-1.5 transition-colors"
                        title="Delete User"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-emerald-400" />
                <span>Create Staff Account</span>
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Full Name *</label>
                <input
                  required
                  type="text"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  placeholder="e.g. Ramesh Cashier"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Email Address *</label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="cashier@metro.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Login Password *</label>
                <input
                  required
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Minimum 4 characters"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Role / Permissions</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-mono"
                >
                  <option value="BILLING_CASHIER">BILLING_CASHIER (Fast POS & Receipt Billing)</option>
                  <option value="ORG_ADMIN">ORG_ADMIN (Full Settings, Inventory & User Management)</option>
                  <option value="INVENTORY_MANAGER">INVENTORY_MANAGER (Stock inward & ledger)</option>
                  <option value="ACCOUNTANT">ACCOUNTANT (Khata, Payments & Tax ledger)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
