"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "CUSTOMER" as "CUSTOMER" | "CARRIER" });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const body = await res.json();
      setSubmitting(false);
      setError(typeof body.error === "string" ? body.error : "Could not create account.");
      return;
    }

    const signInRes = await signIn("credentials", { email: form.email, password: form.password, redirect: false });
    setSubmitting(false);
    if (signInRes?.error) {
      router.push("/login");
      return;
    }
    router.push(form.role === "CARRIER" ? "/carrier/dashboard" : "/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--m20-fog)] px-6 py-12">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-lg border border-black/10 bg-white p-8 shadow-sm">
        <Link href="/" className="mb-4 flex items-center gap-2">
          <Image src="/mach-logo.png" alt="Mach Twenty 11" width={28} height={28} className="h-7 w-7 object-contain" />
          <span className="text-sm font-semibold text-m20navy">Mach Twenty 11</span>
        </Link>
        <h1 className="text-xl font-semibold">Create an account</h1>

        <div className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-black/60">I am a...</label>
            <div className="flex rounded-md border border-black/15 text-sm">
              <button type="button" onClick={() => setForm((f) => ({ ...f, role: "CUSTOMER" }))} className={`flex-1 py-2 ${form.role === "CUSTOMER" ? "bg-m20navy text-white" : ""}`}>Shipper</button>
              <button type="button" onClick={() => setForm((f) => ({ ...f, role: "CARRIER" }))} className={`flex-1 py-2 ${form.role === "CARRIER" ? "bg-m20navy text-white" : ""}`}>Carrier</button>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-black/60">Full name / Company</label>
            <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="w-full rounded-md border border-black/15 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-black/60">Email</label>
            <input type="email" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="w-full rounded-md border border-black/15 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-black/60">Password</label>
            <input type="password" required minLength={8} value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} className="w-full rounded-md border border-black/15 px-3 py-2 text-sm" />
            <p className="mt-1 text-xs text-black/40">At least 8 characters.</p>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={submitting} className="w-full rounded-md bg-m20navy px-4 py-2 text-sm font-medium text-white disabled:opacity-40">
            {submitting ? "Creating account..." : "Create Account"}
          </button>
        </div>

        <p className="mt-4 text-center text-xs text-black/50">
          Already have an account? <Link href="/login" className="font-medium text-m20navy underline">Sign in</Link>
        </p>
      </form>
    </main>
  );
}
