"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

function VerifyEmailContent() {
  const sp = useSearchParams();
  const email = sp.get("email") || "";

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Verify failed");

      alert("✅ Email verified! Now you can login.");
      window.location.href = "/login";
    } catch (err: any) {
      alert(err.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    if (!email) return alert("Missing email");
    try {
      const res = await fetch(`${API_BASE}/api/auth/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Resend failed");
      alert("New code sent.");
    } catch (err: any) {
      alert(err.message || "Error");
    }
  }

  return (
    <div className="max-w-md mx-auto px-6 py-16">
      <div className="bg-white border rounded-2xl p-6">
        <h1 className="text-2xl font-semibold">Verify your email</h1>
        <p className="text-sm text-gray-500 mt-1">
          Enter the 6-digit code sent to: <span className="font-medium">{email || "your email"}</span>
        </p>

        <form onSubmit={verify} className="mt-6 grid gap-4">
          <input
            className="border rounded-xl px-3 py-2 tracking-[6px] text-center text-lg"
            placeholder="123456"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            maxLength={6}
          />

          <button
            disabled={loading}
            className="rounded-xl bg-black text-white py-2.5 disabled:opacity-60"
          >
            {loading ? "Verifying..." : "Verify"}
          </button>
        </form>

        <button
          onClick={resend}
          className="mt-4 text-sm underline text-gray-700"
          type="button"
        >
          Resend code
        </button>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto px-6 py-16">Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
