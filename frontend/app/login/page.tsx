"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { emitAuthChanged } from "@/app/context/AuthContext";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const next = useMemo(() => {
    if (typeof window === "undefined") return "/";
    const value = new URLSearchParams(window.location.search).get("next");
    return value && value.startsWith("/") ? value : "/";
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Email and password are required.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Login failed");

      emitAuthChanged();
      window.location.href = next;
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Login to Korezi"
      text="Access your cart, checkout faster, and keep track of your skincare orders."
      footer={
        <>
          New here?{" "}
          <Link className="font-semibold text-[#BE171F] hover:underline" href="/signup">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <Field label="Email address">
          <input
            className="auth-input"
            placeholder="you@example.com"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>

        <Field label="Password">
          <div className="relative">
            <input
              className="auth-input pr-16"
              placeholder="Enter password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500 hover:text-black"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </Field>

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-gray-600">
            <input type="checkbox" className="h-4 w-4 accent-[#BE171F]" />
            Remember me
          </label>
          <span className="text-gray-400">Secure login</span>
        </div>

        <button
          disabled={loading}
          className="h-12 w-full rounded-2xl bg-[#BE171F] font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </AuthShell>
  );
}

function AuthShell({
  eyebrow,
  title,
  text,
  footer,
  children,
}: {
  eyebrow: string;
  title: string;
  text: string;
  footer: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-[calc(100vh-73px)] bg-[#F7F8FB] px-4 py-8 sm:px-6 lg:py-12">
      <div className="mx-auto max-w-xl overflow-hidden rounded-[32px] border border-black/5 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.10)]">
        <section className="p-6 sm:p-8 lg:p-10">
          <div className="mx-auto max-w-md">
            <p className="text-sm font-semibold uppercase tracking-wide text-[#BE171F]">{eyebrow}</p>
            <h2 className="mt-2 text-3xl font-semibold text-gray-950">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-gray-500">{text}</p>

            <div className="mt-8">{children}</div>

            <p className="mt-6 text-center text-sm text-gray-600">{footer}</p>
          </div>
        </section>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-gray-800">{label}</span>
      {children}
    </label>
  );
}
