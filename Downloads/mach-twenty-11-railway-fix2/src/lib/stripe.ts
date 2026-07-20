import Stripe from "stripe";

// Single Stripe client, reused across API routes. Throws at call time (not
// import time) if STRIPE_SECRET_KEY is missing, so pages that don't touch
// billing still render without it configured.
export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key, { apiVersion: "2024-06-20" });
}

// ============================================================================
// Official Mach Twenty 11 pricing — single source of truth. Every dollar
// figure anywhere else in the app (checkout copy, billing UI, receipts)
// should read from here, not repeat a literal.
// ============================================================================

// Carrier membership: one tier, $19.99/mo, mandatory before bidding.
// Real Stripe Price ID comes from an env var (created once in the Stripe
// dashboard) — never hardcode a price ID, since test/live mode use
// different ones.
export const CARRIER_MEMBERSHIP = {
  label: "Carrier Membership",
  priceEnvVar: "STRIPE_CARRIER_PRICE_ID",
  monthlyUsd: 19.99,
} as const;

// Urgent-quote fee: flat $10, one-time, per shipment. Does not activate
// isUrgent until Stripe confirms the PaymentIntent succeeded (webhook),
// never on the client's say-so.
export const URGENT_QUOTE_FEE_USD = 10;

// Platform transaction fee: 5% of the accepted bid, computed server-side
// only — see src/app/api/shipments/[id]/award/route.ts. Never accept a
// fee/total from the request body.
export const PLATFORM_FEE_RATE = 0.05;

// Subscription statuses that permit bidding — every other Stripe status
// (past_due, canceled, unpaid, incomplete, incomplete_expired, paused)
// blocks it. Mirrors src/lib/enums.ts's BIDDING_ALLOWED_SUBSCRIPTION_STATUS.
export const BIDDING_ALLOWED_STRIPE_STATUSES = ["active"] as const;
