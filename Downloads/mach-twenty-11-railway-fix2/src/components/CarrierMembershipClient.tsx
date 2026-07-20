"use client";

import { useEffect, useState } from "react";

type Subscription = {
  active: boolean;
  tier: string;
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  hasStripeAccount: boolean;
} | null;

const MEMBERSHIP_BENEFITS = [
  "Bid on every shipment mode — LTL, FTL, ocean, air, rail, and more",
  "Sealed-bid marketplace access, no per-bid fees",
  "Fleet and driver management tools",
  "Rate benchmarks and carrier recommendations",
];

// Membership billing — Priority 2 redesign. One plan, $19.99/mo (see
// src/lib/stripe.ts, the single source of truth for that figure — this
// component never hardcodes it independently). Requires
// STRIPE_SECRET_KEY + STRIPE_CARRIER_PRICE_ID to actually create a
// Checkout session; without those the button surfaces the server's
// error rather than pretending to succeed.
export default function CarrierMembershipClient() {
  const [sub, setSub] = useState<Subscription>(null);
  const [pricing, setPricing] = useState<{ membershipMonthlyUsd: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<"subscribe" | "cancel" | "reactivate" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/billing");
    if (res.ok) {
      const body = await res.json();
      setSub(body.subscription);
      setPricing(body.pricing);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function subscribe() {
    setActionLoading("subscribe");
    setError(null);
    const res = await fetch("/api/stripe/checkout", { method: "POST" });
    const body = await res.json();
    setActionLoading(null);
    if (!res.ok) { setError(body.error || "Could not start checkout."); return; }
    window.location.href = body.url;
  }

  async function cancel() {
    if (!window.confirm("Cancel your membership? You'll keep bidding access until the end of your current billing period.")) return;
    setActionLoading("cancel");
    setError(null);
    const res = await fetch("/api/stripe/subscription/cancel", { method: "POST" });
    const body = await res.json();
    setActionLoading(null);
    if (!res.ok) { setError(body.error || "Could not cancel."); return; }
    load();
  }

  async function reactivate() {
    setActionLoading("reactivate");
    setError(null);
    const res = await fetch("/api/stripe/subscription/reactivate", { method: "POST" });
    const body = await res.json();
    setActionLoading(null);
    if (!res.ok) { setError(body.error || "Could not reactivate."); return; }
    load();
  }

  if (loading) return <p className="text-sm text-black/40">Loading membership status...</p>;

  const monthlyPrice = pricing?.membershipMonthlyUsd ?? 19.99;
  const isActive = sub?.status === "ACTIVE";
  const isPastDue = sub?.status === "PAST_DUE";
  const isCanceled = sub?.status === "CANCELED" || sub?.status === "UNPAID" || sub?.status === "INCOMPLETE_EXPIRED";
  const noSubscriptionYet = !sub || sub.status === "none" || sub.status === "NONE";

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-2xl border border-black/10 bg-white shadow-sm">
        <div className="border-b border-black/5 bg-m20navy px-8 py-6 text-white">
          <p className="text-xs font-medium uppercase tracking-wide text-white/60">Mach Twenty 11 Carrier Membership</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-4xl font-semibold">${monthlyPrice.toFixed(2)}</span>
            <span className="text-sm text-white/60">/ month, billed monthly</span>
          </div>
        </div>

        <div className="px-8 py-6">
          {isPastDue && (
            <div className="mb-5 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
              <strong>Payment failed.</strong> Your last billing attempt didn't go through. Update your payment method in Stripe's billing portal or your membership will lapse and bidding will be disabled.
            </div>
          )}

          {!noSubscriptionYet && (
            <div className="mb-5 grid grid-cols-2 gap-4 rounded-lg bg-black/[0.03] p-4 text-sm">
              <div>
                <div className="text-xs uppercase tracking-wide text-black/40">Status</div>
                <div className={`mt-1 font-medium ${isActive ? "text-green-700" : isPastDue ? "text-red-700" : "text-black/60"}`}>
                  {sub!.status}{sub!.cancelAtPeriodEnd && isActive ? " (canceling)" : ""}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-black/40">
                  {sub!.cancelAtPeriodEnd ? "Access ends" : "Next billing date"}
                </div>
                <div className="mt-1 font-medium">
                  {sub!.currentPeriodEnd ? new Date(sub!.currentPeriodEnd).toLocaleDateString() : "—"}
                </div>
              </div>
            </div>
          )}

          <p className="text-sm font-medium text-black/70">Membership includes:</p>
          <ul className="mt-2 space-y-1.5 text-sm text-black/60">
            {MEMBERSHIP_BENEFITS.map((b) => (
              <li key={b} className="flex gap-2"><span className="text-m20amber">✓</span>{b}</li>
            ))}
          </ul>

          {error && <p className="mt-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

          <div className="mt-6">
            {noSubscriptionYet && (
              <button onClick={subscribe} disabled={actionLoading === "subscribe"} className="w-full rounded-md bg-m20amber px-4 py-2.5 text-sm font-semibold text-black disabled:opacity-40">
                {actionLoading === "subscribe" ? "Redirecting..." : "Activate Membership"}
              </button>
            )}
            {isActive && !sub!.cancelAtPeriodEnd && (
              <button onClick={cancel} disabled={actionLoading === "cancel"} className="w-full rounded-md border border-red-300 px-4 py-2.5 text-sm font-medium text-red-700 disabled:opacity-40">
                {actionLoading === "cancel" ? "Canceling..." : "Cancel Membership"}
              </button>
            )}
            {isActive && sub!.cancelAtPeriodEnd && (
              <button onClick={reactivate} disabled={actionLoading === "reactivate"} className="w-full rounded-md bg-m20navy px-4 py-2.5 text-sm font-medium text-white disabled:opacity-40">
                {actionLoading === "reactivate" ? "Reactivating..." : "Reactivate Membership"}
              </button>
            )}
            {(isCanceled || isPastDue) && (
              <button onClick={subscribe} disabled={actionLoading === "subscribe"} className="w-full rounded-md bg-m20amber px-4 py-2.5 text-sm font-semibold text-black disabled:opacity-40">
                {actionLoading === "subscribe" ? "Redirecting..." : "Reactivate with New Payment"}
              </button>
            )}
          </div>
        </div>
      </div>

      <p className="mt-4 text-center text-xs text-black/40">
        Payment method is managed securely through Stripe — Mach Twenty 11 never stores your card details.
      </p>
    </div>
  );
}
