import "server-only";

import { prisma } from "@/lib/db/prisma";
import type { ScrapeBranchId } from "@/lib/bedrijven/branches";
import { findBusinessById } from "@/lib/bedrijven/load-all-businesses";
import {
  isLikelyGuessedEmail,
  normalizeEmail,
} from "@/lib/bedrijven/contact-utils";

export type OutreachMailKind = "initial" | "followup" | "sequence_nudge";

export type ReadinessCheck = {
  id: string;
  ok: boolean;
  label: string;
};

export type OutreachSendReadiness = {
  ready: boolean;
  businessId: string;
  branchId: ScrapeBranchId;
  kind: OutreachMailKind;
  checks: ReadinessCheck[];
  blockers: string[];
};

export async function assessOutreachSendReadiness(
  businessId: string,
  branchId: ScrapeBranchId,
  kind: OutreachMailKind = "initial",
): Promise<OutreachSendReadiness> {
  const checks: ReadinessCheck[] = [];
  const blockers: string[] = [];

  const push = (id: string, ok: boolean, label: string, blocker?: string) => {
    checks.push({ id, ok, label });
    if (!ok && blocker) blockers.push(blocker);
  };

  const [business, mailRow] = await Promise.all([
    findBusinessById(businessId),
    prisma.mailOutreach.findUnique({ where: { businessId } }),
  ]);

  const email =
    normalizeEmail(mailRow?.recipientEmail ?? undefined) ??
    normalizeEmail(business?.email ?? undefined) ??
    undefined;

  if (kind === "initial" || kind === "followup") {
    push(
      "branch",
      business?.branchId === branchId,
      `Juiste verticale (${branchId})`,
      "WRONG_BRANCH",
    );
    push(
      "email",
      !!email && !isLikelyGuessedEmail(email, business?.website),
      "Geverifieerd e-mailadres (geen geraden info@)",
      "EMAIL_NOT_VERIFIED",
    );
    push(
      "mail_record",
      !!mailRow,
      "Mail-concept in database",
      "MAIL_RECORD_NOT_FOUND",
    );
  }

  if (mailRow) {
    push(
      "not_suppressed",
      !mailRow.doNotMail,
      "Niet op suppressielijst",
      "DO_NOT_MAIL",
    );
  }

  if (kind === "initial") {
    push(
      "mail_draft",
      mailRow?.status === "draft",
      "Mailstatus = concept",
      mailRow ? "ALREADY_SENT" : "MAIL_RECORD_NOT_FOUND",
    );
  }

  if (kind === "followup") {
    push(
      "mail_sent",
      mailRow?.status === "sent" && !!mailRow.sentAt,
      "Eerste mail verstuurd",
      "FOLLOWUP_REQUIRES_SENT",
    );
    push(
      "no_followup_yet",
      !mailRow?.followupSentAt,
      "Nog geen follow-up verstuurd",
      "FOLLOWUP_ALREADY_SENT",
    );
    push(
      "not_booked",
      mailRow?.status !== "booked",
      "Nog niet geboekt",
      "ALREADY_BOOKED",
    );
  }

  if (kind === "sequence_nudge") {
    push(
      "mail_sent",
      mailRow?.status === "sent" && !!mailRow.sentAt,
      "Eerste mail verstuurd",
      "SEQUENCE_REQUIRES_SENT",
    );
    push(
      "not_booked",
      mailRow?.status !== "booked",
      "Nog niet geboekt",
      "ALREADY_BOOKED",
    );
  }

  return {
    ready: blockers.length === 0,
    businessId,
    branchId,
    kind,
    checks,
    blockers,
  };
}

export async function assertOutreachSendReady(
  businessId: string,
  branchId: ScrapeBranchId,
  kind: OutreachMailKind = "initial",
): Promise<OutreachSendReadiness> {
  const result = await assessOutreachSendReadiness(businessId, branchId, kind);
  if (!result.ready) {
    throw new Error(result.blockers[0] ?? "OUTREACH_NOT_READY");
  }
  return result;
}

/** @deprecated Gebruik sendReady op lijst-items uit listDemoOutreachTemplates. */
export async function countSendReadyDrafts(
  branchId: ScrapeBranchId,
  locale: string,
): Promise<number> {
  const { listDemoOutreachTemplates } = await import("@/lib/mail/list-demo-outreach");
  const previews = await listDemoOutreachTemplates(locale, undefined, branchId);
  return previews.filter((p) => p.status === "draft" && p.sendReady).length;
}
