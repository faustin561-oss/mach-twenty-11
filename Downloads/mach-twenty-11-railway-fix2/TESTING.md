# Testing Checklist

**Everything in this document is unchecked by design.** I have not run
`npm install`, connected to a real database, opened a browser, or made a
real Stripe API call at any point in this project — no network access in
my environment. Every box below is something for you to actually click
through; I cannot check any of them off on your behalf, and doing so
would violate the explicit instruction not to claim something works
unless it's actually been tested.

What I *did* verify, every time code changed: a real TypeScript compiler
pass against the project's own source (with third-party packages
stubbed, since they aren't installed here), brace/paren balance across
every file, and isolated logic tests for a few specific decision points
(the auth-secret fallback, the `NODE_ENV`-based schema selection). None
of that substitutes for anything below.

## Core pages
- [ ] Homepage loads, nav works, no console errors
- [ ] `/login` — sign in with a real account
- [ ] `/register` — create a shipper account, then a carrier account
- [ ] `/logout` (sign-out link) — session actually clears
- [ ] Shipper dashboard (`/dashboard`) shows posted shipments
- [ ] Carrier dashboard (`/carrier/dashboard`) shows assigned loads,
      membership status, payout connect status
- [ ] Admin dashboard (`/admin/dashboard`) — Revenue, Disputes, Shipments,
      Users tabs all load

## Shipments
- [ ] Post a load (`/ship/new`) — all fields save correctly
- [ ] Shipment gets a real reference number (`MT11-YYYY-NNNNNN` format,
      visible on the detail page)
- [ ] Edit isn't built (not in original scope — confirm this is expected,
      not a bug, before reporting it as one)
- [ ] Load board search/filters: origin, destination, weight range,
      urgent-only, mode — each actually narrows results
- [ ] Live Freight Market dots appear, hover shows a tooltip, click
      navigates to the shipment
- [ ] Shipment detail page loads bids, messages, dispute button correctly

## Bidding
- [ ] Carrier without active membership is blocked from bidding (correct
      error message, not a silent failure)
- [ ] Carrier with active membership can submit a bid
- [ ] Submitting again while still sealed edits the existing bid (upsert)
- [ ] Withdraw button removes the bid while still sealed
- [ ] After the bid deadline, bids reveal and amounts become visible
- [ ] Shipper can award a bid; awarded carrier gets notified

## Carrier membership (Stripe — needs real or test-mode keys)
- [ ] `/carrier/membership` shows $19.99/mo, not old tier pricing
- [ ] "Activate Membership" redirects to real Stripe Checkout
- [ ] Completing checkout (Stripe test card `4242 4242 4242 4242`)
      returns and shows `ACTIVE` status
- [ ] Cancel → status shows "canceling," access remains until period end
- [ ] Reactivate before period end → cancellation undone
- [ ] Stripe test card `4000 0000 0000 0341` (fails on confirmation) →
      subscription shows `PAST_DUE` / failed-payment warning appears
- [ ] Webhook events actually arrive (use `stripe listen --forward-to
      localhost:3000/api/stripe/webhook` or Railway's real webhook URL)
- [ ] Sending the same webhook event twice does not double-process (check
      the `WebhookEvent` table for one row per real event ID)

## Urgent quotes
- [ ] "$10.00 — Mark Urgent" opens a real Stripe Elements payment form
- [ ] Successful test payment → shipment shows the URGENT badge only
      *after* the webhook confirms (not immediately on form submit)
- [ ] Failed test card → shipment does NOT get marked urgent

## Platform fee
- [ ] After award, `Payment.platformFee` is exactly 5% of the accepted
      bid (check the database directly, don't trust the UI alone the
      first time)
- [ ] Shipment detail page's payment card shows bid + fee + total
      matching that database value
- [ ] Admin Revenue tab's totals match a manual sum of `Payment` rows

## Billing dashboard
- [ ] `/billing` shows invoices, transactions, and shipment payments for
      the logged-in user
- [ ] Invoice/receipt links (if Stripe returns them) actually open

## Auth flows
- [ ] Registration sends a real verification email (needs `RESEND_API_KEY`
      set — without it, confirm the app degrades gracefully rather than
      crashing, and note that verification emails aren't actually sent)
- [ ] Password reset request → real email → reset link works
- [ ] Expired reset token is rejected
- [ ] Rate limiting: rapid repeated login attempts get throttled
      (expect this to reset if the app restarts or runs multiple
      instances — see `UPGRADE.md`'s note on this)

## Messages, notifications, documents
- [ ] Send a message on a shipment; other party sees it and gets notified
- [ ] Notification bell updates; `/notifications` shows full history
- [ ] Existing document generation (BOL/waybill, from earlier increments)
      still works

## Security / access control
- [ ] Logged-out user hitting any `/dashboard`, `/carrier/*`, `/admin/*`,
      `/billing`, `/ship/new` URL directly gets redirected to login, not
      shown a broken page
- [ ] Non-admin hitting `/admin/dashboard` is rejected, not just hidden
      client-side
- [ ] A carrier cannot view another carrier's billing/invoices via a
      guessed shipment ID

## Mobile
- [ ] Homepage, load board, shipment detail, membership/billing pages are
      usable (not just "doesn't overflow") on a real phone-width viewport

## Infrastructure
- [ ] Production build (`npm run build:production`) completes with no
      type errors — this is the single most important item on this whole
      list, since it's the one thing that can't be checked without a real
      generated Prisma Client on both schema shapes (see the risk note
      atop `schema.production.prisma`)
- [ ] App survives a Railway restart with data intact
- [ ] Custom domain resolves, SSL certificate is valid, `www` redirects
      to the bare domain
- [ ] `NEXTAUTH_URL`/`AUTH_URL` match the real production domain (not the
      Railway-provided temporary URL) once the domain is live
