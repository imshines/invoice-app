import type { Metadata } from "next";
import { Suspense } from "react";
import { Navbar } from "@/components/navbar";
import { AuthProvider } from "@/lib/auth-context";
import "./globals.css";

export const metadata: Metadata = {
  title: "Invoice Application — Modern Billing & Inventory ERP",
  description: "High-speed billing, inventory ledger, customer Khata & GST compliance",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-emerald-500 selection:text-white font-sans">
        <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
          <AuthProvider>
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              {children}
            </main>
          </AuthProvider>
        </Suspense>
      </body>
    </html>
  );
}
