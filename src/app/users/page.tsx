"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, X, Users, UserPlus } from "lucide-react";

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form matching register.php
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "BILLING_CASHIER" as const,
  });

  useEffect(() => {
    loadUsers();
  }, []);

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
        await fetch(`/api/users/${id}`, { method: "DELETE" });
        loadUsers();
      } catch (err) {
        console.error("Failed to delete user:", err);
      }
    }
  }

  return (
    <div className="space-y-4 max-w-5xl">
      <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200 shadow-xs">
        <h1 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <span>Users</span>
        </h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs inline-flex items-center gap-1.5"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Sign up / Add User</span>
        </button>
      </div>

      {/* Users table matching user.php */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-gray-100 text-xs font-semibold text-gray-700 border-b border-gray-200">
              <tr>
                <th className="px-4 py-2.5 border-r border-gray-200 w-16">ID</th>
                <th className="px-4 py-2.5 border-r border-gray-200">user Name</th>
                <th className="px-4 py-2.5 border-r border-gray-200">Email</th>
                <th className="px-4 py-2.5 border-r border-gray-200">Role</th>
                <th className="px-4 py-2.5 border-r border-gray-200">Created at</th>
                <th className="px-4 py-2.5 text-center w-20">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500">
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500">
                    0 results
                  </td>
                </tr>
              ) : (
                users.map((u, i) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 border-r border-gray-200 font-mono text-gray-500">
                      {i + 1}
                    </td>
                    <td className="px-4 py-2.5 border-r border-gray-200 font-bold text-gray-900">
                      {u.fullName}
                    </td>
                    <td className="px-4 py-2.5 border-r border-gray-200 text-gray-600">
                      {u.email}
                    </td>
                    <td className="px-4 py-2.5 border-r border-gray-200">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 border-r border-gray-200 text-gray-500 text-[11px]">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <button
                        onClick={() => handleDelete(u.id)}
                        className="p-1 px-2 rounded bg-red-600 hover:bg-red-700 text-white shadow-xs"
                        title="Delete User"
                      >
                        <Trash2 className="w-3.5 h-3.5 inline" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sign up modal (register.php) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-gray-200 max-w-md w-full shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
              <h5 className="font-bold text-sm text-gray-800">Sign Up User</h5>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-3 text-xs">
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Username / Full Name *</label>
                <input
                  required
                  type="text"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  placeholder="Username"
                  className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">Email *</label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="user@example.com"
                  className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">Password *</label>
                <input
                  required
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Password"
                  className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">Role</label>
                <select
                  value={form.role}
                  onChange={(e: any) => setForm({ ...form, role: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-blue-500 bg-white"
                >
                  <option value="BILLING_CASHIER">Billing Staff / Cashier</option>
                  <option value="ORG_ADMIN">Organization Admin</option>
                  <option value="INVENTORY_MANAGER">Inventory Manager</option>
                  <option value="ACCOUNTANT">Accountant</option>
                </select>
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
                  Sign Up
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
