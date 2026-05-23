import { randomBytes } from "crypto";
import { prisma } from "@/lib/db/prisma";
import { mailOutreachToRecord } from "@/lib/db/mappers";
import { ensureBusinessStub } from "@/lib/bedrijven/business-db";
import { recordAnalyticsEvent } from "@/lib/analytics-events";
import { buildSendBatchId } from "@/lib/mail/send-batch";
import type { MailLeadStatus, MailOutreachRecord, OutreachPipelineStatus } from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;

function addDays(from: Date, days: number): Date {
  return new Date(from.getTime() + days * DAY_MS);
}

function suppressOutreachData(): {
  doNotMail: boolean;
  sequenceNextAt: null;
} {
  return { doNotMail: true, sequenceNextAt: null };
}

export function createMailToken(): string {
  return randomBytes(24).toString("base64url");
}

export async function getRecordByBusinessId(
  businessId: string,
): Promise<MailOutreachRecord | null> {
  const row = await prisma.mailOutreach.findUnique({
    where: { businessId },
  });
  return row ? mailOutreachToRecord(row) : null;
}

export async function getRecordByToken(
  token: string,
): Promise<MailOutreachRecord | null> {
  const row = await prisma.mailOutreach.findUnique({
    where: { token },
  });
  return row ? mailOutreachToRecord(row) : null;
}

export async function ensureMailRecord(
  businessId: string,
  recipientEmail?: string,
): Promise<MailOutreachRecord> {
  const existing = await prisma.mailOutreach.findUnique({
    where: { businessId },
  });
  const now = new Date();

  if (!existing) {
    await ensureBusinessStub(businessId, { email: recipientEmail });
    const row = await prisma.mailOutreach.create({
      data: {
        businessId,
        token: createMailToken(),
        status: "draft",
        recipientEmail: recipientEmail?.trim() || null,
      },
    });
    return mailOutreachToRecord(row);
  }

  if (
    recipientEmail?.trim() &&
    existing.recipientEmail !== recipientEmail.trim()
  ) {
    const row = await prisma.mailOutreach.update({
      where: { businessId },
      data: { recipientEmail: recipientEmail.trim() },
    });
    return mailOutreachToRecord(row);
  }

  return mailOutreachToRecord(existing);
}

/** Alleen concept (draft) mag verstuurd worden — voorkomt dubbele mail. */
export async function assertMailOutreachDraft(
  businessId: string,
): Promise<MailOutreachRecord> {
  const row = await prisma.mailOutreach.findUnique({
    where: { businessId },
  });
  if (!row) {
    throw new Error("MAIL_RECORD_NOT_FOUND");
  }
  if (row.status !== "draft") {
    throw new Error("ALREADY_SENT");
  }
  return mailOutreachToRecord(row);
}

export async function markMailSent(
  businessId: string,
  recipientEmail?: string,
  options?: { branchId?: string; subjectVariant?: string },
): Promise<MailOutreachRecord> {
  await ensureMailRecord(businessId, recipientEmail);
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { branchId: true },
  });
  const branchId = options?.branchId ?? business?.branchId ?? "makelaardij";
  const sendBatch = buildSendBatchId(branchId);
  const sentAt = new Date();
  const updated = await prisma.mailOutreach.updateMany({
    where: { businessId, status: "draft" },
    data: {
      status: "sent",
      sentAt,
      recipientEmail: recipientEmail?.trim() || undefined,
      sendBatch,
      subjectVariant: options?.subjectVariant ?? "default",
      pipelineStatus: "contacted",
      sequenceStep: 1,
      sequenceNextAt: addDays(sentAt, 3),
    },
  });
  if (updated.count === 0) {
    const row = await prisma.mailOutreach.findUnique({
      where: { businessId },
    });
    if (row?.status === "sent" || row?.status === "booked") {
      throw new Error("ALREADY_SENT");
    }
    throw new Error("MAIL_SEND_STATE_CONFLICT");
  }
  const row = await prisma.mailOutreach.findUniqueOrThrow({
    where: { businessId },
  });
  void recordAnalyticsEvent({
    eventName: "mail_sent",
    businessId,
    mailToken: row.token,
    metadata: { sendBatch, subjectVariant: row.subjectVariant },
  }).catch(() => {});
  return mailOutreachToRecord(row);
}

