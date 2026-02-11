"use client";
import { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

export default function AdminHome() {
  const [ok, setOk] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch(`${API_BASE}/api/me`, { credentials: "include" });
      if (!res.ok) window.location.href = "/products";
      else setOk(true);
    })();
  }, []);

  if (!ok) return <div className="p-10">Checking admin session…</div>;

  return <div className="p-10">Admin Dashboard</div>;
}
