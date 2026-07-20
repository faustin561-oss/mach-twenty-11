"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function QuickBidButton({ shipmentId }: { shipmentId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [etaDays, setEtaDays] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);

  async function submit() {
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/bids", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shipmentId, amount: Number(amount), etaDays: Number(etaDays) }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const body = await res.json();
      setError(body.error === "Carrier membership required" || body.error === "Active membership required to bid"
        ? body.error
        : "Could not submit bid.");
      return;
    }
    setOpen(false);
    setAmount("");
    setEtaDays("");
    router.refresh();
  }

  async function withdraw() {
    setWithdrawing(true);
    setError(null);
    setNote(null);
    const res = await fetch(`/api/bids/${shipmentId}`, { method: "DELETE" });
    setWithdrawing(false);
    if (!res.ok) {
      const body = await res.json();
      setNote(body.error === "No bid to withdraw" ? "You don't have a bid on this shipment yet." : body.error || "Could not withdraw.");
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        className="rounded-md border border-m20amber px-3 py-1.5 text-xs font-medium text-m20navy hover:bg-m20amber/10"
      >
        Quick Bid
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={() => setOpen(false)}
        >
          <div className="w-full max-w-sm rounded-lg bg-white p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-semibold">Submit Sealed Bid</h3>
            <p className="mt-1 text-xs text-black/50">
              Your amount stays hidden from other carriers until the shipper's deadline passes.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs text-black/60">Rate ($)</label>
                <input type="number" className="w-full rounded-md border border-black/15 px-3 py-2 text-sm" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-xs text-black/60">ETA (days)</label>
                <input type="number" className="w-full rounded-md border border-black/15 px-3 py-2 text-sm" value={etaDays} onChange={(e) => setEtaDays(e.target.value)} />
              </div>
            </div>
            {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
            {note && <p className="mt-2 text-xs text-black/50">{note}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <button className="rounded-md px-4 py-2 text-sm" onClick={() => setOpen(false)}>Cancel</button>
              <button
                className="rounded-md border border-red-300 px-4 py-2 text-sm text-red-700 disabled:opacity-40"
                disabled={withdrawing}
                onClick={withdraw}
              >
                {withdrawing ? "Withdrawing..." : "Withdraw Bid"}
              </button>
              <button
                className="rounded-md bg-m20navy px-4 py-2 text-sm text-white disabled:opacity-40"
                disabled={!amount || !etaDays || submitting}
                onClick={submit}
              >
                {submitting ? "Submitting..." : "Submit Bid"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
