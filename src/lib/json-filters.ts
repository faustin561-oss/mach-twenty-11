// Helper for SavedSearch.filters — same dual-shape situation as
// src/lib/json-array.ts: a JSON-encoded String on SQLite
// (prisma/schema.prisma), a native Json column on Postgres
// (prisma/schema.production.prisma, which hands back an already-parsed
// object directly). Both functions check the actual runtime shape
// rather than assuming one or the other.
export function toJsonFilters(filters: Record<string, any>): Record<string, any> | string {
  if (process.env.NODE_ENV === "production") {
    // Native Postgres Json column — pass the object through directly.
    return filters ?? {};
  }
  // SQLite — JSON-encode into the String column.
  return JSON.stringify(filters ?? {});
}

export function fromJsonFilters(value: any): Record<string, any> {
  if (!value) return {};
  if (typeof value === "object") return value; // already parsed (Postgres)
  try {
    const parsed = JSON.parse(value); // JSON-encoded string (SQLite)
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}
