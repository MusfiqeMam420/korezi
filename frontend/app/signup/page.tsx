"use client";

import Link from "next/link";
import { useState } from "react";


const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";



export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // ✅ important for cookie
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Signup failed");

      // ✅ auto logged in (cookie set) -> redirect home
      window.location.href = "/";
    } catch (err: any) {
      alert(err.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-6 py-16">
      <div className=" rounded-2xl p-6">
        <h1 className="text-2xl font-semibold">Create account</h1>
        <p className="text-sm text-gray-500 mt-1">Signup to Korezi.</p>

        <form onSubmit={submit} className="mt-6 grid gap-4">
          <input className=" rounded-xl px-3  py-3 bg-gray-200" placeholder="Full name"
            value={name} onChange={(e) => setName(e.target.value)} />

          <input className=" rounded-xl px-3  py-3 bg-gray-200" placeholder="Email"
            value={email} onChange={(e) => setEmail(e.target.value)} />

          <input className=" rounded-xl px-3  py-3 bg-gray-200" placeholder="Password (min 6)"
            type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

          <input className=" rounded-xl px-3  py-3 bg-gray-200" placeholder="Confirm password"
            type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />

          <button disabled={loading} className="rounded-xl transition bg-[#BE171F]  cursor-pointer hover:bg-black text-white py-2.5 disabled:opacity-60">
            {loading ? "Creating..." : "Sign up"}
          </button>
        </form>

        <p className="text-sm text-gray-600 mt-4">
          Already have an account? <Link className="underline" href="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}
