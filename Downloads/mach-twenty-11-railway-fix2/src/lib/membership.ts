import { BIDDING_ALLOWED_SUBSCRIPTION_STATUS } from "./enums";

// Single source of truth for "can this carrier bid right now?" — used by
// both the bids API route (server-side enforcement, the one that
// actually matters) and the UI (to show/hide the bid form, purely
// cosmetic). CarrierProfile.membershipActive is a denormalized cache
// kept in sync by the Stripe webhook handler; this function is the one
// place that cache gets read for the bidding decision, so if the gating
// rule ever needs to change, it changes here once.
export function canCarrierBid(carrierProfile: { membershipActive: boolean } | null | undefined): boolean {
  if (!carrierProfile) return false;
  return carrierProfile.membershipActive === true;
}

export { BIDDING_ALLOWED_SUBSCRIPTION_STATUS };
