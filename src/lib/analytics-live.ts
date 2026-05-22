import "server-only";

import { prisma } from "@/lib/db/prisma";
import { resolveVisitorCoords } from "@/lib/analytics-geo";
import { ANALYTICS_ACTIVE_MS } from "@/lib/analytics-db";
import type {
  AnalyticsLiveSnapshot,
  AnalyticsPeriod,
  LiveVisitorMarker,
} from "@/lib/analytics-live-types";

export type { AnalyticsLiveSnapshot, LiveVisitorMarker } from "@/lib/analytics-live-types";

const PERIOD_LABELS: Record<AnalyticsPeriod, string> = {
  today: "Vandaag",
  "7d": "Laatste 7 dagen",
  "30d": "Laatste 30 dagen",
  all: "Alles",
};

export function parseAnalyticsPeriod(
  input: string | null | undefined,
): AnalyticsPeriod {
  if (input === "today" || input === "7d" || input === "30d" || input === "all") {
    return input;
  }
  return "today";
}

function getPeriodRange(period: AnalyticsPeriod): {
  start: Date | null;
  end: Date | null;
} {
  const end = new Date();
  if (period === "all") return { start: null, end: null };
  const start = new Date();
  if (period === "today") {
    start.setHours(0, 0, 0, 0);
    return { start, end };
  }
  if (period === "7d") {
    start.setDate(start.getDate() - 7);
    return { start, end };
  }
  start.setDate(start.getDate() - 30);
  return { start, end };
}

function periodWhere(
  periodStart: Date | null,
  periodEnd: Date | null,
  field: "firstSeenAt" | "viewedAt" | "createdAt" | "bookedAt",
) {
  const w: Record<string, Date> = {};
  if (periodStart) w.gte = periodStart;
  if (periodEnd) w.lt = periodEnd;
  return Object.keys(w).length ? { [field]: w } : {};
}

export async function getAnalyticsLiveSnapshot(
  periodInput?: AnalyticsPeriod | string | null,
): Promise<AnalyticsLiveSnapshot> {
  const period = parseAnalyticsPeriod(
    typeof periodInput === "string" ? periodInput : (periodInput ?? "today"),
  );
  const { start: periodStart, end: periodEnd } = getPeriodRange(period);
  const periodLabel = PERIOD_LABELS[period];

  const now = Date.now();
  const activeSince = new Date(now - ANALYTICS_ACTIVE_MS);
  const tenMinStart = new Date(now - 10 * 60 * 1000);

  const sessionPeriod = periodWhere(periodStart, periodEnd, "firstSeenAt");
  const viewPeriod = periodWhere(periodStart, periodEnd, "viewedAt");
  const aptPeriod = periodWhere(periodStart, periodEnd, "createdAt");

  const [
    activeRows,
    sessions,
    pageViews,
    bookings,
    pageViewRows,
    funnelRows,
    recentViews,
  ] = await Promise.all([
    prisma.analyticsSession.findMany({
      where: { lastSeenAt: { gte: activeSince } },
      orderBy: { lastSeenAt: "desc" },
      take: 200,
    }),
    prisma.analyticsSession.count({ where: sessionPeriod }),
    prisma.analyticsPageView.count({ where: viewPeriod }),
    prisma.appointment.count({ where: aptPeriod }),
    prisma.analyticsPageView.findMany({
      where: viewPeriod,
      select: { path: true },
      take: 5000,
    }),
    prisma.analyticsPageView.findMany({
      where: { ...viewPeriod, funnelLabel: { not: null } },
      select: { funnelLabel: true },
      take: 5000,
    }),
    prisma.analyticsPageView.findMany({
      where: { viewedAt: { gte: tenMinStart } },
      select: { viewedAt: true },
      orderBy: { viewedAt: "asc" },
    }),
  ]);

  let bookingNow = 0;
  for (const row of activeRows) {
    if (row.bookingActive) bookingNow += 1;
  }

  const conversionRate =
    sessions > 0 ? Math.round((bookings / sessions) * 1000) / 10 : null;

  const visitors: LiveVisitorMarker[] = [];
  const activeVisitors: AnalyticsLiveSnapshot["activeVisitors"] = [];

  for (const row of activeRows) {
    activeVisitors.push({
      sessionId: row.sessionId,
      path: row.currentPath,
      funnelLabel: row.funnelLabel,
      bookingActive: row.bookingActive,
      city: row.city,
      countryCode: row.countryCode,
      lastSeenAt: row.lastSeenAt.toISOString(),
    });

    const coords = resolveVisitorCoords({
      latitude: row.latitude,
      longitude: row.longitude,
      countryCode: row.countryCode,
      sessionId: row.sessionId,
    });
    if (!coords) continue;

    visitors.push({
      sessionId: row.sessionId,
      lat: coords[0],
      lng: coords[1],
      city: row.city,
      countryCode: row.countryCode,
      path: row.currentPath,
      funnelLabel: row.funnelLabel,
      bookingActive: row.bookingActive,
      lastSeenAt: row.lastSeenAt.toISOString(),
    });
  }

  const pathCounts = new Map<string, number>();
  for (const row of pageViewRows) {
    pathCounts.set(row.path, (pathCounts.get(row.path) ?? 0) + 1);
  }
  const topPages = [...pathCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([path, views]) => ({ path, views }));

  const funnelCounts = new Map<string, number>();
  for (const row of funnelRows) {
    const label = row.funnelLabel ?? "";
    if (!label) continue;
    funnelCounts.set(label, (funnelCounts.get(label) ?? 0) + 1);
  }
  const topFunnels = [...funnelCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([label, views]) => ({ label, views }));

  const buckets = new Map<string, number>();
  for (let i = 9; i >= 0; i--) {
    const t = new Date(now - i * 60 * 1000);
    const key = `${t.getHours().toString().padStart(2, "0")}:${t.getMinutes().toString().padStart(2, "0")}`;
    buckets.set(key, 0);
  }
  for (const row of recentViews) {
    const d = row.viewedAt;
    const key = `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
  }
  const pageViewsLast10Min = [...buckets.entries()].map(([minute, views]) => ({
    minute,
    views,
  }));

  return {
    generatedAt: new Date().toISOString(),
    period,
    periodLabel,
    visitorsNow: activeRows.length,
    bookingNow,
    sessions,
    pageViews,
    bookings,
    conversionRate,
    visitors,
    topPages,
    topFunnels,
    pageViewsLast10Min,
    activeVisitors,
  };
}
