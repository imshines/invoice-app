"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle, Building } from "lucide-react";

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
      {/* Back link matching company.php: <a href="generatebill.php"><< back</a> */}
      <div>
        <Link
          href="/generatebill"
          className="text-xs text-blue-600 hover:underline font-semibold flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>back to Generate Bill</span>
        </Link>
      </div>

      {saved && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-md text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          <span>Company profile updated successfully! Logo and brand name refreshed.</span>
        </div>
      )}

      {/* Form Card faithful to company.php layout */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-base text-gray-800">Create / Update Company</h3>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4 text-xs">
            <div className="grid grid-cols-1 gap-4">
              {/* Company */}
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Company</label>
                <input
                  required
                  type="text"
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  placeholder="Company"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* GSTIN Number */}
              <div>
                <label className="block text-gray-700 font-semibold mb-1">GSTIN Number</label>
                <input
                  type="text"
                  value={form.tin}
                  onChange={(e) => setForm({ ...form, tin: e.target.value })}
                  placeholder="GSTIN Number"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 font-mono uppercase focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Mobile 1 & Mobile 2 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">
                    Mobile Number-1 *
                  </label>
                  <input
                    required
                    type="text"
                    value={form.mob1}
                    onChange={(e) => setForm({ ...form, mob1: e.target.value })}
                    placeholder="Number-1"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">
                    Mobile Number-2
                  </label>
                  <input
                    type="text"
                    value={form.mob2}
                    onChange={(e) => setForm({ ...form, mob2: e.target.value })}
                    placeholder="Number-2"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Address *</label>
                <input
                  required
                  type="text"
                  value={form.addr}
                  onChange={(e) => setForm({ ...form, addr: e.target.value })}
                  placeholder="Address"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* City & Postal Code */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">City *</label>
                  <input
                    required
                    type="text"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="City"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Postal Code *</label>
                  <input
                    required
                    type="text"
                    value={form.pin}
                    onChange={(e) => setForm({ ...form, pin: e.target.value })}
                    placeholder="PIN Code"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Dynamic UPI Payment VPA */}
              <div>
                <label className="block text-gray-700 font-semibold mb-1">
                  UPI VPA (For Dynamic Bill Payment QR)
                </label>
                <input
                  type="text"
                  value={form.upiVpa}
                  onChange={(e) => setForm({ ...form, upiVpa: e.target.value })}
                  placeholder="e.g. yourbusiness@upi, shop@okaxis"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-blue-700 font-mono font-semibold focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-right">
            <button
              type="submit"
              className="px-5 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs"
            >
              Save Company
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
