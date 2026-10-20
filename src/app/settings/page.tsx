"use client";

import { useState, useEffect } from "react";
import { Settings, Save, CheckCircle, Store, QrCode, Printer } from "lucide-react";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    legalName: "Sri Hari Traders Pvt Ltd",
    tradeName: "Sri Hari Traders",
    gstin: "33AAAAA0000A1Z5",
    phonePrimary: "9876543210",
    phoneSecondary: "9843210987",
    upiVpa: "sriharitraders@okaxis",
    addressLine: "123 Bazaar Street, Gandhipuram",
    city: "Coimbatore",
    state: "Tamil Nadu",
    stateCode: "33",
    pinCode: "641012",
    thermalHeader: "SRI HARI TRADERS\n123 Bazaar Street, Coimbatore\nGSTIN: 33AAAAA0000A1Z5\nMob: 9876543210",
    thermalFooter: "Thank you for shopping with Sri Hari Traders!\nGoods once sold cannot be returned without bill.",
  });

  useEffect(() => {
    async function loadOrg() {
      try {
        const res = await fetch("/api/organization/current");
        const data = await res.json();
        if (data && !data.error) {
          setForm({
            legalName: data.legalName || "",
            tradeName: data.tradeName || "",
            gstin: data.gstin || "",
            phonePrimary: data.phonePrimary || "",
            phoneSecondary: data.phoneSecondary || "",
            upiVpa: data.upiVpa || "",
            addressLine: data.addressLine || "",
            city: data.city || "",
            state: data.state || "",
            stateCode: data.stateCode || "33",
            pinCode: data.pinCode || "",
            thermalHeader: data.thermalHeader || "",
            thermalFooter: data.thermalFooter || "",
          });
        }
      } catch (err) {
        console.error("Failed to fetch organization settings:", err);
      } finally {
        setLoading(false);
      }
    }
    loadOrg();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("/api/organization/current", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      console.error("Failed to save settings:", err);
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-emerald-400" />
            <span>Company Profile & System Settings</span>
          </h1>
          <p className="text-xs text-slate-400">
            Configure GSTIN, Dynamic UPI QR merchant VPA, and thermal receipt formats.
          </p>
        </div>

        {saved && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <CheckCircle className="w-4 h-4" />
            <span>Settings Saved!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Business Identity & GST */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Store className="w-4 h-4 text-emerald-400" />
            <span>Business Information (replaces legacy company.php)</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Legal Company Name *</label>
              <input
                required
                type="text"
                value={form.legalName}
                onChange={(e) => setForm({ ...form, legalName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Trade Name / Storefront Brand</label>
              <input
                type="text"
                value={form.tradeName}
                onChange={(e) => setForm({ ...form, tradeName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">GSTIN Number</label>
              <input
                type="text"
                value={form.gstin}
                onChange={(e) => setForm({ ...form, gstin: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 font-mono uppercase"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Primary Phone *</label>
              <input
                required
                type="text"
                value={form.phonePrimary}
                onChange={(e) => setForm({ ...form, phonePrimary: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Secondary Phone</label>
              <input
                type="text"
                value={form.phoneSecondary}
                onChange={(e) => setForm({ ...form, phoneSecondary: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 font-mono"
              />
            </div>
          </div>

          <div className="text-xs">
            <label className="block text-slate-400 mb-1">Registered Address *</label>
            <input
              required
              type="text"
              value={form.addressLine}
              onChange={(e) => setForm({ ...form, addressLine: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">City</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">State</label>
              <input
                type="text"
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">State Code (GST)</label>
              <input
                type="text"
                value={form.stateCode}
                onChange={(e) => setForm({ ...form, stateCode: e.target.value })}
                placeholder="33"
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">PIN Code</label>
              <input
                type="text"
                value={form.pinCode}
                onChange={(e) => setForm({ ...form, pinCode: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Dynamic UPI QR Settings */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <QrCode className="w-4 h-4 text-emerald-400" />
            <span>Dynamic UPI QR (Zero MDR Direct Bank Settlement)</span>
          </h2>
          <div className="text-xs">
            <label className="block text-slate-400 mb-1">
              Merchant UPI VPA (Virtual Payment Address)
            </label>
            <input
              type="text"
              value={form.upiVpa}
              onChange={(e) => setForm({ ...form, upiVpa: e.target.value })}
              placeholder="e.g. merchant@okaxis, shop@upi, business@icici"
              className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 font-mono text-emerald-400 font-bold"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Used to generate dynamic QR codes on customer bills with exact total amount pre-filled.
            </p>
          </div>
        </div>

        {/* Section 3: Thermal Printer Receipt Header & Footer */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>Thermal Receipt Customization (80mm / 58mm)</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Receipt Header Text</label>
              <textarea
                rows={3}
                value={form.thermalHeader}
                onChange={(e) => setForm({ ...form, thermalHeader: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Receipt Footer / Terms Text</label>
              <textarea
                rows={3}
                value={form.thermalFooter}
                onChange={(e) => setForm({ ...form, thermalFooter: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-xl shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
}
