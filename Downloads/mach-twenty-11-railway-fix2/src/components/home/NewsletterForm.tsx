"use client";

import { useState } from "react";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage(null);
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const body = await res.json();
      if (!res.ok) {
        setStatus("error");
        setMessage(body.error || "Could not subscribe.");
        return;
      }
      setStatus("done");
      setMessage(body.status === "already_subscribed" ? "You're already on the list." : "You're on the list.");
      setEmail("");
    } catch {
      setStatus("error");
      setMessage("Network error — try again.");
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          required
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="hp-body w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-hpcyan focus:outline-none"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="hp-body shrink-0 rounded-md bg-hpcyan px-4 py-2 text-sm font-semibold text-hpink disabled:opacity-50"
        >
          {status === "loading" ? "Joining..." : "Join"}
        </button>
      </form>
      {message && (
        <p className={`mt-2 text-xs ${status === "error" ? "text-red-300" : "text-hpcyan"}`}>{message}</p>
      )}
    </div>
  );
}
