"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { emitAuthChanged } from "@/app/context/AuthContext";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const passwordScore = useMemo(() => {
    let score = 0;
    if (password.length >= 6) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    return score;
  }, [password]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim() || !email.trim() || !password) {
      setError("Name, email, and password are required.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Signup failed");

      emitAuthChanged();
      window.location.href = "/";
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Join Korezi"
      title="Create your account"
      text="Save your cart, checkout faster, and keep your skincare orders in one clean place."
      footer={
        <>
          Already have an account?{" "}
          <Link className="font-semibold text-[#BE171F] hover:underline" href="/login">
            Login
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <Field label="Full name">
          <input className="auth-input" placeholder="Your name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>

        <Field label="Email address">
          <input className="auth-input" placeholder="you@example.com" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>

        <Field label="Password">
          <div className="relative">
            <input
              className="auth-input pr-16"
              placeholder="Minimum 6 characters"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
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
          <div className="mt-2 grid grid-cols-3 gap-2">
            {[0, 1, 2].map((item) => (
              <span key={item} className={`h-1.5 rounded-full ${passwordScore > item ? "bg-[#BE171F]" : "bg-gray-200"}`} />
            ))}
          </div>
        </Field>

        <Field label="Confirm password">
          <input
            className="auth-input"
            placeholder="Re-enter password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </Field>

        <button
          disabled={loading}
          className="h-12 w-full rounded-2xl bg-[#BE171F] font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Creating account..." : "Create account"}
        </button>

        <p className="text-xs leading-5 text-gray-500">
          By creating an account, you agree to use Korezi checkout and order features responsibly.
        </p>
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
