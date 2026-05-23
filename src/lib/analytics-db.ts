import { prisma } from "@/lib/db/prisma";
import { funnelLabelFromPath } from "@/lib/analytics-funnel";
import {
  pathToAnalyticsEvent,
  recordAnalyticsEvent,
} from "@/lib/analytics-events";
import type { RequestGeo } from "@/lib/analytics-geo";

export const ANALYTICS_ACTIVE_MS = 2 * 60 * 1000;

export type AnalyticsPingInput = {
  visitorId: string;
  sessionId: string;
  path: string;
  referrer: string | null;
  userAgent: string | null;
  geo: RequestGeo;
  bookingActive?: boolean;
  /** Van demo-bookingpagina na succesvolle token-load */
  leadName?: string | null;
  mailToken?: string | null;
};

export async function recordAnalyticsPing(
  input: AnalyticsPingInput,
): Promise<void> {
  const now = new Date();
  const funnelLabel = funnelLabelFromPath(input.path);
  const bookingActive = input.bookingActive === true;
  const leadName = input.leadName?.trim().slice(0, 200) || null;
  const mailToken = input.mailToken?.trim().slice(0, 80) || null;

  const existing = await prisma.analyticsSession.findUnique({
    where: { sessionId: input.sessionId },
    select: { currentPath: true },
  });

  const pathChanged = !existing || existing.currentPath !== input.path;

  await prisma.analyticsSession.upsert({
    where: { sessionId: input.sessionId },
    create: {
      sessionId: input.sessionId,
      visitorId: input.visitorId,
      countryCode: input.geo.countryCode,
      city: input.geo.city,
      region: input.geo.region,
      latitude: input.geo.latitude,
      longitude: input.geo.longitude,
      userAgent: input.userAgent,
      referrer: input.referrer,
      currentPath: input.path,
      funnelLabel,
      leadName,
      mailToken,
      bookingActive,
      firstSeenAt: now,
      lastSeenAt: now,
    },
    update: {
      visitorId: input.visitorId,
      countryCode: input.geo.countryCode,
      city: input.geo.city,
      region: input.geo.region,
      latitude: input.geo.latitude,
      longitude: input.geo.longitude,
      userAgent: input.userAgent,
      referrer: input.referrer,
      currentPath: input.path,
      funnelLabel,
      ...(leadName ? { leadName } : {}),
      ...(mailToken ? { mailToken } : {}),
      bookingActive,
      lastSeenAt: now,
    },
  });

  if (pathChanged) {
    await prisma.analyticsPageView.create({
      data: {
        sessionId: input.sessionId,
        path: input.path,
        funnelLabel,
        viewedAt: now,
      },
    });

    const pathEvent = pathToAnalyticsEvent(input.path);
    if (pathEvent) {
      void recordAnalyticsEvent({
        eventName: pathEvent,
        sessionId: input.sessionId,
        visitorId: input.visitorId,
        mailToken: mailToken ?? undefined,
        path: input.path,
        dedupeSession: true,
      }).catch(() => {});
    }
  }
}
