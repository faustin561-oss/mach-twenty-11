# Changelog

Chronological record of every increment. Written as an honest log, not
marketing copy — including corrections when something I said turned out
to be wrong later, which is why a couple of entries reference "see
correction below."

## Priority 1–8 pass (this delivery)

- **Stripe business model corrected**: single $19.99/mo carrier
  membership (was 3 tiers: $49/$149/$499), $10 urgent-quote fee (new),
  5% platform fee (was 10%). All computed server-side, never trusting
  client-submitted totals.
- **Webhook idempotency**: `WebhookEvent` table records every processed
  Stripe event ID before acting on it; duplicate deliveries are no-ops.
- **New models**: `Subscription`, `Invoice`, `WebhookEvent`,
  `Transaction`, `Review`, `AuditLog`, `EmailVerificationToken`,
  `PasswordResetToken`.
- **Billing UI rebuilt**: `/carrier/membership` (single-plan design,
  status, cancel/reactivate), new `/billing` dashboard (invoices,
  transactions, shipment payment history), shipment detail page now
  shows a real payment/fee breakdown card.
- **Subscription lifecycle routes added**: cancel (graceful,
  end-of-period) and reactivate (undo a pending cancellation).
- **Admin revenue reporting added**: `/api/admin/revenue` +
  Admin panel Revenue tab — total platform fee revenue, GMV, this
  month, released/escrowed/refunded breakdowns, all summed from the
  real `Payment` ledger.
- **Bid withdraw added**: `DELETE /api/bids/:shipmentId` — edit already
  worked (bid submission was always an upsert); withdraw was the actual
  gap.
- **Live Freight Market added** to the Load Board (top section, NASDAQ-
  style dots from real shipment data; standard searchable listing kept
  below, now with origin/destination/weight-range/urgent-only filters
  added). Polled every 8s, not pushed — no websocket infrastructure in
  this project. Deliberately never shows bid dollar amounts for shipments
  still sealed (`OPEN_FOR_BIDS`) — see the comment in
  `src/app/api/loadboard/live/route.ts` for why.
- **`.env.example` and `DEPLOYMENT.md` corrected**: removed stale 3-tier
  Stripe price vars, replaced with `STRIPE_CARRIER_PRICE_ID`; production
  deploy path now documents `prisma migrate deploy` as the actual
  recommended command, with the old `db push` path kept but relabeled as
  a fallback, per explicit instruction not to use `db push
  --accept-data-loss` in production.
- Two self-caught mistakes this pass, both fixed before delivery, not
  after: a stray unreachable `POST` handler left in the new payment
  route (removed), and a shipment-reference computation that used the
  wrong date field client-side (moved server-side to use the correct one).

## Earlier increments (see README.md's fuller per-increment history)

- **11**: Restored native Postgres enums/arrays/`Json` in
  `schema.production.prisma` at explicit request, reversing increment
  10's deliberately-simplified choice.
- **10**: Production deployment prep — separate Postgres schema file,
  `NODE_ENV`-aware `db-sync.js`, first `DEPLOYMENT.md`.
- **9.2**: Full manual SQLite conversion (enums, `Json`) after research-
  based assumptions in increment 9 were disproven by real `P1012` errors.
- **9**: Removed the PostgreSQL requirement for local testing — SQLite by
  default. (Partially corrected in 9.2, see above.)
- **8.2**: Removed the PWA service worker entirely — it was causing
  "the homepage keeps loading" by conflicting with the dev server.
- **8.1**: Zero-config local dev — a fixed, insecure, dev-only fallback
  `AUTH_SECRET` in code so `npm run dev` never requires manual setup.
- **8**: Fixed `MissingSecret`, added `scripts/check-env.js`, fixed the
  Turbopack workspace-root warning.
- **7**: Full Next.js 16 compatibility audit — the `headers.get is not a
  function` and unawaited `params`/`searchParams` root causes, DB-safety
  wrapping on every Prisma call, shared `AppShell` across all internal
  pages, registration/profile/messages/notifications pages added.
- **6**: Heuristic rate suggestions, carrier recommendations, PWA
  manifest/icons (the service worker part of this was later removed —
  see 8.2).
- **5**: Messaging, disputes, notifications, first admin panel.
- **4**: Google Maps integration, saved searches, Stripe Connect payouts.
- **3**: Carrier dashboard, first membership billing pass, fleet
  management.
- **2**: Shipment creation wizard, sealed-bid reveal, award/escrow.
- **1**: Initial scaffold — Next.js, Auth.js, Prisma, Docker.
- **Homepage redesign**: a separate, design-only pass — logo, custom
  icon system, route-line motif — kept isolated from the numbered
  increments since it was a distinct request.

## What has never been verified by actually running it

Every entry above was checked with the tools available in this
environment (a real TypeScript compiler run against stubbed third-party
types, brace/paren balance, isolated logic tests) — never with `npm
install`, a real database connection, or a browser. See `TESTING.md` for
exactly what still needs to be run for real, and by whom.
