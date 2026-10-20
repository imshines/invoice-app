"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Lock, Mail, ArrowRight, ShieldCheck, UserCheck, AlertCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshAuth } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const redirectTarget = searchParams.get("redirect") || "/generatebill";

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      await refreshAuth();
      router.push(redirectTarget);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  }

  function setDemoAccount(userEmail: string, userPass: string) {
    setEmail(userEmail);
    setPassword(userPass);
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl mx-auto flex items-center justify-center shadow-inner">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Sign In to Invoice Application
          </h1>
          <p className="text-xs text-slate-400">
            Enter your credentials to access stock, billing, and customer Khata.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Email Address</label>
            <div className="relative">
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@srihari.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Password</label>
            <div className="relative">
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-xl font-bold text-sm text-slate-950 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all ${
              loading
                ? "bg-emerald-600/50 cursor-not-allowed"
                : "bg-emerald-500 hover:bg-emerald-400 active:scale-95"
            }`}
          >
            <span>{loading ? "Signing in..." : "Sign In to ERP"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* 1-Click Demo Accounts */}
        <div className="pt-4 border-t border-slate-800/80 space-y-2">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-center">
            Quick 1-Click Demo Credentials
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setDemoAccount("admin@srihari.com", "admin123")}
              className="p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-left transition-colors"
            >
              <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin User</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">admin@srihari.com</div>
              <div className="text-[9px] text-slate-500 font-mono">Full Access</div>
            </button>
            <button
              type="button"
              onClick={() => setDemoAccount("cashier@srihari.com", "admin123")}
              className="p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-left transition-colors"
            >
              <div className="flex items-center gap-1.5 text-blue-400 text-xs font-bold">
                <UserCheck className="w-3.5 h-3.5" />
                <span>Cashier Staff</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">cashier@srihari.com</div>
              <div className="text-[9px] text-slate-500 font-mono">Billing Only</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[80vh] flex items-center justify-center text-slate-500 text-xs">Loading login...</div>}>
      <LoginForm />
    </Suspense>
  );
}
