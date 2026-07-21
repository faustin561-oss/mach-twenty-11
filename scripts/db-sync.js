#!/usr/bin/env node
// Picks the right schema file automatically based on NODE_ENV, so the
// *default* npm scripts (postinstall/predev/prebuild) do the right thing
// even if a hosting platform just runs plain `npm install`/`npm run
// build` instead of remembering there's a *:production variant —
// getting it wrong means generating a client against one schema while
// pushing/running against another (SQLite vs Postgres), which mismatches
// silently rather than erroring clearly.
//
// Usage: node scripts/db-sync.js <generate|push>
//
// NODE_ENV=production  -> prisma/schema.production.prisma (Postgres)
// anything else        -> prisma/schema.prisma (SQLite, zero-config)
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// The Prisma CLI only auto-loads .env on its own — NOT .env.local, which
// is a Next.js-specific convention for local overrides that Next.js
// itself loads later (visible in `next build`'s own "Environments:
// .env.local" log line — too late for this script, which runs as part
// of the `prebuild` step, before Next.js starts at all). Confirmed as a
// real local build failure: a valid DATABASE_URL sitting in .env.local
// was invisible to `prisma db push` here. Loading both explicitly (in
// the same precedence Next.js uses: .env.local wins) fixes it without
// asking anyone to rename their file.
function loadEnvFile(file) {
  const result = {};
  if (!fs.existsSync(file)) return result;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
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

const envFromFiles = {
  ...loadEnvFile(path.join(process.cwd(), ".env")),
  ...loadEnvFile(path.join(process.cwd(), ".env.local")),
};
const childEnv = { ...envFromFiles, ...process.env }; // real process.env always wins over file values

const action = process.argv[2];
if (action !== "generate" && action !== "push") {
  console.error("Usage: node scripts/db-sync.js <generate|push>");
  process.exit(1);
}

const isProduction = childEnv.NODE_ENV === "production";
const schema = isProduction ? "prisma/schema.production.prisma" : "prisma/schema.prisma";

console.log(`[db-sync] NODE_ENV=${childEnv.NODE_ENV || "(unset)"} action=${action} -> using ${schema}`);

const args =
  action === "generate"
    ? ["generate", "--schema", schema]
    : ["db", "push", "--schema", schema, "--accept-data-loss", "--skip-generate"];

try {
  // shell: true matters specifically on Windows: npm installs command
  // shims there as prisma.cmd, and execFileSync does not resolve that
  // extension on its own (unlike a real shell, or unlike how `npm run
  // <script>` itself invokes things). Without this, the exact same code
  // works on Linux/Mac (and Vercel's Linux build environment — which is
  // why this passed there) and silently fails to even find the `prisma`
  // command at all on Windows. Confirmed as a real local failure, not
  // hypothetical.
  execFileSync("prisma", args, { stdio: "inherit", env: childEnv, shell: true });
} catch (err) {
  console.error(`[db-sync] prisma ${action} failed against ${schema}.`);
  console.error(`[db-sync] underlying error: ${err.message}`);
  if (isProduction) {
    console.error("Check DATABASE_URL is a real reachable Postgres connection string in your hosting platform's environment settings.");
  }
  process.exit(err.status || 1);
}
