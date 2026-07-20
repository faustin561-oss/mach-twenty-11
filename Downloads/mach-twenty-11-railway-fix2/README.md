# Mach Twenty 11

**Supply. Demand. Execute.**

A multimodal freight marketplace: shippers post loads (LTL, FTL, ocean, air,
rail, vehicles, household moving, heavy equipment, and more), carriers bid,
sealed bids reveal at deadline, and the platform manages documents and
payments end to end.

## Status: Priority 1–8 pass — Stripe corrections, billing UI, live market, docs

Full details in `CHANGELOG.md`. Summary: corrected the Stripe pricing
model to match spec exactly ($19.99/mo single tier, $10 urgent fee, 5%
platform fee — was $49/$149/$499 tiers and 10% before this pass, found
during audit rather than assumed correct), rebuilt the membership/billing
UI to match, added admin revenue reporting, added bid withdraw, built the
Live Freight Market (Priority 3's NASDAQ-style top section) with real
polled data that deliberately never leaks sealed bid amounts, and added
the three remaining required docs (`UPGRADE.md`, `TESTING.md`,
`CHANGELOG.md` — `DEPLOYMENT.md` already existed and was corrected in
this pass too). See `CHANGELOG.md` for the itemized list and `TESTING.md`
for exactly what still needs a real human running a real browser against
a real deployment — none of it has been.

## Status: Increment 11 — restored native Postgres enums/arrays/Json in production schema

At my suggestion, increment 10 kept `prisma/schema.production.prisma`
structurally identical to the SQLite dev schema (String fields standing
in for enums/arrays/Json everywhere), to minimize risk since I can't test
either schema against a real database. Explicitly asked to revert that
and restore real Postgres native types instead, since that's what's
actually needed to make the production database live with proper
DB-level enforcement. Done — with the one piece that couldn't just be a
type swap fixed properly rather than glossed over.

- **8 real Prisma enums restored** in `schema.production.prisma`
  (`UserRole`, `ShipmentMode`, `ShipmentStatus`, `DocumentType`,
  `PaymentStatus`, `VehicleStatus`, `DriverStatus`, `DisputeStatus`). This
  part is genuinely zero-risk: Prisma's classic client always represents
  enum values as plain JS strings regardless of whether the field is
  declared `enum` or `String` in the schema — no application code needed
  to change for this half of the request.
- **Native `String[]` and `Json` restored** for `CarrierProfile.
  equipmentTypes`/`operatingAreas`, `Shipment.photos`, and
  `SavedSearch.filters`. This half is *not* risk-free: it means the same
  application code now runs against two schemas whose generated Prisma
  Client hands back structurally different types for these fields (a
  real array vs. a JSON-encoded string). Fixed by making
  `src/lib/json-array.ts` and `src/lib/json-filters.ts` check the actual
  runtime shape of the value before deciding whether to parse it, rather
  than assuming one shape — so the same ~5 call sites work correctly
  against either schema without scattering environment checks through
  the app. Also fixed the same issue in `prisma/seed.ts`, which had
  hardcoded `JSON.stringify(...)` for the array fields — would have
  written malformed data (a JSON string inside a single array element)
  if run against the production schema's native arrays.
- **Disclosed, not hidden: this project's `tsconfig.json` uses `"strict":
  true`, and one codebase type-checking cleanly against two differently-
  shaped generated Prisma Clients isn't a pattern Prisma is designed
  around.** My verification is a stubbed TypeScript check that treats
  `@prisma/client` loosely — it cannot catch a real strict-mode mismatch
  here, and I added `as any` casts at the ~4 write call sites specifically
  because I can't verify the exact generated types without a live
  database on either side. If `next build` (via `generate:production`)
  reports type errors, this is the first place to look.
- **What I still cannot do**: generate verified Prisma migration files.
  `prisma migrate dev` needs a live database connection to diff against
  and produce real migration SQL — I have neither, and have not
  fabricated migration files pretending otherwise. `DEPLOYMENT.md` and
  the note atop `schema.production.prisma` both say exactly what command
  to run once, by hand, against a real reachable Postgres instance to
  generate that history for real (`prisma migrate dev --name init
  --schema=prisma/schema.production.prisma`), after which `prisma migrate
  deploy` (what production should actually use, per your spec) has
  something real to apply.

## Increment 10 — production deployment prep

You asked to get this live at mach2011.com. I can't deploy it myself —
no network access to run deploy commands, touch DNS, or configure a
hosting dashboard. What I built instead is the missing piece that makes
deployment *possible* without hitting a new class of bug, plus a concrete
step-by-step guide for you to follow.

### The gap this closes

The schema is hardcoded to SQLite (increment 9/9.2, for zero-config local
testing). Deploying as-is to most real hosting (serverless platforms
especially — Vercel, most PaaS function runtimes) would have looked like
it worked, then silently lost all data, since those platforms have
ephemeral or read-only filesystems and SQLite is one file on disk. Prisma
doesn't support a dynamic/env-driven datasource `provider` — only the
connection `url` can vary by environment — so this needed an actual
second schema file, not a config tweak.

- **`prisma/schema.production.prisma`** (new): Postgres variant. Verified
  byte-identical model definitions against `prisma/schema.prisma` via
  `diff` — the *only* intended difference is the `provider` line and the
  header comment. Keeping these in sync is now a manual discipline (noted
  in both files); a future improvement would be generating one from the
  other, not done here.
- **`scripts/db-sync.js`** (new): picks the right schema automatically
  based on `NODE_ENV` — production gets Postgres, everything else gets
  SQLite. This makes even the *default* `npm run build`/`npm install`
  do the right thing if a hosting platform's build command isn't
  explicitly customized (an easy step to forget), rather than silently
  trying to push the SQLite schema against a Postgres connection string.
  Verified the environment-selection logic in isolation against all
  realistic `NODE_ENV` values (development/production/undefined/test) —
  the same pattern used earlier for the auth-secret fallback logic.
- New explicit scripts for the deliberate path: `generate:production`,
  `db:push:production`, `db:migrate:production`, `build:production`.
- **`DEPLOYMENT.md`** (new): a concrete Railway walkthrough — chosen as a
  reasonable default since you hadn't picked a platform, not because
  it's the only option. Covers repo setup, Postgres provisioning,
  required environment variables, the first-deploy table-creation step,
  pointing `mach2011.com`'s DNS at it, and a verification checklist. Also
  flags, explicitly, that `/privacy` and `/terms` are still labeled
  drafts pending real legal review — worth resolving independent of
  whether the code works, before real money or user data flows through
  a marketplace that holds escrow.

### What I did and didn't verify

**Correction, added when writing increment 11: the claim in the next
sentence — that the two schema files are identical — was true at the
time and was a deliberate choice explained above, but was reverted at
explicit request in increment 11 (further up this document). Left
unedited below for the same honest-record reason as the 9/9.2
correction.**

Confirmed the two schema files' model bodies are identical via `diff`,
not by eye. Tested the `NODE_ENV`-based schema-selection logic in
isolation. Checked `package.json` is valid JSON and `scripts/db-sync.js`
passes `node --check`. **Did not and cannot**: actually run this against
a real Postgres instance, actually deploy to Railway, or verify any of
the dashboard/DNS steps in `DEPLOYMENT.md` — I've never seen Railway's
current UI execute, only described it from what I know of how the
platform works. If a step in that document doesn't match what you
actually see, tell me the exact discrepancy.

## Increment 9.2 — full manual SQLite conversion (enums + Json)

Increment 9 assumed, based on official Prisma docs I searched, that
current Prisma versions emulate enums and `Json` on SQLite. You ran
`npm install` for real and got actual `P1012` validation errors on both —
real execution output overrides research every time, and I should have
been more skeptical of a general "current Prisma supports X" claim
without checking it against the *specific pinned version* in this
project's `package.json`. That's the gap: the docs I found may describe a
newer version than `^5.20.0`; I didn't verify the version boundary, I
generalized from "Prisma now supports this" to "this pinned version
supports this." Not repeating that assumption here — this pass is the
literal, complete manual conversion you specified, no version-support
shortcuts.

### What changed, confirmed by grep before and after, not assumed

- **All 8 enums removed from `prisma/schema.prisma`**: `UserRole`,
  `ShipmentMode`, `ShipmentStatus`, `DocumentType`, `PaymentStatus`,
  `VehicleStatus`, `DriverStatus`, `DisputeStatus`. Every field that used
  one is now a plain `String` with the same default value as a literal
  (e.g. `role String @default("CUSTOMER")`).
- **`src/lib/enums.ts`** (new): a TypeScript union type + `as const` value
  array for each of the 8, replacing the type safety Prisma's enums used
  to provide — at the application layer instead of the database layer,
  exactly as asked. Referenced in a comment on every affected schema field
  so the two files stay discoverable as a pair.
- **`SavedSearch.filters`**: `Json` → `String`, JSON-encoded.
  **`src/lib/json-filters.ts`** (new) — `toJsonFilters`/`fromJsonFilters`.
  Both read and write sites in `src/app/api/saved-searches/route.ts`
  updated: `POST` stringifies before storing, `GET` parses before
  returning, so the client (`LoadBoardClient.tsx`, unchanged) still sees
  a plain object exactly as before.
- **`prisma/seed.ts`**: was the *only* file anywhere in the codebase
  importing Prisma's generated enum objects as runtime values
  (`UserRole.CUSTOMER`, `ShipmentMode.FTL`, `ShipmentStatus.OPEN_FOR_BIDS`)
  — confirmed by grepping the entire `src/` tree first, not assumed. Those
  three imports no longer exist once the schema has no enums to generate;
  replaced with the plain string literals directly, each commented with
  which `src/lib/enums.ts` type it corresponds to.
- Grepped `src/` afterward for any lingering reference to the 8 removed
  type names as well — zero remain outside `src/lib/enums.ts` itself and
  the explanatory comments. Every other place in the app (zod schemas on
  API routes, the shipment wizard's mode list, filter dropdowns) was
  already using plain string literals / `z.enum([...])` arrays, not
  Prisma's generated types, so those needed no changes at all — confirmed
  by checking, not by assuming the blast radius was small.

### What I verified vs. what I still cannot

Real TypeScript compiler pass, clean, on both `src/` and `prisma/seed.ts`.
Manual structural check of the schema file itself: brace depth returns to
exactly 0 with no point going negative (would indicate a stray closing
brace), all 13 models present. Grepped for zero remaining `enum` blocks,
zero remaining `Json` fields, zero remaining `String[]` fields.

**What none of that can substitute for, stated plainly: `npx prisma
validate` and `npx prisma generate` against the real engine.** My checks
confirm the schema *file* is well-formed Prisma syntax as best I can tell
without the actual parser, and that application code doesn't reference
anything that no longer exists — they cannot confirm Prisma's own schema
validator accepts every attribute combination here. That first real
`npm install` remains the actual test, same as always, and this time it's
specifically what told us the previous approach was wrong — which is
exactly why re-running it after this fix matters more than my confidence
level going in.

## Increment 9 — no PostgreSQL required for local testing (see 9.2 above for a correction)

**Correction: the "Enums" bullet immediately below turned out to be
wrong** — see Increment 9.2 above. I said at the time that current Prisma
versions emulate enums on SQLite with no schema changes needed. That was
based on official docs, not verified against this project's actual pinned
Prisma version, and you got real `P1012` errors that contradict it. Left
the original text below unedited rather than quietly rewriting it, since
the point of this changelog is an honest record, not a clean one.

**What changed:** the database is now SQLite by default — a single file
at `prisma/dev.db`, created automatically. `npm install --legacy-peer-deps
&& npm run dev` now sets up real, working tables automatically (no manual
`db:push` step needed either), so you get actual data instead of the
"Database not connected" notice without touching Docker, Postgres, or any
config at all. Real demo accounts still need one command: `npm run
db:seed`.

### Why this was more tractable than it might sound

Prisma's SQLite support has one real limitation and one that turned out
not to apply here — I checked both rather than assuming:

- **Enums**: I initially expected these would need converting to plain
  strings (SQLite has no native enum type), which would have meant
  touching nearly every model and every route that filters by status/mode.
  Turned out unnecessary — current Prisma versions emulate and type-check
  enums against SQLite at the ORM level; the 8 enums in this schema
  (`UserRole`, `ShipmentMode`, `ShipmentStatus`, etc.) needed zero changes.
- **Scalar arrays (`String[]`)**: this one *is* still Postgres/CockroachDB-
  only — confirmed current, not just historical. Exactly 3 fields used
  it: `CarrierProfile.equipmentTypes`, `CarrierProfile.operatingAreas`,
  `Shipment.photos`. All three are now JSON-encoded `String` fields, with
  `toJsonArray`/`fromJsonArray` helpers (`src/lib/json-array.ts`) at every
  read/write site — 3 API routes, found by grepping for the fields, not
  guessed at.

### Zero-config mechanics

- `prisma/schema.prisma`: `provider = "sqlite"`. Comment block in the file
  explains exactly what moving to Postgres later would involve (small:
  swap the provider + URL; the JSON-encoded fields work unchanged on
  Postgres too, no need to revert them).
- `src/lib/prisma.ts`: if `DATABASE_URL` isn't set at all, defaults to
  `file:./dev.db` in code — confirmed via research that this resolves
  consistently relative to `schema.prisma`'s own directory (`prisma/`) for
  both the CLI and the standard generated client used here (this is a
  documented, real gotcha when a driver-adapter client is used instead —
  not the case here, so it isn't a risk).
- `package.json`: added `"postinstall": "prisma generate"` (runs
  automatically after `npm install`) and `predev`/`prebuild` now also run
  `prisma db push --accept-data-loss --skip-generate` after the env check
  — tables exist automatically before the dev server even starts. This
  reruns on every `npm run dev`; harmless and fast against SQLite, but if
  you ever point `DATABASE_URL` at a real shared Postgres database instead,
  be aware `predev` will auto-apply schema changes there too without
  asking — fine for solo local use, worth knowing before doing that.
- `scripts/check-env.js`: `DATABASE_URL` missing is now purely
  informational in development (explains the SQLite default, not a
  warning), and specifically flags the real risk if it's missing in a
  *production* environment instead (silent SQLite fallback on ephemeral
  hosting would quietly lose data between deploys/instances) — a warning,
  not a hard block, since some small deployments do genuinely run SQLite
  on persistent disk.
- `prisma/seed.ts`: made idempotent for the sample shipment (checks for
  an existing one first) — a small robustness fix while already in this
  file, since `predev` now effectively makes re-running things more
  routine than before.
- Found and fixed one unrelated pre-existing bug while touching the
  `photos` field: the shipment wizard has sent uploaded photo URLs since
  increment 2, but `POST /api/shipments`'s zod schema never actually
  declared that field, so zod silently stripped it before it ever reached
  the database — every upload was quietly dropped. Fixed at the same time,
  not in scope originally, but clearly related and cheap to fix once found.

### What I verified vs. what I still can't

Ran the real TypeScript compiler pass again (clean), including — new
this round — `prisma/seed.ts`, which lives outside `src/` and wasn't
covered by previous passes; found two stub gaps in my own checker (missing
`@prisma/client` enum exports, missing `process.exit`), fixed those, then
confirmed clean. Also re-ran `check-env.js` against the zero-`.env` dev
scenario for real. What I still cannot do: actually run `prisma generate`
+ `prisma db push` against a real SQLite engine, or confirm the app
renders real data end to end — that needs an actual `npm install`, same
limitation as every round before this one.



**Diagnosis:** you reported the homepage never finishing loading. Service
workers actively conflicting with dev servers — intercepting hot-reload
requests, RSC payload fetches, and dev-only asset requests, then hanging
or mishandling them — is a well-documented failure mode, and the PWA
service worker added a few increments back (`public/sw.js`, registered
unconditionally by `ServiceWorkerRegister.tsx`) is the only thing added
recently that runs on every single page, homepage included, in the
background. That's a strong match for the symptom.

**Fix, and why I chose the blunter option:** a production-only gate would
reduce the risk, but I have no way to confirm that actually resolves it —
I still can't run `next dev` myself. Given that, and given a broken "nice
to have" PWA feature is a much worse trade than no offline support at
all, I disabled service worker registration entirely rather than trying
to be clever about scoping it. `ServiceWorkerRegister.tsx` now only
*unregisters* any service worker this app previously installed in your
browser and clears its cache — in every environment — rather than
registering a new one anywhere. `public/sw.js` and `public/manifest.json`
are left in place, unused, for later if someone wants to properly test
PWA support with a real dev server available.

**Important — you likely need one manual step right now, and here's why
my code fix alone can't do it for you:** if the service worker is already
active and controlling your current tab (which `clients.claim()` in the
old `sw.js` would have done), it can intercept even the page's own
top-level navigation request going forward — meaning the *new* JavaScript
that unregisters it might never get a chance to run before the page hangs
again. That's not something a code change on my end can fix by itself.
Please do one of:

- Open the site in an **Incognito/Private window** (guaranteed clean,
  no previously-installed service worker), or
- In DevTools → **Application** tab → **Service Workers** → click
  **Unregister**, then **Application** → **Storage** → **Clear site
  data**, then reload normally.

Once that's done once, the cleanup code in this update prevents it from
reoccurring — it actively removes any registration on every load rather
than assuming there isn't one.

## Increment 8.2 — removed the service worker (was causing "keeps loading")

**Direct answer to "test the actual ZIP on a clean Windows folder":
I did not, and cannot — this sandbox has no network access (can't run
`npm install`) and isn't Windows. I'm not going to imply otherwise.** What
I did instead, specifically:

- Extracted the exact conditional logic that decides the auth secret
  (`isProduction` / fallback / throw) out of `auth.ts` into a standalone
  script and ran it against all 5 realistic `NODE_ENV`/`AUTH_SECRET`
  combinations, including `NODE_ENV` being completely unset — confirmed
  each one resolves the way this section describes.
- Ran `scripts/check-env.js` for real (it's plain Node, no dependencies,
  so I actually can execute it here) against: zero `.env` in dev mode
  (the exact scenario you asked for), zero `.env` with `NODE_ENV=
  production` (must fail), and production with a real secret set (must
  pass). All three behaved correctly.
- Re-ran the full TypeScript compiler pass (details further down) — clean.

None of that is a substitute for you actually running it, which remains
the real test. It's the difference between "I reasoned this should work"
and "I executed the exact decision logic and the exact script against
the exact scenarios you described."

## Increment 8.1 — zero-config local preview

### What changed

1. **`src/lib/auth.ts`** now computes the secret itself instead of just
   reading `process.env.AUTH_SECRET`:
   - `AUTH_SECRET` set → uses it, in dev or production.
   - Not set, `NODE_ENV !== "production"` (what `next dev` sets
     automatically) → falls back to a **fixed, insecure, checked-into-
     source** dev-only value, and prints one warning at module load (not
     per-request — this file is a singleton import, so it logs once per
     server start, never repeats). No `.env` file, no manual secret
     generation, `npm run dev` just works.
   - Not set, `NODE_ENV === "production"` → throws immediately with a
     clear message. Last line of defense if `check-env.js` is ever
     bypassed; there's no safe fallback in production for a secret that
     would otherwise be public source code.
2. **`scripts/check-env.js` rewritten**: development never blocks
   startup now — `AUTH_SECRET` and `DATABASE_URL` are both non-blocking
   warnings there. Production still hard-fails on a missing/placeholder
   `AUTH_SECRET`. (Caveat, stated plainly: this script tells dev and
   production apart via `NODE_ENV`, which `next build`/`next start` set
   automatically on real hosting platforms — if you run a bare `npm run
   build` locally without exporting `NODE_ENV=production` yourself, the
   check won't enforce, because it isn't actually a production
   environment yet. That's the standard convention, not a workaround.)
3. **No `.env` file is shipped in this ZIP** — zero secrets, real or
   fake-but-labeled, ship in source. The dev fallback lives in code
   (`auth.ts`), not in a committed environment file, so "no real
   production secrets inside the ZIP" and "no manual file edits to
   preview" are both true at once rather than in tension.
4. **`DATABASE_URL`**: unchanged from increment 7/8 — optional for local
   preview, every DB-backed page and API route shows a setup notice
   instead of crashing (`src/lib/safe-db.ts`, `src/lib/api-error.ts`).

### What should now happen on a clean extract

```bash
npm install --legacy-peer-deps
npm run dev
```

- Homepage: loads (no DB, no auth needed).
- Login page: opens (auth() only runs when a session is actually
  checked, which doesn't block the login form itself from rendering).
- Post a Load: opens — this page requires a session to *do* anything,
  but reaching it no longer needs any file edits; sign in with a demo
  account first if you want to submit (needs `DATABASE_URL` + seed data
  for that part).
- Load Board: renders the page shell; shows `<DbSetupNotice />` instead
  of listings, since there's no database connected yet.
- No `MissingSecret` — the dev fallback prevents the underlying
  condition entirely, not just the log message.
- No redirect loop: `proxy.ts` only redirects *to* `/login`, and `/login`
  itself was never in the protected-prefix list, so there's no cycle.

Signing in for real (registration, dashboards with data, etc.) still
needs a real `DATABASE_URL` — that part was never in scope for "preview
without setup," only auth was.

## Increment 8 — MissingSecret, env validation, Turbopack root

Increment 7's two root-cause fixes (auth version + async params) held —
confirmed by you, not just claimed by me. This pass is smaller and more
mechanical:

### `[auth][error] MissingSecret`

Not a code bug — `AUTH_SECRET` genuinely wasn't set. But repeating that
error on every request instead of failing once, clearly, was worth
fixing:

- `src/lib/auth.ts` now passes `secret: process.env.AUTH_SECRET`
  explicitly, instead of relying only on Auth.js's env-var auto-inference.
- **`scripts/check-env.js`** (plain Node, zero dependencies, actually run
  three times against real scenarios — no `.env`, a placeholder secret,
  and a real one — to confirm it behaves correctly, not just written and
  assumed): wired as `predev`/`prebuild` in `package.json`, so `npm run
  dev` and `npm run build` refuse to start with one clear message instead
  of the app booting and then failing silently on every request.
  - `AUTH_SECRET` missing or still the placeholder → **hard stop**, exit 1.
    There's no safe fallback here — sessions cannot be signed without it.
  - `DATABASE_URL` missing → **warning only, does not block startup**.
    Blocking here would have directly contradicted increment 7's "DB-
    backed pages show a setup notice instead of crashing" — so this
    script respects that design rather than overriding it.
- `.env.example` rewritten with the exact secret-generation commands
  inline (`openssl rand -base64 32`, plus a cross-platform Node one-liner
  for anyone without `openssl`), and a note clarifying `AUTH_URL` vs
  `NEXTAUTH_URL`: Auth.js v5 accepts either name, `NEXTAUTH_URL` is kept
  for v4-tutorial compatibility, you only need one, not both.

### Turbopack workspace-root warning

Set `turbopack: { root: __dirname }` in `next.config.js` (confirmed this
is the current stable, non-experimental config key for Next.js 16, not
`experimental.turbo`, which is removed in 16). This tells Turbopack the
project root explicitly instead of inferring it by walking up looking for
lockfiles — which is what misfires if this repo sits inside another
folder that has its own lockfile above it.



### Carried forward from Increment 7 (confirmed fixed by you, kept for record)

**I still cannot run `npm install`, `next build`, or a dev server in my
own environment** — no network access, no way to fetch packages. Every
fix below is either (a) a specific, cited, version-pinned root cause I
found by researching the exact error you reported, or (b) a mechanical
code change I verified with a real TypeScript compiler pass (details in
"What I actually verified" below). I'm not going to claim this is now
error-free — that's not something I can honestly claim without running
it. What I can tell you is exactly what changed, why, and how confident
I am in each piece, so you can test efficiently instead of re-describing
symptoms.

### Bug 1: `headers.get is not a function` in `auth()`

**Root cause, confirmed via research:** `next-auth@5.0.0-beta.22` (what
this project was pinned to) predates Next.js 16 and reads `headers()`/
`cookies()` synchronously. Next.js 16 made those fully async — they
return a `Promise`, which has no `.get()` method, hence the exact error.
This wasn't a per-page bug; every call to `auth()` anywhere in the app hit
the same code path.

**Fix:**
- `next-auth` bumped to `^5.0.0-beta.31` — the first published beta whose
  own peer-dependency range lists `next: "^14.0.0-0 || ^15.0.0 || ^16.0.0"`.
  I confirmed a real project running `next@16.0.9` with `next-auth@5.0.0-
  beta.30` cleanly in the wild before picking this range.
- `@auth/prisma-adapter` bumped to `^2.9.0` to match.
- Added `trustHost: true` in `src/lib/auth.ts` (and `AUTH_TRUST_HOST` in
  `.env.example`) — research turned up a **second, separate** error
  ("Host must be trusted") that shows up once the headers/cookies issue
  is fixed, specifically when running behind any reverse proxy or
  container setup (i.e. most real deployments, not just Vercel). Fixing
  one without the other would have just traded one crash for another.
- `middleware.ts` → `proxy.ts`: Next.js 16 renamed this file and the
  export (`middleware` → `proxy`); **the old filename is silently
  ignored, not an error** — so route protection wasn't running at all,
  though every protected page still had its own `auth()` redirect check
  as a second layer, so this wasn't a data-exposure gap, just a dead
  layer. The new `proxy.ts` also switches to the pattern the Next.js 16
  ecosystem now documents: a cheap cookie-existence check only (no JWT
  decoding in the proxy layer), with the authoritative check staying in
  each Server Component.

**What I can't do:** confirm this actually resolves it without a real
`npm install && npm run dev`. I'm confident in the diagnosis; I can't be
confident in the outcome the way a test run would let me be.

### Bug 2: sync `searchParams`/`params` (`/loadboard`, `/shipments/:id`, and 8 API routes)

**Root cause:** Next.js 16 made `params` and `searchParams` `Promise`s
that must be awaited, in both pages and route handlers. This project was
still written the pre-15 way (`{ params }: { params: { id: string } }`,
used synchronously). **This is a distinct bug from #1** — it's a Next.js
page/route contract, not an Auth.js issue, and it's also exactly the kind
of error my own TypeScript-based verification *cannot* catch: Next.js
enforces this specific contract through its own generated types during
`next build`, not through anything visible to a standalone `tsc` run
against stubbed third-party types. I want to be direct about that rather
than imply my check "should" have caught it.

**Fixed in every affected file** — confirmed by grep, not just spot-check:
- `src/app/loadboard/page.tsx` (`searchParams`)
- `src/app/shipments/[id]/page.tsx` (`params`)
- 8 dynamic API routes: `shipments/[id]/{route,award,deliver,dispute,messages}`,
  `admin/disputes/[id]/resolve`, `notifications/[id]/read`, `saved-searches/[id]`

Every one now types the prop as `Promise<{...}>` and does
`const { id } = await params;` (or `await searchParams`) before use.

### Bug 3: `DATABASE_URL` missing → crash

Already partly addressed last pass; this pass extends it to every
Server Component that reads Prisma directly, not just the API layer:

- `src/lib/safe-db.ts` (`safeDbCall`) wraps `dashboard`, `loadboard`,
  `carrier/dashboard`, `shipments/[id]`, `messages`, and `notifications` —
  a `PrismaClientInitializationError` (or any "can't reach database"
  message) renders `<DbSetupNotice />` with setup steps instead of
  crashing or blanking.
- `src/lib/api-error.ts` (`handleApiError`) does the same for all 27
  non-NextAuth API routes — DB-unavailable now returns a `503` with setup
  instructions in the JSON body, not a raw `500` stack trace.
- Root `error.tsx`, `global-error.tsx`, `not-found.tsx`, `loading.tsx`
  added — no route in this app can render a truly blank page or Next's
  default error overlay anymore; worst case is one of these four.

### Route and navigation audit

- **Two real gaps found and fixed**, not just cosmetic: `/ship/new` (Post
  a Load) had **no auth check at all** — not in the proxy, not in the
  page itself, since it was a bare client component. It rendered for
  logged-out visitors and only failed on submit. Now server-gated and in
  the shared shell. `/carrier/fleet` and `/carrier/membership` had the
  same gap — fixed the same way.
- **"Register" went to `/login`, a dead end.** Built a real registration
  page + `POST /api/auth/register` (shipper or carrier, carrier sign-up
  gets a stub `CarrierProfile`).
- **Two pages your list required didn't exist as standalone routes**:
  Messages (was only reachable per-shipment) and Notifications (was only
  a header dropdown). Both now have real pages at `/messages` and
  `/notifications`, both DB-safety-wrapped.
- **Added `/profile`** — also missing.
- Every internal page (dashboard, load board, post-a-load, shipment
  detail, carrier dashboard/fleet/membership, admin, messages,
  notifications, profile) now shares one `AppShell` component: logo, nav,
  notification bell, breadcrumbs, footer — so Post a Load (your specific
  complaint) and everything else reads as one product instead of
  standalone forms. The homepage keeps its own separate marketing nav
  (`SiteNav`), unchanged, as you asked.
- Full inventory, confirmed by `find`, not memory: **16 page routes, 28
  API routes** (up from 26 — added register + profile). Every internal
  `href` in the codebase checked against the actual route tree.

### What I actually verified, precisely

1. **Brace/paren balance** across every `.ts`/`.tsx` file — mechanical,
   catches nothing subtle, but confirms no file is structurally broken.
2. **A real TypeScript compiler pass** (`tsc`, not a linter) against the
   entire `src/` tree, with third-party packages stubbed to `any` since
   this sandbox has no network to install them. This catches real syntax
   errors, JSX errors, and type mismatches **between my own files**. It
   does **not** catch: library-API misuse, CSS/PostCSS build errors (the
   `@import` bug from last round is exactly this category), or Next.js's
   own page/route contract enforcement (bug #2 above). Came back clean
   (exit 0) after every change in this pass.
3. **Targeted research** for both reported runtime errors, cited inline
   in this README section, rather than guessing.
4. **Did not run:** `npm install`, `npx prisma generate`, `tsc` against
   the real dependency tree, `next build`, `next dev`, or a browser. I'm
   telling you this plainly instead of leaving it implied.

The single highest-value next step is still what it's been every round:
`npm install --legacy-peer-deps && npx prisma generate && npm run build`
on a real machine. If that surfaces something new, the exact error text
is far more useful to me than "still broken" — it's what let me fix both
root causes precisely this round instead of guessing.

### Homepage redesign

Redesigned separately from the numbered increments below, per a
design-only brief — no routes, APIs, or other pages were touched.

- Uploaded logo wired in at `public/mach-logo.png`, used in nav + footer
- Full nav, hero, explainer, 10-category grid, why-choose grid, 4-step
  how-it-works, live marketplace preview (mockups of the real dashboards),
  animated stats, testimonials, enterprise-solutions grid, carrier
  recruitment section, technology section, enterprise footer
- Custom SVG icon/illustration set in the logo's own navy+cyan duotone
  style, used instead of stock photography — no hotlinked images to break
  or license
- New `hp*` Tailwind tokens and fonts (Space Grotesk / IBM Plex Mono) are
  additive; existing `m20*` tokens used by dashboard/loadboard/carrier
  pages are untouched
- **Build fix:** the redesign originally put `@import` for Google Fonts
  *after* the `@tailwind` directives in `globals.css`, which is invalid CSS
  (`@import` must precede all other rules) and failed the Next.js build.
  Fixed — `@import` is now the first line in the file.
- At first pass, the footer's Privacy/Terms links and newsletter form were
  placeholders (`href="/#"`, no submit handler, deliberately left that way
  and documented as such rather than silently shipped). They are **now
  implemented** — see below — this line stays as a record that they were
  placeholders first, not to imply they still are.

### Privacy, Terms, and newsletter — now real

- `/privacy` and `/terms` are real pages with actual freight-marketplace-
  specific content (marketplace role, escrow, disputes, carrier
  verification, etc.), each carrying a visible **"Draft — pending legal
  review"** notice, since I'm not a lawyer and these haven't been reviewed
  by one. Treat them as a structural starting point, not a finished policy.
- `POST /api/newsletter/subscribe` persists to a new `NewsletterSubscriber`
  table (always works, no config needed) and best-effort sends a welcome
  email via Resend if `RESEND_API_KEY` is set (silently skipped if not —
  capture and sending are independent, so the form works today either way).
  Footer form now actually calls this endpoint and shows success/error state.

### Increment 5: messaging, disputes, notifications, admin panel

- `Dispute` and `NewsletterSubscriber` added to the Prisma schema
- API: `GET/POST /api/shipments/:id/messages` (shipper + awarded/bidding
  carriers only), `POST /api/shipments/:id/dispute` (freezes shipment to
  `DISPUTED`, notifies admins + counterparty), `POST
  /api/admin/disputes/:id/resolve` (release / refund / reject),
  `GET /api/admin/{users,shipments,disputes}`, `GET /api/notifications`,
  `POST /api/notifications/:id/read`
- In-app notifications now fire on: new bid, award, new message, dispute
  raised, dispute resolved
- New pages: `/shipments/:id` (bids, message thread, raise-dispute button),
  `/admin/dashboard` (tabs for users/shipments/disputes, resolve actions)
- `NotificationBell` wired into both customer and carrier dashboards

### Increment 6: "AI" features and PWA polish

Honest scope up front: there is no external ML/LLM service wired into this
repo, and I have no way to add one from this sandbox (no network to call
one, no training data to build one). What's here is real, useful, and
disclosed as exactly what it is — statistics and heuristics over your own
data, not a trained model:

- **Rate suggestion** — `GET /api/ai/price-suggestion?mode=&origin=&dest=`
  returns a low/median/high range computed from median-quartile stats over
  past *won* bids on the same lane (falling back to mode-wide history, then
  to "no data yet" — it says which basis it used). Shown on the shipment
  wizard's review step.
- **Carrier recommendations** — `GET /api/ai/carrier-recommendations` ranks
  active-membership carriers by rating and a keyword match between cargo
  description and `CarrierProfile.equipmentTypes`. Shown on `/shipments/:id`
  to the shipper, before award.
- **Bid anomaly flag** — on the shipment detail page, a revealed bid more
  than 40% below the field's median gets an "unusually low — double check"
  tag. This is the entire scope of "fraud detection" in this pass; it does
  not look at account history, IP/device signals, or bidding patterns
  across shipments.
- **PWA**: real `manifest.json`, real icon set generated from your logo at
  192/512/apple-touch sizes (not placeholders — actually resized), theme
  color, and a scoped service worker that caches static GETs for
  faster repeat loads and an offline shell. API routes are explicitly
  excluded from the cache — shipment/bid data must never serve stale.
  There's no background sync for offline actions.

### Carried-forward increments 1–4


- Next.js 16 App Router, TypeScript, Tailwind; Auth.js credentials login;
  route-protecting middleware (`/dashboard`, `/carrier`, `/admin`,
  `/shipments`)
- Shipment wizard with Google Places autocomplete, quick-bid, sealed-bid
  reveal cron, award (creates escrow `Payment`), deliver (releases escrow
  via Stripe Connect transfer)
- Carrier dashboard, membership billing (Stripe Checkout + webhook), fleet
  management, Connect payout onboarding
- Load board with map/table toggle and saved searches
- Seed script, Docker Compose, production Dockerfile

### What's intentionally stubbed, and still open

- Payment *capture* — escrow records are created at award time but there's
  no Stripe Elements/PaymentIntent flow for the shipper to actually fund
  it yet; `deliver` releases whatever's marked ESCROWED regardless
- Refund resolution flips the `Payment` row to `REFUNDED` but does not yet
  call a real Stripe refund/reversal — that call still needs wiring
- Socket.IO real-time updates (messages/notifications currently poll or
  require a page refresh, not pushed live)
- GPS tracking, POD photo uploads, damage reports
- Fraud detection, AI features (price prediction, OCR, recommendations),
  CMS, email/SMS notification center, audit logs, PWA polish
- Vehicle↔driver assignment UI

I did not fabricate a finished, tested product — the pieces above are
genuinely not built yet.

### On verification

I don't have network access in my build environment, so I can't run
`npm install` myself — every increment up to now was checked only by
brace/paren balancing and manual review, which is why the `@import`
ordering bug above got through. Starting this pass, I additionally ran the
actual TypeScript compiler (a copy of `typescript` happens to be available
in my sandbox outside the project's own `node_modules`) against the whole
`src/` tree, with third-party packages stubbed to `any` since they aren't
installed. That catches real syntax, JSX, and cross-file type errors, but
**not** library-API misuse (e.g. a wrong Prisma method name) or CSS/build-
tool-level issues like the one just fixed. It came back clean on this pass.
None of this substitutes for `npm install && npm run dev` on a real
machine, which is still the first thing to do with this repo.

## Local setup

### Preview with real data — two commands, nothing to configure:

```bash
npm install --legacy-peer-deps
npm run dev
```

That's genuinely it now. `npm install` triggers `prisma generate`
automatically (`postinstall`), and `npm run dev` creates the SQLite
database and tables automatically (`predev` runs `prisma db push`) before
starting. Homepage, navigation, Load Board, Dashboard — everything reads
and writes real data in `prisma/dev.db`, no Postgres, no Docker, no `.env`
file needed. Auth works via a fixed, insecure, dev-only fallback secret
baked into `src/lib/auth.ts` for the same reason — see the increment
notes above for exactly how both of these work and what I actually tested
versus what still needs you to run it for real.

### Want named demo accounts (shipper/carrier/admin logins)?

```bash
npm run db:seed
```

One command, run any time after the steps above. Demo accounts
(password `demo1234`):

- `shipper@demo.mach2011.com`
- `carrier@demo.mach2011.com`
- `admin@mach2011.com`

### Preparing a real deployment?

SQLite-on-a-file is fine for small production deployments with real
persistent disk; for anything else, switch to Postgres — see the comment
block at the top of `prisma/schema.prisma` for exactly what that
involves (small: change `provider`, set a real `DATABASE_URL`). Either
way: set `AUTH_SECRET` (generate with `openssl rand -base64 32`) for
real in your hosting platform's environment, not in a committed `.env`,
and make sure `NODE_ENV=production` is actually set there (real hosting
platforms do this automatically) — that's what makes
`scripts/check-env.js` enforce a real secret instead of allowing the dev
fallback.

If `npm install` reports peer-dependency conflicts even with
`--legacy-peer-deps`, they're most likely about the `next-auth` beta
range — please paste the exact conflict; I pinned versions based on
public registry metadata, not a live install, so it's possible something
shifted since.

## Docker

```bash
docker compose up --build
```

## Project layout

```
prisma/
  schema.prisma       # data model
  seed.ts             # demo data
src/
  app/
    page.tsx                    # homepage (marketing)
    (auth)/login/, register/    # sign in / sign up
    dashboard/, loadboard/      # shipper dashboard, public load board
    ship/new/                   # post a load (server-gated wrapper + client wizard)
    shipments/[id]/             # shipment detail: bids, messages, disputes
    carrier/dashboard/, fleet/, membership/
    admin/dashboard/
    messages/, notifications/, profile/
    privacy/, terms/
    error.tsx, global-error.tsx, not-found.tsx, loading.tsx
    api/
      auth/[...nextauth]/, auth/register/
      shipments/, bids/, fleet/, saved-searches/, ai/
      admin/, notifications/, stripe/, uploads/, cron/, newsletter/, profile/
  components/
    AppShell.tsx        # shared header/nav/footer for all internal pages
    home/                # homepage-only nav/sections (SiteNav, Hero, etc.)
  lib/
    auth.ts, prisma.ts, safe-db.ts, api-error.ts, notify.ts, stripe.ts, s3.ts
    json-array.ts       # serialize/deserialize helpers for the 3 fields
                         # that are JSON-encoded strings instead of native
                         # arrays (SQLite has no array column type)
scripts/
  check-env.js          # predev/prebuild env validation, zero deps
proxy.ts               # Next.js 16 route-protection (was middleware.ts)
docker-compose.yml      # optional — for a later Postgres production move
Dockerfile
```

## Roadmap (proposed increments)

1. ✅ Scaffold, auth, schema, load board, dashboard
2. ✅ Shipment creation wizard, photo upload plumbing (S3), quick-bid,
   sealed-bid reveal endpoint, award endpoint
3. ✅ Carrier dashboard, membership billing (Stripe Checkout + webhook),
   fleet/driver management
4. ✅ Map view (Google Maps), address autocomplete, saved searches, Stripe
   Connect payouts to carriers after delivery
5. ✅ Admin panel, dispute resolution (release/refund/reject), messaging,
   notifications — Socket.IO real-time push still open
6. ✅ Heuristic rate suggestion + carrier recommendations, bid anomaly
   flag, PWA manifest/icons/service worker — a trained ML/LLM matching
   model, full offline support, and background sync remain open, since
   they need infrastructure this sandbox doesn't have
7. ✅ Stabilization audit: Next.js 16 auth compatibility (version +
   trustHost + proxy.ts), async params/searchParams project-wide,
   DB-safety on every direct Prisma read, shared AppShell across every
   internal page, error/not-found/loading boundaries, registration +
   profile + messages + notifications pages. Auth and params/searchParams
   fixes confirmed working by real testing (see increment 8).
8. ✅ MissingSecret fix (explicit `secret` + fail-fast env validation
   script, tested against three real scenarios), `.env.example` rewritten
   with exact `AUTH_SECRET` generation commands, Turbopack `root` config
   to silence the workspace-root warning.
8.1. ✅ Zero-config local preview: fixed dev-only fallback secret in code
   (`src/lib/auth.ts`), `check-env.js` rewritten so development never
   blocks startup while production still enforces a real secret, no
   `.env` shipped in the ZIP. Fallback-decision logic and the checker
   script both actually executed against realistic scenarios (details
   above) — the Windows clean-folder `npm install && npm run dev` test
   itself was not something I could run in this sandbox.
8.2. ✅ Removed the PWA service worker entirely (was causing "homepage
   keeps loading" — service workers are a known conflict source with dev
   servers). Chose full removal over a production-only gate since I
   can't verify either fix without running `next dev` myself, and a
   broken nice-to-have is a worse trade than none. Manual one-time
   browser cleanup step required if you already hit this — see above.
9. ✅ Removed the PostgreSQL requirement for local testing entirely —
   SQLite by default, zero config, tables created automatically on
   `npm run dev`. Initially assumed (based on general Prisma docs, not
   verified against this project's pinned version) that enums needed no
   schema changes — that assumption was wrong, corrected in 9.2. Found
   and fixed one unrelated pre-existing bug (silently dropped photo
   uploads) while touching the affected field.
9.2. ✅ Full manual conversion after real `P1012` errors disproved 9's
   enum assumption: all 8 enums → plain `String` fields + a TypeScript
   union-type layer (`src/lib/enums.ts`) doing the validation instead;
   `SavedSearch.filters Json` → JSON-encoded `String`
   (`src/lib/json-filters.ts`). Grepped the entire codebase for every
   usage rather than assuming a small blast radius — found exactly one
   file (`prisma/seed.ts`) importing Prisma's generated enum values,
   fixed it; confirmed zero other references remained afterward.
10. ✅ Production deployment prep: separate `prisma/schema.production.prisma`
   (Postgres) alongside the SQLite dev schema, `NODE_ENV`-aware
   `scripts/db-sync.js` so the default build/install path also does the
   right thing automatically, and `DEPLOYMENT.md` with a concrete Railway
   walkthrough. Cannot verify any of the actual deploy/DNS steps myself —
   no network access.
11. ✅ Restored native Postgres enums/arrays/Json in
   `schema.production.prisma` at explicit request, reversing increment
   10's safer-but-simplified choice. Enums: zero risk, confirmed.
   Arrays/Json: made `src/lib/json-array.ts`/`json-filters.ts` check
   runtime shape instead of assuming one, so the same code works against
   either schema. Disclosed clearly: cannot verify this against the
   project's real `"strict": true` tsconfig with an actual generated
   client on either side — only a stubbed check.
