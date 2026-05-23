import "server-only";

import type { ScrapeBranchId } from "@/lib/bedrijven/branches";
import { isMailConfigured } from "@/lib/mail/email-config";
import { listDemoOutreachTemplates } from "@/lib/mail/list-demo-outreach";
import { resolveOutreachMailForBusiness } from "@/lib/mail/resolve-outreach-mail";
import { sendOutreachEmail } from "@/lib/mail/smtp-client";
import {
  assertMailOutreachDraft,
  markMailSent,
} from "@/lib/mail/storage";
import { logOutreachAudit } from "@/lib/outreach/outreach-audit";
import { getMailHealthReport } from "@/lib/mail/mail-health";
import {
  pickSubjectVariant,
  subjectVariantLabel,
  type OutreachSubjectAb,
} from "@/lib/mail/subject-variants";
import type { MailTemplatePreview } from "@/lib/mail/types";

export type BatchSendOptions = {
  branchId: ScrapeBranchId;
  locale?: string;
  limit?: number;
  delayMs?: number;
  maxPerDomain?: number;
  dryRun?: boolean;
  abTest?: boolean;
};

export type BatchSendItemResult = {
  businessId: string;
  businessName: string;
  email: string;
  status: "sent" | "skipped" | "failed";
  reason?: string;
  messageId?: string;
  subjectVariant?: string;
};

export type BatchSendResult = {
  branchId: ScrapeBranchId;
  dryRun: boolean;
  queued: number;
  sent: number;
  skipped: number;
  failed: number;
  items: BatchSendItemResult[];
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function emailDomain(email: string): string {
  const at = email.lastIndexOf("@");
  return at >= 0 ? email.slice(at + 1).toLowerCase() : email.toLowerCase();
}

function buildDraftBatch(
  previews: MailTemplatePreview[],
  limit: number,
  maxPerDomain: number,
): MailTemplatePreview[] {
  const drafts = previews
    .filter((t) => t.status === "draft" && t.email?.trim())
    .sort((a, b) => a.businessName.localeCompare(b.businessName, "nl"));

  const seenEmails = new Set<string>();
  const domainCounts = new Map<string, number>();
  const batch: MailTemplatePreview[] = [];

  for (const item of drafts) {
    const email = item.email!.trim().toLowerCase();
    if (seenEmails.has(email)) continue;

    const domain = emailDomain(email);
    const domainCount = domainCounts.get(domain) ?? 0;
    if (domainCount >= maxPerDomain) continue;

    seenEmails.add(email);
    domainCounts.set(domain, domainCount + 1);
    batch.push(item);
    if (batch.length >= limit) break;
  }

  return batch;
}

export async function runBatchOutreachSend(
  options: BatchSendOptions,
): Promise<BatchSendResult> {
  const locale = options.locale ?? "nl";
  const limit = Math.min(Math.max(options.limit ?? 50, 1), 100);
  const delayMs = Math.max(options.delayMs ?? 2500, 500);
  const maxPerDomain = Math.max(options.maxPerDomain ?? 2, 1);
  const dryRun = !!options.dryRun;
  const abTest = options.abTest !== false;

  if (!dryRun && !isMailConfigured()) {
    throw new Error("MAIL_NOT_CONFIGURED");
  }

  if (!dryRun) {
    const health = await getMailHealthReport(options.branchId);
    if (health.capRemaining <= 0) {
      throw new Error("DAILY_SEND_CAP_REACHED");
    }
  }

  const previews = await listDemoOutreachTemplates(locale, undefined, options.branchId);
  const batch = buildDraftBatch(previews, limit, maxPerDomain);

  const items: BatchSendItemResult[] = [];
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  if (dryRun) {
    for (let i = 0; i < batch.length; i++) {
      const item = batch[i]!;
      const ab: OutreachSubjectAb = abTest ? pickSubjectVariant(i) : "a";
      items.push({
        businessId: item.businessId,
        businessName: item.businessName,
        email: item.email!,
        status: "skipped",
        reason: "dry_run",
        subjectVariant: subjectVariantLabel(ab),
      });
      skipped++;
    }
    return {
      branchId: options.branchId,
      dryRun: true,
      queued: batch.length,
      sent: 0,
      skipped,
      failed: 0,
      items,
    };
  }

  for (let i = 0; i < batch.length; i++) {
    const item = batch[i]!;
    const ab: OutreachSubjectAb = abTest ? pickSubjectVariant(i) : "a";
    const variantKey = subjectVariantLabel(ab);

    try {
      await assertMailOutreachDraft(item.businessId);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (msg === "ALREADY_SENT") {
        items.push({
          businessId: item.businessId,
          businessName: item.businessName,
          email: item.email!,
          status: "skipped",
          reason: "already_sent",
        });
        skipped++;
        continue;
      }
      throw e;
    }

    const resolved = await resolveOutreachMailForBusiness(
      item.businessId,
      locale,
      undefined,
      item.email,
      item.businessName,
      { subjectAb: ab },
    );
    if (!resolved) {
      items.push({
        businessId: item.businessId,
        businessName: item.businessName,
        email: item.email!,
        status: "failed",
        reason: "not_demo_ready",
      });
      failed++;
      continue;
    }

    try {
      const mailResult = await sendOutreachEmail({
        to: item.email!,
        subject: resolved.subject,
        text: resolved.plainBody,
        html: resolved.htmlBody,
        attachments: resolved.attachments,
      });
      await markMailSent(item.businessId, item.email!, {
        branchId: options.branchId,
        subjectVariant: variantKey,
      });
      items.push({
        businessId: item.businessId,
        businessName: item.businessName,
        email: item.email!,
        status: "sent",
        messageId: mailResult.messageId,
        subjectVariant: variantKey,
      });
      sent++;
    } catch (e) {
      items.push({
        businessId: item.businessId,
        businessName: item.businessName,
        email: item.email!,
        status: "failed",
        reason: e instanceof Error ? e.message : "send_failed",
      });
      failed++;
    }

    if (i < batch.length - 1) await sleep(delayMs);
  }

  const result = {
    branchId: options.branchId,
    dryRun: false,
    queued: batch.length,
    sent,
    skipped,
    failed,
    items,
  };
  void logBatchAudit(options.branchId, result).catch(() => {});
  return result;
}

async function logBatchAudit(
  branchId: string,
  result: Pick<BatchSendResult, "sent" | "skipped" | "failed" | "dryRun">,
) {
  if (result.dryRun) return;
  await logOutreachAudit({
    action: "batch_send",
    branchId,
    metadata: {
      sent: result.sent,
      skipped: result.skipped,
      failed: result.failed,
    },
  });
}
