import "server-only";

import { normalizeEmail } from "@/lib/bedrijven/contact-utils";
import { loadAllBusinesses } from "@/lib/bedrijven/load-all-businesses";
import { loadInboxCache } from "@/lib/mail/inbox-storage";
import { listDemoOutreachTemplates } from "@/lib/mail/list-demo-outreach";
import type { ScrapeBranchId } from "@/lib/bedrijven/branches";

export type OutreachReplyStats = {
  branchId: ScrapeBranchId;
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

export async function getOutreachReplyStats(
  branchId: ScrapeBranchId,
  locale = "nl",
): Promise<OutreachReplyStats> {
  const previews = await listDemoOutreachTemplates(locale, undefined, branchId);
  const sent = previews.filter(
    (p) => p.status === "sent" || p.status === "booked",
  ).length;

  const businesses = await loadAllBusinesses(branchId);
  const emailToSentAt = new Map<string, Date>();
  for (const p of previews) {
    if (p.status !== "sent" && p.status !== "booked") continue;
    const em = p.email ? normalizeEmail(p.email) : null;
    if (!em || !p.sentAt) continue;
    emailToSentAt.set(em, new Date(p.sentAt));
  }

  const inbox = await loadInboxCache();
  const repliedEmails = new Set<string>();
  const responseHours: number[] = [];

  for (const msg of inbox.messages) {
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
    branchId,
    sent,
    replies,
    replyRate,
    medianResponseHours,
    updatedAt: new Date().toISOString(),
  };
}
