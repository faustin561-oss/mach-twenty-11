"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    if (res?.error) {
      setError("Invalid email or password.");
      return;
    }
    router.push(params.get("callbackUrl") || "/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--m20-fog)] px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-lg border border-black/10 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold">Sign in to Mach Twenty 11</h1>
        <div className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-black/60">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-black/15 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-black/60">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-black/15 px-3 py-2 text-sm"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            className="w-full rounded-md bg-[var(--m20-navy)] px-4 py-2 text-sm font-medium text-white"
          >
            Sign In
          </button>
        </div>
        <p className="mt-4 text-xs text-black/50">
          Demo accounts (after `npm run db:seed`): shipper@demo.mach2011.com /
          carrier@demo.mach2011.com — password: demo1234
        </p>
      </form>
    </main>
  );
}
