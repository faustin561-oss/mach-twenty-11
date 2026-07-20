// Helpers for CarrierProfile.equipmentTypes/operatingAreas and
// Shipment.photos — fields whose actual database representation differs
// between the two schemas this project maintains:
//   - prisma/schema.prisma (SQLite, local dev): these are JSON-encoded
//     String columns (SQLite has no native array type on the Prisma
//     version this project is pinned to), so Prisma hands back a string
//     that needs JSON.parse.
//   - prisma/schema.production.prisma (Postgres): these are native
//     String[] columns, so Prisma hands back a real array directly —
//     calling JSON.parse on that would be wrong.
//
// Rather than scatter `if (isProduction)` checks through every API route
// that touches these fields, both helpers check the actual runtime shape
// of the value and do the right thing either way. This means the same
// call sites work unmodified against either schema. The one thing this
// can't do is get real compile-time type safety from either generated
// Prisma Client — see the risk note atop schema.production.prisma.
export function toJsonArray(arr: string[]): string[] | string {
  if (process.env.NODE_ENV === "production") {
    // Native Postgres String[] column — pass the array through directly.
    return arr ?? [];
  }
  // SQLite — JSON-encode into the String column.
  return JSON.stringify(arr ?? []);
}

export function fromJsonArray(value: string[] | string | null | undefined): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value; // already a real array (Postgres)
  try {
    const parsed = JSON.parse(value); // JSON-encoded string (SQLite)
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
