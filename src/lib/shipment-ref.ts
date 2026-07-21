// Human-readable shipment reference numbers — format MT11-{year}-{6-digit
// sequence}, e.g. MT11-2026-000001. Backed by Shipment.refSeq.
//
// This used to rely on Prisma's @default(autoincrement()) at the
// database level — which works fine on Postgres (native sequences) but
// is fundamentally unsupported on SQLite for a non-primary-key column
// (confirmed by a real Vercel build failure: P1012, "autoincrement()
// default value is used on a non-id field even though the datasource
// does not support this"). Rather than let dev and production diverge
// on this, refSeq is now assigned here, identically on both schemas, via
// an atomic transaction against the Counter table (see
// prisma/schema.prisma) — increment-then-read inside a single
// transaction is what makes this collision-free under concurrent
// shipment creation, not a database-specific feature.
import { prisma } from "./prisma";

const SHIPMENT_REF_COUNTER_NAME = "shipment_ref";

export async function nextShipmentRefSeq(): Promise<number> {
  const counter = await prisma.$transaction(async (tx) => {
    const updated = await tx.counter.upsert({
      where: { name: SHIPMENT_REF_COUNTER_NAME },
      update: { value: { increment: 1 } },
      create: { name: SHIPMENT_REF_COUNTER_NAME, value: 1 },
    });
    return updated;
  });
  return counter.value;
}

export function formatShipmentRef(refSeq: number, createdAt: Date): string {
  return `MT11-${createdAt.getFullYear()}-${String(refSeq).padStart(6, "0")}`;
}
