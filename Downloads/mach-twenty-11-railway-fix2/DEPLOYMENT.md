# Deploying Mach Twenty 11 to production

I can't execute any of this myself — no network access in my environment.
This is a precise, best-current-knowledge specification for you to follow
and report back on, not something I've verified end to end. If a step
doesn't match what you see in front of you, tell me the exact discrepancy
and I'll correct this file, the same way every other fix in this project
has worked.

Recommended platform: **Railway** — hosts the Next.js app and a real
Postgres database together, which is the simplest path for this stack.
(Render is a close second with a similar setup; Vercel works for the app
but needs a separate Postgres provider like Neon or Supabase, since
Vercel's functions have no persistent disk.)

## 1. Get the code somewhere Railway can pull from

Railway deploys best from a GitHub repo (auto-redeploys on every push,
which is what you want for "start making updates to a real working
site"). If this project isn't already a git repo:

```bash
cd mach2011
git init
git add .
git commit -m "Initial commit"
```

Create a new (private, unless you want it public) repo on GitHub, then:

```bash
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```

(Alternative: `railway up` deploys directly from your local folder without
GitHub, if you'd rather skip this — but you lose auto-redeploy-on-push.)

## 2. Create the Railway project

1. [railway.app](https://railway.app) → New Project → Deploy from GitHub repo → select your repo.
2. In the same project, click **+ New** → **Database** → **Add PostgreSQL**.
   Railway provisions it and exposes a `DATABASE_URL`-shaped reference you
   can wire into your app service (next step) — you don't need to
   construct that connection string by hand.

## 3. Configure the app service

In your app service's **Settings**:

- **Build Command**: `npm run build:production`
  (not the default `npm run build` — that one auto-detects
  `NODE_ENV=production` and still does the right thing as a fallback, but
  `build:production` is the explicit, deliberate path; see
  `package.json` and the comment atop `prisma/schema.production.prisma`
  for exactly why two schema files exist.)
- **Start Command**: `npm run start`
- **Install Command**: `npm install --legacy-peer-deps` (Railway may
  default to plain `npm install` — override it if so; the `next-auth`
  beta version range needs this flag, same as local dev.)

In your app service's **Variables** tab, set:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Reference your Postgres service's connection string (Railway lets you reference another service's variable directly — look for "Add Reference" or similar in the variables UI, rather than copy-pasting a raw string) |
| `AUTH_SECRET` | Generate with `openssl rand -base64 32` locally, paste the output. **Never reuse the local dev fallback value** — that one is checked into source and public. |
| `AUTH_TRUST_HOST` | `true` |
| `NEXTAUTH_URL` | Your Railway-provided URL first (e.g. `https://your-app.up.railway.app`) — update this once the custom domain is live in step 5 |

`NODE_ENV=production` is set automatically by Railway; you shouldn't need
to set it yourself.

**Required — not optional anymore**: carriers cannot bid without an
active membership, which is entirely Stripe-gated (`canCarrierBid()` in
`src/lib/membership.ts`). Set these before considering the site usable
for carriers:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET` (from the webhook endpoint you configure in
  Stripe's dashboard pointing at `https://<your-domain>/api/stripe/webhook`)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_CARRIER_PRICE_ID` (the Price ID for a $19.99/mo recurring
  Product you create in the Stripe dashboard — Product name "Mach Twenty
  11 Carrier Membership", recurring monthly, $19.99, then copy the Price
  ID it generates, starts with `price_`)

Genuinely optional, add later (the app degrades gracefully without
these): `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, `AWS_*` (S3 uploads),
`RESEND_API_KEY`.

## 4. First deploy — apply the real migration history, then trigger a build

**Do not use `db:push:production` in production** — that command was
correct for quick local iteration but this project's spec explicitly
requires a real, tracked migration history via `prisma migrate deploy`,
not `db push --accept-data-loss`. Two things, in order, both one-time:

**Step A — create the migration history** (only needs doing once, ever,
from your local machine, since it needs to actually connect and diff):
```bash
DATABASE_URL="<real Railway Postgres connection string>" npx prisma migrate dev --name init --schema=prisma/schema.production.prisma
```
This is the one command in this entire project I cannot run myself or
fabricate the output of — it needs a live database connection to
generate real migration SQL. Get the connection string from Railway's
Postgres service variables tab.

**Step B — apply it in production** (this is what Railway's pre-deploy
step should run on every deploy going forward):
```bash
npx prisma migrate deploy --schema=prisma/schema.production.prisma
```
In Railway, set this as a **Pre-Deploy Command** (Settings → Deploy) if
that option is available in your plan/current UI; otherwise run it
manually once after each deploy that includes a schema change, via
Railway's shell/CLI exec against the running service.

Old instructions for reference, no longer the recommended production
path:

**Option A — from your local machine, pointed at the production DB
(quick, one-time):**
```bash
DATABASE_URL="<paste the real Railway Postgres connection string here>" npm run db:push:production
```
Get the real connection string from Railway's Postgres service variables
tab. Don't put it in a committed `.env` — this is a one-off terminal
command.

**Option B — from Railway's own shell against the running service**, if
your plan/setup supports a "Connect"/shell feature — run
`npm run db:push:production` there instead. Exact UI for this varies by
Railway's current interface; if you don't see a shell option, use Option A.

Once tables exist, trigger the actual deploy (push to `main` if using
GitHub integration, or `railway up` if not).

## 5. Point mach2011.com at it

1. In Railway's app service → **Settings** → **Networking** → **Custom
   Domain** → add `mach2011.com` (and `www.mach2011.com` if you want both).
2. Railway shows you a CNAME (or sometimes A record) target — add that
   exact record at your domain registrar's DNS settings.
3. DNS propagation can take anywhere from a few minutes to ~24 hours.
   Railway auto-provisions an SSL certificate once it verifies the DNS
   record.
4. Once live, update `NEXTAUTH_URL` in Railway's variables to
   `https://mach2011.com` and redeploy (env var changes usually need a
   redeploy to take effect — Railway will prompt you, or trigger one
   manually).

## 6. Verify before calling it live

Please actually check these — I can't:

- [ ] Homepage loads at `https://mach2011.com`
- [ ] `/login` and `/register` work
- [ ] Register a real account, confirm you land on the right dashboard
- [ ] `/loadboard` shows an empty state (not a crash) — no data yet, that's expected
- [ ] `npm run db:seed` run against production (same pattern as step 4,
   Option A) if you want the same demo accounts live — **or skip this for
   a real public site**; shipping the demo password (`demo1234`) publicly
   is a real risk if this is genuinely going live for real users. Decide
   deliberately, don't seed a public production database by habit.
- [ ] Post a load, confirm it appears on the load board
- [ ] Check Railway's logs for any startup errors

## Ongoing updates

With the GitHub integration, `git push` to your main branch triggers a
new deploy automatically. That's the "start making updates to a real
working site" workflow going forward — and it's exactly the kind of
iterate-and-see-it-live loop that's much faster in an environment with a
real terminal (Claude Code) than continuing in this chat, where every
change still has to go through a zip file and you running it yourself.

## Before this handles real money or real user data

This is a genuine gap, not a formality: `/privacy` and `/terms` are
explicitly labeled drafts pending legal review in this codebase — a
marketplace that holds escrowed funds and personal/business data has real
legal and compliance surface (money transmission rules vary by
jurisdiction, carrier liability, data protection). Get real legal review
before real money or real user PII flows through this, independent of
whether the code itself works.
