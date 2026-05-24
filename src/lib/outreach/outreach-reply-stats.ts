import "server-only";

import { normalizeEmail } from "@/lib/bedrijven/contact-utils";
import {
  ADMIN_VERTICAL_ALL,
  type AdminVerticalScope,
  outreachBranchesForScope,
} from "@/lib/bedrijven/outreach-branches";
import { loadInboxCache } from "@/lib/mail/inbox-storage";
import { filterInboxForDisplay } from "@/lib/mail/inbox-bounce-filter";
import { listDemoOutreachTemplates } from "@/lib/mail/list-demo-outreach";
import type { MailTemplatePreview } from "@/lib/mail/types";

export type OutreachReplyStats = {
  branchId: AdminVerticalScope;
  sent: number;
  replies: number;
  replyRate: number;
  medianResponseHours: number | null;
  updatedAt: string;
};

function extractEmailFromHeader(from: string): string | null {
  const match = from.match(/<([^>]+)>/);
  const raw = (match?.[1] ?? from).trim().toLowerCase();
  if (!raw.includes("@")) return null;
  return normalizeEmail(raw) ?? null;
}

async function loadPreviewsForScope(
  scope: AdminVerticalScope,
  locale: string,
): Promise<MailTemplatePreview[]> {
  const branches = outreachBranchesForScope(scope);
  const batches = await Promise.all(
    branches.map((b) => listDemoOutreachTemplates(locale, undefined, b)),
  );
  if (scope === ADMIN_VERTICAL_ALL) {
    const byBusiness = new Map<string, MailTemplatePreview>();
    for (const batch of batches) {
      for (const p of batch) byBusiness.set(p.businessId, p);
    }
    return [...byBusiness.values()];
  }
  return batches[0] ?? [];
}

export async function getOutreachReplyStats(
  scope: AdminVerticalScope,
  locale = "nl",
): Promise<OutreachReplyStats> {
  const previews = await loadPreviewsForScope(scope, locale);
  const sent = previews.filter(
    (p) => p.status === "sent" || p.status === "booked",
  ).length;

  const emailToSentAt = new Map<string, Date>();
  for (const p of previews) {
    if (p.status !== "sent" && p.status !== "booked") continue;
    const em = p.email ? normalizeEmail(p.email) : null;
    if (!em || !p.sentAt) continue;
    emailToSentAt.set(em, new Date(p.sentAt));
  }

  const inbox = filterInboxForDisplay((await loadInboxCache()).messages);
  const repliedEmails = new Set<string>();
  const responseHours: number[] = [];

  for (const msg of inbox) {
    if (msg.direction !== "inbound") continue;
    const fromEmail = extractEmailFromHeader(msg.from);
    if (!fromEmail || !emailToSentAt.has(fromEmail)) continue;
    repliedEmails.add(fromEmail);
    const sentAt = emailToSentAt.get(fromEmail)!;
    const replyAt = new Date(msg.date);
    if (replyAt > sentAt) {
      responseHours.push((replyAt.getTime() - sentAt.getTime()) / 3600000);
    }
  }

  const replies = repliedEmails.size;
  const replyRate = sent > 0 ? Math.round((replies / sent) * 1000) / 10 : 0;
  const medianResponseHours =
    responseHours.length > 0
      ? Math.round(
          responseHours.sort((a, b) => a - b)[
            Math.floor(responseHours.length / 2)
          ]! * 10,
        ) / 10
      : null;

  return {
    branchId: scope,
    sent,
    replies,
    replyRate,
    medianResponseHours,
    updatedAt: new Date().toISOString(),
  };
}