/** Follow-up: alleen na eerste mail (sent), nog geen follow-up, niet geboekt. */
export async function assertMailFollowupEligible(
  businessId: string,
): Promise<MailOutreachRecord> {
  const row = await prisma.mailOutreach.findUnique({
    where: { businessId },
  });
  if (!row) throw new Error("MAIL_RECORD_NOT_FOUND");
  if (row.status === "booked") throw new Error("ALREADY_BOOKED");
  if (row.status !== "sent") throw new Error("FOLLOWUP_REQUIRES_SENT");
  if (row.followupSentAt) throw new Error("FOLLOWUP_ALREADY_SENT");
  if (!row.sentAt) throw new Error("FOLLOWUP_REQUIRES_SENT");
  return mailOutreachToRecord(row);
}

export async function markMailFollowupSent(
  businessId: string,
): Promise<MailOutreachRecord> {
  const existing = await prisma.mailOutreach.findUnique({
    where: { businessId },
    select: { sentAt: true },
  });
  const followupAt = new Date();
  const sequenceNextAt =
    existing?.sentAt != null ? addDays(existing.sentAt, 7) : addDays(followupAt, 4);

  const updated = await prisma.mailOutreach.updateMany({
    where: {
      businessId,
      status: "sent",
      followupSentAt: null,
    },
    data: {
      followupSentAt: followupAt,
      sequenceStep: 2,
      sequenceNextAt,
    },
  });
  if (updated.count === 0) {
    const row = await prisma.mailOutreach.findUnique({
      where: { businessId },
    });
    if (row?.followupSentAt) throw new Error("FOLLOWUP_ALREADY_SENT");
    if (row?.status === "booked") throw new Error("ALREADY_BOOKED");
    throw new Error("FOLLOWUP_SEND_STATE_CONFLICT");
  }
  const row = await prisma.mailOutreach.findUniqueOrThrow({
    where: { businessId },
  });
  void recordAnalyticsEvent({
    eventName: "followup_sent",
    businessId,
    mailToken: row.token,
  }).catch(() => {});
  return mailOutreachToRecord(row);
}

export async function listFollowupCandidates(options?: {
  minDaysSinceSent?: number;
}): Promise<MailOutreachRecord[]> {
  const minDays = options?.minDaysSinceSent ?? 3;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - minDays);

  const rows = await prisma.mailOutreach.findMany({
    where: {
      status: "sent",
      followupSentAt: null,
      sentAt: { lte: cutoff },
    },
    orderBy: { sentAt: "asc" },
  });
  return rows.map(mailOutreachToRecord);
}

export async function markMailBooked(
  businessId: string,
  appointmentId: string,
): Promise<MailOutreachRecord> {
  await ensureMailRecord(businessId);
  const row = await prisma.mailOutreach.update({
    where: { businessId },
    data: {
      status: "booked",
      bookedAt: new Date(),
      appointmentId,
      pipelineStatus: "meeting",
      ...suppressOutreachData(),
    },
  });
  return mailOutreachToRecord(row);
}

export async function updateMailPipelineStatus(
  businessId: string,
  pipelineStatus: OutreachPipelineStatus,
): Promise<MailOutreachRecord> {
  const suppress =
    pipelineStatus === "won" || pipelineStatus === "lost"
      ? suppressOutreachData()
      : {};
  const row = await prisma.mailOutreach.update({
    where: { businessId },
    data: { pipelineStatus, ...suppress },
  });
  return mailOutreachToRecord(row);
}

export async function setMailDoNotMail(
  businessId: string,
  doNotMail: boolean,
): Promise<MailOutreachRecord> {
  const row = await prisma.mailOutreach.update({
    where: { businessId },
    data: {
      doNotMail,
      sequenceNextAt: doNotMail ? null : undefined,
    },
  });
  return mailOutreachToRecord(row);
}

export async function advanceMailSequence(
  businessId: string,
  step: number,
  sequenceNextAt: Date | null,
): Promise<void> {
  await prisma.mailOutreach.update({
    where: { businessId },
    data: { sequenceStep: step, sequenceNextAt },
  });
}

export async function listMailRecords(): Promise<MailOutreachRecord[]> {
  const rows = await prisma.mailOutreach.findMany({
    orderBy: { updatedAt: "desc" },
  });
  return rows.map(mailOutreachToRecord);
}

export async function ensureMailRecordsBatch(
  items: { businessId: string; recipientEmail: string }[],
): Promise<Map<string, MailOutreachRecord>> {
  const out = new Map<string, MailOutreachRecord>();
  for (const item of items) {
    const rec = await ensureMailRecord(item.businessId, item.recipientEmail);
    out.set(item.businessId, rec);
  }
  return out;
}

export async function getMailRecordsByStatus(
  status: MailLeadStatus,
): Promise<MailOutreachRecord[]> {
  const rows = await prisma.mailOutreach.findMany({
    where: { status },
    orderBy: { updatedAt: "desc" },
  });
  return rows.map(mailOutreachToRecord);
}
