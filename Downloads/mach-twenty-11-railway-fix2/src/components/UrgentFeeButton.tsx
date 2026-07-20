"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

// Urgent-quote fee — Priority 2/1. $10 flat fee (src/lib/stripe.ts is the
// only place that amount is defined; this component never repeats it as
// a literal used for anything other than display). Uses real Stripe
// Elements to collect card details — the PaymentIntent is created
// server-side (POST /api/shipments/:id/urgent) with a server-computed
// amount; isUrgent only flips to true once the webhook sees
// payment_intent.succeeded, never from this component's success
// callback alone (that callback only means Stripe accepted the card —
// see src/app/api/stripe/webhook/route.ts for the actual state change).
const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

function UrgentFeeForm({ onSubmitted }: { onSubmitted: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError(null);

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    setSubmitting(false);
    if (confirmError) {
      setError(confirmError.message || "Payment could not be completed.");
      return;
    }
    // Card accepted — the shipment doesn't actually flip to urgent until
    // the webhook confirms it server-side (see comment above). This just
    // tells the parent to stop showing the payment form and start
    // polling/refreshing for that confirmation.
    onSubmitted();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <PaymentElement />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={!stripe || submitting}
        className="w-full rounded-md bg-m20amber px-4 py-2 text-sm font-semibold text-black disabled:opacity-40"
      >
        {submitting ? "Processing..." : "Pay $10.00 — Mark Urgent"}
      </button>
    </form>
  );
}

export default function UrgentFeeButton({ shipmentId }: { shipmentId: string }) {
  const [open, setOpen] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function start() {
    setError(null);
    const res = await fetch(`/api/shipments/${shipmentId}/urgent`, { method: "POST" });
    const body = await res.json();
    if (!res.ok) { setError(body.error || "Could not start payment."); return; }
    setClientSecret(body.clientSecret);
    setOpen(true);
  }

  if (!stripePromise) {
    return <p className="text-xs text-black/40">Urgent quotes unavailable — Stripe isn't configured (NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY).</p>;
  }

  if (submitted) {
    return <p className="text-xs text-green-700">Payment submitted — confirming with Stripe. Refresh in a moment to see the urgent badge.</p>;
  }

  if (!open) {
    return (
      <div>
        <button onClick={start} className="rounded-md border border-m20amber px-3 py-1.5 text-xs font-medium text-m20navy hover:bg-m20amber/10">
          Mark Urgent — $10.00
        </button>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-black/10 bg-white p-4">
      <p className="mb-3 text-sm font-medium">Urgent Quote — $10.00</p>
      {clientSecret && (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <UrgentFeeForm onSubmitted={() => setSubmitted(true)} />
        </Elements>
      )}
    </div>
  );
}
