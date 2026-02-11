"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

type User = { userId: string; name: string; email: string };

type AuthCtx = {
  user: User | null;
  loading: boolean;
  refreshMe: () => Promise<void>;
  logout: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function refreshMe() {
    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, { credentials: "include" });
      if (!res.ok) {
        setUser(null);
        return;
      }
      const data = await res.json();
      setUser(data?.user || null);
    } catch {
      setUser(null);
    }
  }

  async function logout() {
    await fetch(`${API_BASE}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    }).catch(() => {});
    setUser(null);
  }

  useEffect(() => {
    (async () => {
      setLoading(true);
      await refreshMe();
      setLoading(false);
    })();
  }, []);

  // ✅ navbar sync without refresh (custom event)
  useEffect(() => {
    const handler = () => refreshMe();
    window.addEventListener("korezi-auth-changed", handler);
    return () => window.removeEventListener("korezi-auth-changed", handler);
  }, []);

  return (
    <Ctx.Provider value={{ user, loading, refreshMe, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

// call this after login/signup to sync navbar instantly
export function emitAuthChanged() {
  window.dispatchEvent(new Event("korezi-auth-changed"));
}
