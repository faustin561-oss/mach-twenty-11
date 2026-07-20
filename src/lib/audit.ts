import { prisma } from "./prisma";
import { toJsonFilters } from "./json-filters";

// Single place new audited actions get registered, rather than scattering
// ad hoc logging calls through routes. Covers Priority 6's "audit logging
// for admin and payment actions" requirement. `actorId` null means a
// system/webhook-initiated action (e.g. a Stripe webhook updating
// subscription status with no human in the loop).
//
// Never throws — an audit-log write failing should not block the actual
// action it's logging (e.g. a dispute resolution should still succeed
// even if the audit row fails to write); errors are swallowed and
// logged to the server console instead.
export async function auditLog(entry: {
  actorId?: string | null;
  action: string;
  targetType: string;
  targetId: string;
  metadata?: Record<string, any>;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: entry.actorId ?? null,
        action: entry.action,
        targetType: entry.targetType,
        targetId: entry.targetId,
        metadata: entry.metadata ? (toJsonFilters(entry.metadata) as any) : null,
      },
    });
  } catch (err) {
    console.error("[audit] failed to write audit log entry:", entry.action, err);
  }
}
