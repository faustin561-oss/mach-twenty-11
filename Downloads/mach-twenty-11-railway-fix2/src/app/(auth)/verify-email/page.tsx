"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function VerifyEmailPage() {
  const params = useSearchParams();
  const [status, setStatus] = useState<"checking" | "success" | "error">("checking");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = params.get("token");
    if (!token) {
      setStatus("error");
      setMessage("No verification token provided.");
      return;
    }
    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const body = await res.json();
        if (res.ok) {
          setStatus("success");
        } else {
          setStatus("error");
          setMessage(body.error || "Could not verify email.");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Network error — try again.");
      });
  }, [params]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--m20-fog)] px-6">
      <div className="w-full max-w-sm rounded-lg border border-black/10 bg-white p-8 text-center shadow-sm">
        {status === "checking" && <p className="text-sm text-black/60">Verifying your email...</p>}
        {status === "success" && (
          <>
            <h1 className="text-lg font-semibold text-green-700">Email verified</h1>
            <p className="mt-2 text-sm text-black/60">Your email address has been confirmed.</p>
            <Link href="/login" className="mt-4 inline-block rounded-md bg-m20navy px-4 py-2 text-sm font-medium text-white">Sign in</Link>
          </>
        )}
        {status === "error" && (
          <>
            <h1 className="text-lg font-semibold text-red-700">Verification failed</h1>
            <p className="mt-2 text-sm text-black/60">{message}</p>
            <Link href="/login" className="mt-4 inline-block rounded-md border border-black/15 px-4 py-2 text-sm">Back to sign in</Link>
          </>
        )}
      </div>
    </main>
  );
}
