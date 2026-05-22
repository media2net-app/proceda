import { prisma } from "@/lib/db/prisma";
import { funnelLabelFromPath } from "@/lib/analytics-funnel";
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
};

export async function recordAnalyticsPing(
  input: AnalyticsPingInput,
): Promise<void> {
  const now = new Date();
  const funnelLabel = funnelLabelFromPath(input.path);
  const bookingActive = input.bookingActive === true;

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
  }
}
