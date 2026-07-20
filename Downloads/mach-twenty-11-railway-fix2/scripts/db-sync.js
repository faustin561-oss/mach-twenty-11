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

const action = process.argv[2];
if (action !== "generate" && action !== "push") {
  console.error("Usage: node scripts/db-sync.js <generate|push>");
  process.exit(1);
}

const isProduction = process.env.NODE_ENV === "production";
const schema = isProduction ? "prisma/schema.production.prisma" : "prisma/schema.prisma";

console.log(`[db-sync] NODE_ENV=${process.env.NODE_ENV || "(unset)"} action=${action} -> using ${schema}`);

const args =
  action === "generate"
    ? ["generate", "--schema", schema]
    : ["db", "push", "--schema", schema, "--accept-data-loss", "--skip-generate"];

try {
  execFileSync("prisma", args, { stdio: "inherit" });
} catch (err) {
  console.error(`[db-sync] prisma ${action} failed against ${schema}.`);
  if (isProduction) {
    console.error("Check DATABASE_URL is a real reachable Postgres connection string in your hosting platform's environment settings.");
  }
  process.exit(err.status || 1);
}
