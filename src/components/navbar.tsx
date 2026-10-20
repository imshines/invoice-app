"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Boxes,
  User,
  FileText,
  Settings as SettingsIcon,
  Users,
  Building,
  LayoutDashboard,
  LogOut,
  ChevronDown,
  Receipt,
} from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [companyName, setCompanyName] = useState<string>("Invoice Application");

  useEffect(() => {
    async function fetchOrg() {
      try {
        const res = await fetch("/api/organization/current");
        const data = await res.json();
        if (data && (data.tradeName || data.legalName)) {
          setCompanyName(data.tradeName || data.legalName);
        }
      } catch (err) {
        // Fallback default
      }
    }
    fetchOrg();
  }, [pathname]);

  const navLinks = [
    { href: "/stock", label: "Stock", icon: Boxes },
    { href: "/customer", label: "Customer", icon: User },
    { href: "/generatebill", label: "Generate Bill", icon: FileText, highlight: true },
  ];

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Brand Logo & Name (Dynamically loaded from DB) */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5 text-gray-900 hover:text-blue-600 transition-colors">
              <div className="w-8 h-8 rounded-md bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <Receipt className="w-5 h-5" />
              </div>
              <span className="font-bold text-lg tracking-tight">
                {companyName}
              </span>
            </Link>

            {/* Main Navigation (identical to welcome.php) */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href === "/stock" && pathname === "/products") ||
                  (item.href === "/customer" && pathname === "/customers") ||
                  (item.href === "/generatebill" && pathname === "/pos");

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? "text-blue-600 bg-blue-50 font-semibold"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
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
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    pathname.startsWith("/company") ||
                    pathname.startsWith("/users") ||
                    pathname.startsWith("/settings") ||
                    pathname.startsWith("/invoices")
                      ? "text-blue-600 bg-blue-50 font-semibold"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  <SettingsIcon className="w-4 h-4" />
                  <span>Settings</span>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                </button>

                {dropdownOpen && (
                  <div className="absolute left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
                    <Link
                      href="/users"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                    >
                      <Users className="w-4 h-4" />
                      <span>Users</span>
                    </Link>
                    <Link
                      href="/company"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                    >
                      <Building className="w-4 h-4" />
                      <span>Company</span>
                    </Link>
                    <div className="border-t border-gray-100 my-1" />
                    <Link
                      href="/invoices"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Invoices History</span>
                    </Link>
                    <Link
                      href="/"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      <span>Dashboard</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Action */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs font-medium text-gray-500 hover:text-gray-800"
            >
              Sign In / Active Session
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
