#!/usr/bin/env node
// Runs before `npm run dev` and `npm run build` (see package.json
// "predev"/"prebuild"). Plain Node, no dependencies — has to run before
// `npm install` guarantees anything else is installed.
//
// Development (NODE_ENV !== "production", which is what `next dev` sets
// automatically): NEVER blocks startup. AUTH_SECRET falls back to a
// fixed, insecure, checked-into-source dev value in src/lib/auth.ts, and
// DATABASE_URL is optional — DB-backed pages show a setup notice instead
// of data. This script only prints non-blocking warnings in dev.
//
// Production (NODE_ENV === "production", which `next build`/`next start`
// set automatically in real deployments): AUTH_SECRET is required, with
// no fallback — this script exits 1 with a clear message rather than
// letting the app start into a broken/insecure state. Note: if you run
// `npm run build` locally without NODE_ENV explicitly exported by your
// shell/CI, this script sees it as non-production and won't enforce —
// real hosting platforms (Vercel, Docker with NODE_ENV=production, etc.)
// set this themselves before building, which is the standard convention
// this relies on.

const fs = require("fs");
const path = require("path");

function loadDotEnv(file) {
  const result = {};
  if (!fs.existsSync(file)) return result;
  const lines = fs.readFileSync(file, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    result[key] = value;
  }
  return result;
}

const envFile = loadDotEnv(path.join(process.cwd(), ".env"));
function get(key) {
  return process.env[key] || envFile[key];
}

const isProduction = (process.env.NODE_ENV || envFile.NODE_ENV) === "production";
const PLACEHOLDER_VALUES = new Set(["replace-with-openssl-rand-base64-32", "replace-with-openssl-rand-hex-32"]);

const authSecret = get("AUTH_SECRET");
const authSecretMissingOrPlaceholder = !authSecret || PLACEHOLDER_VALUES.has(authSecret);
const databaseUrlMissing = !get("DATABASE_URL");

const info = [];
if (databaseUrlMissing && !isProduction) {
  info.push("ℹ DATABASE_URL is not set — the app will default to a local SQLite file (prisma/dev.db), created automatically. Nothing to do for local preview.");
}
const warnings = [];
if (databaseUrlMissing && isProduction) {
  warnings.push("⚠ DATABASE_URL is not set in production — the app will fall back to a local SQLite file. That's fine only if this deployment has real persistent disk storage; on most serverless/ephemeral hosting, data would be silently lost between deploys or instances. Set a real DATABASE_URL explicitly if that's not what you want.");
}
if (authSecretMissingOrPlaceholder && !isProduction) {
  warnings.push("⚠ AUTH_SECRET is not set — using a fixed, insecure, development-only fallback (see src/lib/auth.ts). Fine for local preview; do not deploy like this.");
}

if (info.length) {
  info.forEach((i) => console.log(i));
}
if (warnings.length) {
  console.warn("\n=== Environment (non-blocking, local preview) ===");
  warnings.forEach((w) => console.warn("  " + w));
  console.warn("Local dev will start anyway. See .env.example for production setup.\n");
}

if (authSecretMissingOrPlaceholder && isProduction) {
  console.error(`
=== Environment check failed (production) ===

  ✗ AUTH_SECRET is not set (or still the .env.example placeholder).
    Production has no safe fallback for this — sessions cannot be signed
    with a secret that would otherwise default to a value checked into
    source.

To fix:
  1. Generate a real value:
       macOS/Linux:   openssl rand -base64 32
       Any platform:  node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
  2. Set AUTH_SECRET to that value in your production environment
     (hosting platform's env var settings, or a real .env there — never
     commit a real one to source control).
  3. Re-run the build.
`);
  process.exit(1);
}

console.log("Environment check passed" + (warnings.length ? " (see warnings above)." : "."));
