import "server-only";

import { prisma } from "@/lib/db/prisma";
import { isMailConfigured } from "@/lib/mail/email-config";
import { resolveFollowupMailForBusiness } from "@/lib/mail/resolve-followup-mail";
import { buildDemoBookingUrl } from "@/lib/mail/templates";
import { resolveAppBaseUrl } from "@/lib/mail/app-url";
import { sendOutreachEmail } from "@/lib/mail/smtp-client";
import {
  advanceMailSequence,
  markMailFollowupSent,
  setMailDoNotMail,
} from "@/lib/mail/storage";
import { buildSequenceNudgeMail } from "@/lib/mail/sequence-nudge-mail";
import { logOutreachAudit } from "@/lib/outreach/outreach-audit";
import type { ScrapeBranchId } from "@/lib/bedrijven/branches";

export type SequenceDueItem = {
  businessId: string;
  businessName: string;
  email: string;
  sequenceStep: number;
  sequenceNextAt: string;
  sentAt?: string;
};

export type SequenceRunResult = {
  processed: number;
  sent: number;
  skipped: number;
  failed: number;
  items: { businessId: string; status: string; reason?: string }[];
};

const DAY_MS = 24 * 60 * 60 * 1000;

export async function listDueSequenceItems(
  branchId: ScrapeBranchId,
  limit = 50,
): Promise<SequenceDueItem[]> {
  const now = new Date();
  const rows = await prisma.mailOutreach.findMany({
    where: {
      doNotMail: false,
      status: "sent",
      sequenceNextAt: { lte: now },
      business: { branchId },
    },
    include: { business: { select: { name: true, email: true } } },
    orderBy: { sequenceNextAt: "asc" },
    take: limit,
  });

  return rows
    .filter((r) => r.recipientEmail?.trim() || r.business.email?.trim())
    .map((r) => ({
      businessId: r.businessId,
      businessName: r.business.name,
      email: (r.recipientEmail ?? r.business.email)!.trim(),
      sequenceStep: r.sequenceStep,
      sequenceNextAt: r.sequenceNextAt!.toISOString(),
      sentAt: r.sentAt?.toISOString(),
    }));
}

export async function runDueOutreachSequences(
  branchId: ScrapeBranchId,
  locale = "nl",
  dryRun = false,
): Promise<SequenceRunResult> {
  const due = await listDueSequenceItems(branchId, 30);
  const items: SequenceRunResult["items"] = [];
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  if (dryRun) {
    for (const item of due) {
      items.push({ businessId: item.businessId, status: "skipped", reason: "dry_run" });
      skipped++;
    }
    return { processed: due.length, sent: 0, skipped, failed, items };
  }

  if (!isMailConfigured()) {
    throw new Error("MAIL_NOT_CONFIGURED");
  }

  for (const item of due) {
    const row = await prisma.mailOutreach.findUnique({
      where: { businessId: item.businessId },
    });
    if (!row || row.doNotMail || row.status !== "sent") {
      items.push({ businessId: item.businessId, status: "skipped", reason: "not_eligible" });
      skipped++;
      continue;
    }

    try {
      if (row.sequenceStep === 1) {
        const resolved = await resolveFollowupMailForBusiness(
          item.businessId,
          locale,
        );
        if (!resolved) {
          await advanceMailSequence(
            item.businessId,
            2,
            row.sentAt ? new Date(row.sentAt.getTime() + 7 * DAY_MS) : null,
          );
          items.push({
            businessId: item.businessId,
            status: "skipped",
            reason: "no_followup_template",
          });
          skipped++;
          continue;
        }
        await sendOutreachEmail({
          to: item.email,
          subject: resolved.subject,
          text: resolved.plainBody,
          html: resolved.htmlBody,
          attachments: resolved.attachments,
        });
        await markMailFollowupSent(item.businessId);
        void logOutreachAudit({
          action: "sequence_sent",
          businessId: item.businessId,
          branchId,
          metadata: { step: "day3_followup" },
        }).catch(() => {});
        items.push({ businessId: item.businessId, status: "sent", reason: "day3_followup" });
        sent++;
      } else if (row.sequenceStep === 2 || row.sequenceStep === 3) {
        const dayLabel = row.sequenceStep === 2 ? "7" : "14";
        const demoUrl = buildDemoBookingUrl(
          resolveAppBaseUrl(),
          locale,
          row.token,
        );
        const mail = buildSequenceNudgeMail({
          businessName: item.businessName,
          demoUrl,
          dayLabel,
        });
        await sendOutreachEmail({
          to: item.email,
          subject: mail.subject,
          text: mail.plainBody,
          html: mail.htmlBody,
        });
        if (row.sequenceStep === 2) {
          await advanceMailSequence(
            item.businessId,
            3,
            row.sentAt ? new Date(row.sentAt.getTime() + 14 * DAY_MS) : null,
          );
        } else {
          await advanceMailSequence(item.businessId, 4, null);
        }
        void logOutreachAudit({
          action: "sequence_sent",
          businessId: item.businessId,
          branchId,
          metadata: { step: `day${dayLabel}_nudge` },
        }).catch(() => {});
        items.push({
          businessId: item.businessId,
          status: "sent",
          reason: `day${dayLabel}_nudge`,
        });
        sent++;
      } else {
        await advanceMailSequence(item.businessId, row.sequenceStep, null);
        items.push({ businessId: item.businessId, status: "skipped", reason: "sequence_done" });
        skipped++;
      }
    } catch (e) {
      items.push({
        businessId: item.businessId,
        status: "failed",
        reason: e instanceof Error ? e.message : "send_failed",
      });
      failed++;
    }
  }

  return { processed: due.length, sent, skipped, failed, items };
}

export async function suppressLeadFromMail(businessId: string): Promise<void> {
  await setMailDoNotMail(businessId, true);
}
