import "server-only";

import type { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/db/prisma";

export type OutreachAuditAction =
  | "mail_sent"
  | "batch_send"
  | "followup_sent"
  | "sequence_sent"
  | "pipeline_update"
  | "suppress"
  | "unsuppress"
  | "reminder_sent";

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

export async function listSuppressedLeads(branchId: string, limit = 50) {
  const rows = await prisma.mailOutreach.findMany({
    where: { doNotMail: true, business: { branchId } },
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
