import { NextResponse } from "next/server";

// Shared API error handling — increment 7. Distinguishes "database isn't
// configured yet" (a setup problem, expected during early deploys/demos)
// from a genuine bug, so routes never leak a raw 500 stack trace for the
// common case of a missing/unreachable DATABASE_URL.
function isDbUnavailableError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const name = (err as any).constructor?.name || "";
  const message = (err as any).message || "";
  return (
    name === "PrismaClientInitializationError" ||
    name === "PrismaClientKnownRequestError" && /P1001|P1003|P1010/.test((err as any).code || "") ||
    /Can't reach database server|DATABASE_URL|environment variable not found/i.test(message)
  );
}

export function handleApiError(err: unknown): NextResponse {
  if (isDbUnavailableError(err)) {
    return NextResponse.json(
      {
        error: "Database not configured or unreachable.",
        setup: "Set DATABASE_URL in .env and run `npm run db:push` (or `db:migrate`). See README.md.",
      },
      { status: 503 }
    );
  }
  // Genuine bug — log server-side for debugging, don't leak internals to the client.
  console.error(err);
  return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
}
