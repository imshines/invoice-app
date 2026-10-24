"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle, Building, Save, ShieldAlert } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function CompanyPage() {
  const { user, isAdmin, loading } = useAuth();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    company: "",
    tin: "",
    mob1: "",
    mob2: "",
    addr: "",
    city: "",
    pin: "",
    upiVpa: "",
    state: "",
    stateCode: "33",
  });

  useEffect(() => {
    async function loadOrg() {
      try {
        const res = await fetch("/api/organization/current");
        const data = await res.json();
        if (data && !data.error) {
          setForm({
            company: data.tradeName || data.legalName || "",
            tin: data.gstin || "",
            mob1: data.phonePrimary || "",
            mob2: data.phoneSecondary || "",
            addr: data.addressLine || "",
            city: data.city || "",
            pin: data.pinCode || "",
            upiVpa: data.upiVpa || "",
            state: data.state || "",
            stateCode: data.stateCode || "33",
          });
        }
      } catch (err) {
        console.error("Failed to load company:", err);
      }
    }
    loadOrg();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("/api/organization/current", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          legalName: form.company,
          tradeName: form.company,
          gstin: form.tin,
          phonePrimary: form.mob1,
          phoneSecondary: form.mob2,
          addressLine: form.addr,
          city: form.city,
          pinCode: form.pin,
          upiVpa: form.upiVpa,
          state: form.state || "Tamil Nadu",
          stateCode: form.stateCode || "33",
        }),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to save company settings");
      }
    } catch (err) {
      console.error("Failed to save company:", err);
    }
  }

  if (!loading && !isAdmin) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl mx-auto flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">Administrator Access Required</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            You are currently logged in as <span className="text-white font-semibold">{user?.fullName || "Cashier"}</span> ({user?.role}). Only Organization Administrators have permission to modify company settings, GST details, and billing profiles.
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
    <div className="space-y-4 max-w-4xl">
      <div className="flex items-center justify-between">
        <Link
          href="/generatebill"
          className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Billing</span>
        </Link>
      </div>

      {saved && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl flex items-center gap-2 font-medium">
          <CheckCircle className="w-4 h-4" />
          <span>Company profile updated successfully!</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5 text-xs">
        <div className="flex items-center gap-2 pb-4 border-b border-slate-800">
          <Building className="w-5 h-5 text-emerald-400" />
          <div>
            <h1 className="text-lg font-bold text-white">Company Profile & GST Configuration</h1>
            <p className="text-[11px] text-slate-400">Manage business identity, GSTIN, and print headers</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Company / Trade Name *</label>
            <input
              required
              type="text"
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">GSTIN / Tax ID</label>
            <input
              type="text"
              value={form.tin}
              onChange={(e) => setForm({ ...form, tin: e.target.value })}
              placeholder="33AAAAA0000A1Z5"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Primary Mobile Phone *</label>
            <input
              required
              type="text"
              value={form.mob1}
              onChange={(e) => setForm({ ...form, mob1: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Secondary Contact</label>
            <input
              type="text"
              value={form.mob2}
              onChange={(e) => setForm({ ...form, mob2: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-slate-400 font-semibold mb-1">Street Address</label>
            <input
              type="text"
              value={form.addr}
              onChange={(e) => setForm({ ...form, addr: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">City</label>
            <input
              type="text"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">PIN / Postal Code</label>
            <input
              type="text"
              value={form.pin}
              onChange={(e) => setForm({ ...form, pin: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">UPI VPA (for Instant QR Payment)</label>
            <input
              type="text"
              value={form.upiVpa}
              onChange={(e) => setForm({ ...form, upiVpa: e.target.value })}
              placeholder="metro@okaxis"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">State & State Code</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                placeholder="Tamil Nadu"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
              <input
                type="text"
                value={form.stateCode}
                onChange={(e) => setForm({ ...form, stateCode: e.target.value })}
                placeholder="33"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Profile</span>
          </button>
        </div>
      </form>
    </div>
  );
}
