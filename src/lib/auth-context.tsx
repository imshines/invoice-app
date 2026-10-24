"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: "SUPERADMIN" | "ORG_ADMIN" | "BILLING_CASHIER" | "INVENTORY_MANAGER" | "ACCOUNTANT";
}

interface AuthContextType {
  user: AuthUser | null;
  organization: any | null;
  loading: boolean;
  isAdmin: boolean;
  isCashier: boolean;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  organization: null,
  loading: true,
  isAdmin: false,
  isCashier: false,
  logout: async () => {},
  refreshAuth: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [organization, setOrganization] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  async function checkAuth() {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
          setOrganization(data.organization);
        } else {
          setUser(null);
          setOrganization(data.organization || null);
        }
      } else {
        setUser(null);
      }
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    checkAuth();
  }, []);

  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  }

  const isAdmin = user?.role === "ORG_ADMIN" || user?.role === "SUPERADMIN";
  const isCashier = user?.role === "BILLING_CASHIER";

  return (
    <AuthContext.Provider
      value={{
        user,
        organization,
        loading,
        isAdmin,
        isCashier,
        logout,
        refreshAuth: checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
