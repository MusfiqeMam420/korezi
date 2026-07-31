"use client";

import { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://api.korezi.com";

export default function AdminHome() {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await fetch(`${API_BASE}/api/admin/me`, { credentials: "include" });
      window.location.href = res.ok ? "/products" : "/login";
      setChecking(false);
    })();
  }, []);

  if (checking) return <div className="p-10">Checking admin session...</div>;

  return null;
}
