"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const res = await fetch("/api/auth/password-reset/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const body = await res.json().catch(() => ({}));
    setSubmitting(false);
    setSubmitted(true);
    if (body.devResetUrl) setDevResetUrl(body.devResetUrl);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--m20-fog)] px-6">
      <div className="w-full max-w-sm rounded-lg border border-black/10 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold">Reset your password</h1>
        {submitted ? (
          <div className="mt-4 text-sm text-black/70">
            <p>If an account exists for that email, a reset link has been sent.</p>
            {devResetUrl && (
              <p className="mt-3 rounded-md bg-amber-50 p-3 text-xs text-amber-800">
                Dev-only (no email service configured): <a className="underline" href={devResetUrl}>{devResetUrl}</a>
              </p>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-black/60">Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-md border border-black/15 px-3 py-2 text-sm" />
            </div>
            <button type="submit" disabled={submitting} className="w-full rounded-md bg-m20navy px-4 py-2 text-sm font-medium text-white disabled:opacity-40">
              {submitting ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        )}
        <p className="mt-4 text-center text-xs text-black/50">
          <Link href="/login" className="font-medium text-m20navy underline">Back to sign in</Link>
        </p>
      </div>
    </main>
  );
}
