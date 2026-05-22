import { randomBytes } from "crypto";
import { prisma } from "@/lib/db/prisma";
import { mailOutreachToRecord } from "@/lib/db/mappers";
import { ensureBusinessStub } from "@/lib/bedrijven/business-db";
import type { MailLeadStatus, MailOutreachRecord } from "./types";

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
): Promise<MailOutreachRecord> {
  await ensureMailRecord(businessId, recipientEmail);
  const updated = await prisma.mailOutreach.updateMany({
    where: { businessId, status: "draft" },
    data: {
      status: "sent",
      sentAt: new Date(),
      recipientEmail: recipientEmail?.trim() || undefined,
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
  return mailOutreachToRecord(row);
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
    },
  });
  return mailOutreachToRecord(row);
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
