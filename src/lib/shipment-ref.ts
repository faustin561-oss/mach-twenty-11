// Human-readable shipment reference numbers — format MT11-{year}-{6-digit
// sequence}, e.g. MT11-2026-000001. Backed by Shipment.refSeq, a
// database-level autoincrement column (see prisma/schema.prisma comment
// for why this is collision-free without a transaction/lock, unlike
// counting existing rows). The year in the reference is the shipment's
// creation year, not the current year, so historical references stay
// stable.
export function formatShipmentRef(refSeq: number, createdAt: Date): string {
  return `MT11-${createdAt.getFullYear()}-${String(refSeq).padStart(6, "0")}`;
}
