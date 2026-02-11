"use client";

import Link from "next/link";
import { useState } from "react";
import { emitAuthChanged } from "@/app/context/AuthContext";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    if (!email.trim() || !password) {
      alert("Email and password are required.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // ✅ important for cookie
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Login failed");

      // ✅ Update navbar instantly (no refresh needed)
      emitAuthChanged();

      // ✅ Redirect home
      window.location.href = "/";
    } catch (err: any) {
      alert(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-6 py-16">
      <div className=" rounded-2xl p-6">
        <h1 className="text-2xl font-semibold">Login</h1>
        <p className="text-sm text-gray-500 mt-1">Welcome back to Korezi.</p>

        <form onSubmit={submit} className="mt-6 grid gap-4">
          <input
            className=" rounded-xl px-3 py-3 bg-gray-200"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            className=" rounded-xl px-3 py-3 bg-gray-200"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            disabled={loading}
            className="rounded-xl transition bg-[#BE171F]  cursor-pointer hover:bg-black text-white py-2.5 disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="text-sm text-gray-600 mt-4">
          Don’t have an account?{" "}
          <Link className="underline" href="/signup">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
