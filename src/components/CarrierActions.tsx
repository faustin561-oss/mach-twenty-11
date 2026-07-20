"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ConnectPayoutButton({ connected }: { connected: boolean }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function connect() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/stripe/connect/onboard", { method: "POST" });
    const body = await res.json();
    setLoading(false);
    if (!res.ok) { setError(body.error || "Could not start onboarding."); return; }
    window.location.href = body.url;
  }

  if (connected) {
    return <span className="text-xs font-medium text-green-700">Payout account connected</span>;
  }

  return (
    <div>
      <button onClick={connect} disabled={loading} className="rounded-md border border-m20amber px-3 py-1.5 text-xs font-medium text-m20navy disabled:opacity-40">
        {loading ? "Redirecting..." : "Connect payout account"}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function DeliverButton({ shipmentId }: { shipmentId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  async function markDelivered() {
    setLoading(true);
    setNote(null);
    const res = await fetch(`/api/shipments/${shipmentId}/deliver`, { method: "POST" });
    const body = await res.json();
    setLoading(false);
    if (!res.ok && res.status !== 202 && res.status !== 207) {
      setNote(body.error || "Could not mark delivered.");
      return;
    }
    setNote(body.warning || body.payoutError || "Marked delivered.");
    router.refresh();
  }

  return (
    <div>
      <button onClick={markDelivered} disabled={loading} className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40">
        {loading ? "Confirming..." : "Mark Delivered"}
      </button>
      {note && <p className="mt-1 text-xs text-black/50">{note}</p>}
    </div>
  );
}
