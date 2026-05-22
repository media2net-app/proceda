import { DEFAULT_BRANCH, type ScrapeBranchId } from "@/lib/bedrijven/branches";
import { loadAllBusinesses } from "@/lib/bedrijven/load-all-businesses";
import type { Bedrijf } from "@/lib/bedrijven/types";
import { isMailConfigured } from "./email-config";
import { loadInboxCache, inboxStats } from "./inbox-storage";
import { summarizeDemoClicks } from "./demo-click-stats";
import { listDemoOutreachTemplates } from "./list-demo-outreach";
import type { MailKpiStats, MailTemplatePreview } from "./types";

export { PROCEDA_PUBLIC_APP_URL, resolveAppBaseUrl } from "./app-url";

export async function getMailKpiStats(
  locale: string = "nl",
  request?: Request,
  branchId: ScrapeBranchId = DEFAULT_BRANCH,
): Promise<MailKpiStats> {
  const previews = await listMailTemplates(locale, request, branchId);
  let sent = 0;
  let booked = 0;
  let draft = 0;

  for (const p of previews) {
    if (p.status === "sent") sent++;
    else if (p.status === "booked") {
      sent++;
      booked++;
    } else draft++;
  }

  const conversionSentToBooked =
    sent > 0 ? Math.round((booked / sent) * 100) : 0;

  const clickByToken = new Map(
    previews
      .filter((p) => p.demoVisited && p.token)
      .map((p) => [
        p.token,
        {
          clickCount: p.demoClickCount ?? 0,
          sessionCount: p.demoSessionCount ?? 0,
          firstClickedAt: p.demoFirstClickAt ?? null,
          lastClickedAt: p.demoLastClickAt ?? null,
        },
      ]),
  );
  const { clicked: demoClicked, clickRate: demoClickRate } =
    summarizeDemoClicks(previews, clickByToken);

  const followupReady = previews.filter(
    (p) =>
      p.status === "sent" &&
      p.demoVisited &&
      !p.followupSentAt &&
      p.followupHtmlBody,
  ).length;

  const inbox = await loadInboxCache();
  const inStats = inboxStats(inbox.messages);

  return {
    /** Concept / te versturen (niet de hele demo-klaare pool). */
    readyToSend: draft,
    demoReadyPool: previews.length,
    sent,
    booked,
    conversionSentToBooked,
    demoClicked,
    demoClickRate,
    followupReady,
    draft,
    inboxTotal: inStats.total,
    inboxInbound: inStats.inbound,
    inboxUnread: inStats.unread,
    mailConfigured: isMailConfigured(),
    inboxSyncedAt: inbox.syncedAt,
    updatedAt: new Date().toISOString(),
  };
}

export async function listMailTemplates(
  locale: string,
  request?: Request,
  branchId: ScrapeBranchId = DEFAULT_BRANCH,
): Promise<MailTemplatePreview[]> {
  return listDemoOutreachTemplates(locale, request, branchId);
}

export async function getDemoLeadByToken(
  token: string,
): Promise<{ business: Bedrijf; record: { token: string } } | null> {
  const { getRecordByToken } = await import("./storage");
  const record = await getRecordByToken(token);
  if (!record) return null;

  const businesses = await loadAllBusinesses();
  const business = businesses.find((b) => b.id === record.businessId);
  if (!business) return null;

  return { business, record: { token: record.token } };
}
