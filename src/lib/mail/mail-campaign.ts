import { loadAllBusinesses } from "@/lib/bedrijven/load-all-businesses";
import type { Bedrijf } from "@/lib/bedrijven/types";
import { isMailConfigured } from "./email-config";
import { loadInboxCache, inboxStats } from "./inbox-storage";
import { summarizeDemoClicks } from "./demo-click-stats";
import { listDemoOutreachTemplates } from "./list-demo-outreach";
import type { MailKpiStats, MailTemplatePreview } from "./types";

/** Publieke app-URL voor outreach-mail en afspraak-CTA's (nooit localhost in productie-mails). */
export const PROCEDA_PUBLIC_APP_URL = "https://www.proceda.nl";

function normalizeBaseUrl(url: string): string {
  return url.trim().replace(/\/$/, "");
}

function readEnvAppUrl(): string | null {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.APP_URL?.trim() ||
    process.env.BASE_URL?.trim() ||
    process.env.VERCEL_URL?.trim();
  if (!raw) return null;
  const url = raw.includes("://") ? raw : `https://${raw}`;
  return normalizeBaseUrl(url);
}

function isLocalHost(host: string): boolean {
  const h = host.split(":")[0]?.toLowerCase() ?? "";
  return h === "localhost" || h === "127.0.0.1" || h.endsWith(".local");
}

export function resolveAppBaseUrl(request?: Request): string {
  const fromEnv = readEnvAppUrl();
  if (fromEnv) return fromEnv;

  if (request) {
    const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    const proto = request.headers.get("x-forwarded-proto") ?? "https";
    if (host && !isLocalHost(host)) {
      return normalizeBaseUrl(`${proto}://${host}`);
    }
  }

  return PROCEDA_PUBLIC_APP_URL;
}

export async function getMailKpiStats(
  locale: string = "nl",
  request?: Request,
): Promise<MailKpiStats> {
  const previews = await listMailTemplates(locale, request);
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

  const inbox = await loadInboxCache();
  const inStats = inboxStats(inbox.messages);

  return {
    readyToSend: previews.length,
    sent,
    booked,
    conversionSentToBooked,
    demoClicked,
    demoClickRate,
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
): Promise<MailTemplatePreview[]> {
  return listDemoOutreachTemplates(locale, request);
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
