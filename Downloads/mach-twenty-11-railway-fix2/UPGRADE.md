# Upgrade Guide

## Moving from local SQLite to production Postgres

This project deliberately maintains two schema files rather than one:

- `prisma/schema.prisma` — SQLite, used by plain `npm run dev`. Zero
  external setup; a single file at `prisma/dev.db`.
- `prisma/schema.production.prisma` — Postgres, with real native enums,
  arrays, and `Json` (not the SQLite-era string workarounds). Used by
  every `*:production` npm script.

Prisma does not support a dynamic/env-driven datasource `provider` —
only the connection `url` can vary by environment — which is the actual
reason two files exist, not an oversight.

**To move to Postgres for real:**

1. Provision a real Postgres instance (Railway's Postgres plugin is the
   path documented in `DEPLOYMENT.md`; any reachable Postgres works).
2. Generate the real migration history — this needs a live connection
   and cannot be fabricated:
   ```bash
   DATABASE_URL="<real connection string>" npx prisma migrate dev --name init --schema=prisma/schema.production.prisma
   ```
3. From then on, every deploy runs:
   ```bash
   npx prisma migrate deploy --schema=prisma/schema.production.prisma
   ```
   Never `prisma db push --accept-data-loss` in production — that
   command has no migration history and can silently drop columns.

## If you add or change a model

Both schema files need the change, or dev and production will silently
diverge. The model bodies were verified byte-identical via `diff` when
this split was created (see `README.md`, increment 10) — that
verification is a one-time snapshot, not something enforced going
forward. There's no automated check that keeps them in sync; treat
`schema.production.prisma`'s header comment as the reminder it is, and
consider adding a CI check that diffs the two model bodies if this
project grows a real CI pipeline.

If the new field is a `String[]`, `Json`, or an enum: remember the
dev schema stores these as JSON-encoded strings (see `src/lib/json-array.ts`,
`src/lib/json-filters.ts`), while production uses native types. The
helper functions in those two files check the actual runtime shape of
the value rather than assuming one, specifically so the same call sites
work against either schema — follow that pattern for any new field of
these types rather than assuming one shape.

## Upgrading `next-auth`

This project pins `next-auth` to a specific beta
(`^5.0.0-beta.31` at last check) because that was the first version whose
published peer-dependencies explicitly listed Next.js 16 support — an
earlier beta caused the `headers.get is not a function` crash documented
at length in `README.md`. If you bump this version, re-verify auth
end-to-end (login, register, protected-route redirect) before trusting
it — the exact failure mode this project already hit once.

## Rate limiting is in-memory, single-process

`src/lib/rate-limit.ts` is disclosed there as a real limitation: it
resets on every restart and doesn't share state across multiple server
instances. If this deploys behind a load balancer with more than one
instance, rate limiting is effectively per-instance, not global — an
attacker spread across instances isn't actually rate-limited correctly.
Fixing this properly means backing it with Redis (`ioredis` is already a
dependency, unused for this) or a database table. Not done in this pass;
flagged here so it isn't mistaken for solved.
