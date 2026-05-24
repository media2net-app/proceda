import "server-only";

import type { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/db/prisma";
import {
  ADMIN_VERTICAL_ALL,
  OUTREACH_BRANCH_IDS,
  type AdminVerticalScope,
} from "@/lib/bedrijven/outreach-branches";

export type OutreachAuditAction =
  | "mail_sent"
  | "batch_send"
  | "followup_sent"
  | "sequence_sent"
  | "pipeline_update"
  | "suppress"
  | "unsuppress"
  | "reminder_sent"
  | "autopilot_start"
  | "autopilot_stop"
  | "autopilot_switch"
  | "autopilot_tick";

export async function logOutreachAudit(input: {
  action: OutreachAuditAction;
  businessId?: string;
  branchId?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await prisma.outreachAuditLog.create({
    data: {
      action: input.action,
      businessId: input.businessId ?? null,
      branchId: input.branchId ?? null,
      metadata: (input.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
    },
  });
}

export async function listOutreachAuditLog(limit = 50) {
  const rows = await prisma.outreachAuditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.map((r) => ({
    id: r.id,
    action: r.action,
    businessId: r.businessId ?? undefined,
    branchId: r.branchId ?? undefined,
    metadata: r.metadata,
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function listSuppressedLeads(
  scope: AdminVerticalScope,
  limit = 50,
) {
  const rows = await prisma.mailOutreach.findMany({
    where: {
      doNotMail: true,
      business:
        scope === ADMIN_VERTICAL_ALL
          ? { branchId: { in: [...OUTREACH_BRANCH_IDS] } }
          : { branchId: scope },
    },
    include: { business: { select: { name: true, email: true } } },
    orderBy: { updatedAt: "desc" },
    take: limit,
  });
  return rows.map((r) => ({
    businessId: r.businessId,
    businessName: r.business.name,
    email: r.recipientEmail ?? r.business.email ?? undefined,
    pipelineStatus: r.pipelineStatus,
    updatedAt: r.updatedAt.toISOString(),
  }));
}
