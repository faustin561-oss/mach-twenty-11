// Application-level replacement for the 8 Prisma enums this schema used
// to have. SQLite (on the Prisma version this project is pinned to —
// confirmed by a real P1012 validation error, not assumed) doesn't
// support enum types, so every one of these is now a plain `String`
// column in schema.prisma. These union types + value arrays are what
// enforce "only these values are valid" at the TypeScript/application
// layer instead — the same validation, one layer up rather than in the
// database. Every zod schema, seed value, and string literal used
// elsewhere in the app should match one of these arrays exactly.

export const USER_ROLES = [
  "GUEST", "CUSTOMER", "CARRIER", "BROKER", "DISPATCHER",
  "FLEET_MANAGER", "ENTERPRISE", "ADMIN", "SUPER_ADMIN",
] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const SHIPMENT_MODES = [
  "LTL", "FTL", "OCEAN_FCL", "OCEAN_LCL", "AIR", "RAIL", "VEHICLE", "BOAT",
  "HOUSEHOLD_MOVING", "HEAVY_EQUIPMENT", "AGRICULTURE", "CONSTRUCTION",
  "MEDICAL", "COURIER", "SPECIALTY",
] as const;
export type ShipmentMode = (typeof SHIPMENT_MODES)[number];

export const SHIPMENT_STATUSES = [
  "DRAFT", "OPEN_FOR_BIDS", "BIDS_REVEALED", "AWARDED", "IN_TRANSIT",
  "DELIVERED", "CANCELLED", "DISPUTED",
] as const;
export type ShipmentStatus = (typeof SHIPMENT_STATUSES)[number];

export const DOCUMENT_TYPES = [
  "BILL_OF_LADING", "SEA_WAYBILL", "AIR_WAYBILL", "PROOF_OF_PICKUP",
  "PROOF_OF_DELIVERY", "INSURANCE_CERT", "CARRIER_AUTHORITY", "W9",
  "DAMAGE_REPORT", "INVOICE",
] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const PAYMENT_STATUSES = ["PENDING", "ESCROWED", "RELEASED", "REFUNDED", "FAILED"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const VEHICLE_STATUSES = ["ACTIVE", "MAINTENANCE", "OUT_OF_SERVICE"] as const;
export type VehicleStatus = (typeof VEHICLE_STATUSES)[number];

export const DRIVER_STATUSES = ["AVAILABLE", "ON_ROUTE", "OFF_DUTY"] as const;
export type DriverStatus = (typeof DRIVER_STATUSES)[number];

export const DISPUTE_STATUSES = ["OPEN", "RESOLVED_RELEASE", "RESOLVED_REFUND", "REJECTED"] as const;
export type DisputeStatus = (typeof DISPUTE_STATUSES)[number];

// Stripe subscription lifecycle — mirrors Stripe's own subscription
// status values so webhook handling can copy them through directly.
export const SUBSCRIPTION_STATUSES = [
  "ACTIVE", "PAST_DUE", "CANCELED", "UNPAID", "INCOMPLETE",
  "INCOMPLETE_EXPIRED", "TRIALING", "PAUSED",
] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

// A carrier may bid only when their subscription is in this state —
// every other status (past due, canceled, unpaid, incomplete, expired,
// paused) blocks bidding. Single source of truth for that rule; see
// src/lib/membership.ts.
export const BIDDING_ALLOWED_SUBSCRIPTION_STATUS: SubscriptionStatus = "ACTIVE";

export const TRANSACTION_TYPES = ["MEMBERSHIP", "URGENT_FEE", "PLATFORM_FEE"] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const TRANSACTION_STATUSES = ["PENDING", "SUCCEEDED", "FAILED", "REFUNDED"] as const;
export type TransactionStatus = (typeof TRANSACTION_STATUSES)[number];
