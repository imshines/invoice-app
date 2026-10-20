"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle, Building, Save } from "lucide-react";

export default function CompanyPage() {
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
      }
    } catch (err) {
      console.error("Failed to save company:", err);
    }
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
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          <span>Company profile updated! Navbar logo and print headers refreshed.</span>
        </div>
      )}

      {/* Form Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-2">
          <Building className="w-5 h-5 text-emerald-400" />
          <h2 className="font-bold text-base text-white">Company Profile & Branding</h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4 text-xs">
            <div className="grid grid-cols-1 gap-4">
              {/* Company / Brand Name */}
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Company / Brand Name *</label>
                <input
                  required
                  type="text"
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  placeholder="e.g. Sri Hari Traders"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* GSTIN Number */}
              <div>
                <label className="block text-slate-400 font-semibold mb-1">GSTIN Number</label>
                <input
                  type="text"
                  value={form.tin}
                  onChange={(e) => setForm({ ...form, tin: e.target.value })}
                  placeholder="33AAAAA0000A1Z5"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono uppercase focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Mobile 1 & Mobile 2 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Mobile Number-1 *
                  </label>
                  <input
                    required
                    type="text"
                    value={form.mob1}
                    onChange={(e) => setForm({ ...form, mob1: e.target.value })}
                    placeholder="9876543210"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Mobile Number-2
                  </label>
                  <input
                    type="text"
                    value={form.mob2}
                    onChange={(e) => setForm({ ...form, mob2: e.target.value })}
                    placeholder="Secondary contact"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Address *</label>
                <input
                  required
                  type="text"
                  value={form.addr}
                  onChange={(e) => setForm({ ...form, addr: e.target.value })}
                  placeholder="Street Address, Area"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* City & Postal Code */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">City *</label>
                  <input
                    required
                    type="text"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="City"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Postal Code *</label>
                  <input
                    required
                    type="text"
                    value={form.pin}
                    onChange={(e) => setForm({ ...form, pin: e.target.value })}
                    placeholder="PIN Code"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Dynamic UPI VPA */}
              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  UPI VPA (Payee Address for Dynamic Bill Payment QR)
                </label>
                <input
                  type="text"
                  value={form.upiVpa}
                  onChange={(e) => setForm({ ...form, upiVpa: e.target.value })}
                  placeholder="e.g. merchant@okaxis"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-emerald-400 font-mono font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          <div className="px-6 py-3 bg-slate-950/60 border-t border-slate-800 text-right">
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 active:scale-95 transition-all ml-auto"
            >
              <Save className="w-4 h-4" />
              <span>Save Company Profile</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
