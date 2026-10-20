"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Boxes,
  User,
  FileText,
  Settings,
  Users,
  Building,
  LayoutDashboard,
  LogOut,
  ChevronDown,
  Receipt,
  Zap,
  LogIn,
} from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [companyName, setCompanyName] = useState<string>("Invoice Application");
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    async function initNav() {
      try {
        const [orgRes, authRes] = await Promise.all([
          fetch("/api/organization/current").then((r) => r.json()),
          fetch("/api/auth/me").then((r) => r.json()),
        ]);

        if (orgRes && (orgRes.tradeName || orgRes.legalName)) {
          setCompanyName(orgRes.tradeName || orgRes.legalName);
        }

        if (authRes && authRes.user) {
          setCurrentUser(authRes.user);
        }
      } catch (err) {
        // Fallback
      }
    }
    initNav();
  }, [pathname]);

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setCurrentUser(null);
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  }

  const navLinks = [
    { href: "/generatebill", label: "Generate Bill", icon: Zap, highlight: true },
    { href: "/stock", label: "Stock", icon: Boxes },
    { href: "/customer", label: "Customer", icon: User },
    { href: "/invoices", label: "Invoices", icon: FileText },
  ];

  return (
    <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Dynamic Name */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5 text-white hover:text-emerald-400 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-inner">
                <Receipt className="w-5 h-5" />
              </div>
              <span className="font-black text-lg tracking-tight">
                {companyName}
              </span>
            </Link>

            {/* Main Links */}
            <div className="hidden md:flex items-center gap-1.5">
              {navLinks.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href === "/generatebill" && pathname === "/pos") ||
                  (item.href === "/stock" && pathname === "/products") ||
                  (item.href === "/customer" && pathname === "/customers");

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                        : item.highlight
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20"
                        : "text-slate-300 hover:text-white hover:bg-slate-800"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              {/* Settings Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  onBlur={() => setTimeout(() => setDropdownOpen(false), 200)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    pathname.startsWith("/company") ||
                    pathname.startsWith("/users") ||
                    pathname.startsWith("/settings")
                      ? "bg-slate-800 text-white"
                      : "text-slate-300 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Settings</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {dropdownOpen && (
                  <div className="absolute left-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-1 z-50">
                    <Link
                      href="/company"
                      className="flex items-center gap-2 px-4 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white"
                    >
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      <span>Company Profile</span>
                    </Link>
                    <Link
                      href="/users"
                      className="flex items-center gap-2 px-4 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white"
                    >
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>User Accounts</span>
                    </Link>
                    <div className="border-t border-slate-800 my-1" />
                    <Link
                      href="/"
                      className="flex items-center gap-2 px-4 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white"
                    >
                      <LayoutDashboard className="w-3.5 h-3.5 text-slate-400" />
                      <span>Dashboard Stats</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right User Profile & Auth */}
          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:block text-right">
                  <div className="text-xs font-bold text-white leading-tight">
                    {currentUser.fullName}
                  </div>
                  <div className="text-[10px] font-semibold text-emerald-400 font-mono">
                    {currentUser.role}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 text-slate-300 text-xs font-semibold border border-slate-700/60 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
