// Server Component version of the DB-safety net in src/lib/api-error.ts.
// Wrap any direct `prisma.x.y(...)` call in a page with safeDbCall so a
// missing/unreachable DATABASE_URL renders a setup notice instead of
// Next.js's default error boundary (or a blank page).
export async function safeDbCall<T>(fn: () => Promise<T>, fallback: T): Promise<{ data: T; dbUnavailable: boolean }> {
  try {
    const data = await fn();
    return { data, dbUnavailable: false };
  } catch (err: any) {
    const name = err?.constructor?.name || "";
    const message = err?.message || "";
    const isDbError =
      name === "PrismaClientInitializationError" ||
      /Can't reach database server|DATABASE_URL|environment variable not found/i.test(message);
    if (isDbError) {
      return { data: fallback, dbUnavailable: true };
    }
    throw err; // real bugs still surface — only DB-not-configured is swallowed
  }
}
