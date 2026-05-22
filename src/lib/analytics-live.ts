import "server-only";

import { prisma } from "@/lib/db/prisma";
import {
  extractDemoTokenFromPath,
  formatFunnelLabelWithLead,
  formatPageLabelWithLead,
  loadLeadNamesByDemoTokens,
  resolveLeadNameForPath,
} from "@/lib/analytics-demo-lead";
import { resolveVisitorCoords } from "@/lib/analytics-geo";
import { ANALYTICS_ACTIVE_MS } from "@/lib/analytics-db";
import {
  parseAnalyticsPeriod,
  type AnalyticsLiveSnapshot,
  type AnalyticsPeriod,
  type LiveVisitorMarker,
} from "@/lib/analytics-live-types";

export type { AnalyticsLiveSnapshot, LiveVisitorMarker } from "@/lib/analytics-live-types";

const PERIOD_LABELS: Record<AnalyticsPeriod, string> = {
  today: "Vandaag",
  "7d": "Laatste 7 dagen",
  "30d": "Laatste 30 dagen",
  all: "Alles",
};

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

export type AnalyticsLiveOptions = {
  /** Alleen sessies gekoppeld aan outreach-mail (mailToken). */
  outreachOnly?: boolean;
};

export async function getAnalyticsLiveSnapshot(
  periodInput?: AnalyticsPeriod | string | null,
  options?: AnalyticsLiveOptions,
): Promise<AnalyticsLiveSnapshot> {
  const period = parseAnalyticsPeriod(
    typeof periodInput === "string" ? periodInput : (periodInput ?? "today"),
  );
  const { start: periodStart, end: periodEnd } = getPeriodRange(period);
  const periodLabel = options?.outreachOnly
    ? `${PERIOD_LABELS[period]} · Outreach`
    : PERIOD_LABELS[period];

  const now = Date.now();
  const activeSince = new Date(now - ANALYTICS_ACTIVE_MS);
  const tenMinStart = new Date(now - 10 * 60 * 1000);

  const outreachFilter = options?.outreachOnly
    ? { mailToken: { not: null } }
    : {};

  const sessionPeriod = {
    ...periodWhere(periodStart, periodEnd, "firstSeenAt"),
    ...outreachFilter,
  };
  const viewPeriod = {
    ...periodWhere(periodStart, periodEnd, "viewedAt"),
    ...(options?.outreachOnly ? { path: { contains: "/demo/" } } : {}),
  };
  const aptPeriod = {
    ...periodWhere(periodStart, periodEnd, "createdAt"),
    ...(options?.outreachOnly ? { source: "auto_mail" as const } : {}),
  };

  const [
    activeRowsRaw,
    sessions,
    pageViews,
    bookings,
    pageViewRows,
    funnelRows,
    recentViews,
  ] = await Promise.all([
    prisma.analyticsSession.findMany({
      where: {
        lastSeenAt: { gte: activeSince },
        ...outreachFilter,
      },
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
      select: { funnelLabel: true, path: true },
      take: 5000,
    }),
    prisma.analyticsPageView.findMany({
      where: { viewedAt: { gte: tenMinStart } },
      select: { viewedAt: true },
      orderBy: { viewedAt: "asc" },
    }),
  ]);

  const activeRows = activeRowsRaw;

  let bookingNow = 0;
  for (const row of activeRows) {
    if (row.bookingActive) bookingNow += 1;
  }

  const conversionRate =
    sessions > 0 ? Math.round((bookings / sessions) * 1000) / 10 : null;

  const tokensForLookup = new Set<string>();
  for (const row of activeRows) {
    const t = extractDemoTokenFromPath(row.currentPath);
    if (t) tokensForLookup.add(t);
  }
  for (const row of pageViewRows) {
    const t = extractDemoTokenFromPath(row.path);
    if (t) tokensForLookup.add(t);
  }
  for (const row of funnelRows) {
    const t = extractDemoTokenFromPath(row.path);
    if (t) tokensForLookup.add(t);
  }
  const leadByToken = await loadLeadNamesByDemoTokens([...tokensForLookup]);

  const visitors: LiveVisitorMarker[] = [];
  const activeVisitors: AnalyticsLiveSnapshot["activeVisitors"] = [];

  for (const row of activeRows) {
    const leadName =
      row.leadName?.trim() ||
      resolveLeadNameForPath(row.currentPath, leadByToken);
    activeVisitors.push({
      sessionId: row.sessionId,
      path: row.currentPath,
      funnelLabel: row.funnelLabel,
      leadName,
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
      leadName:
        row.leadName?.trim() ||
        resolveLeadNameForPath(row.currentPath, leadByToken),
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
    .map(([path, views]) => ({
      path,
      views,
      leadName: resolveLeadNameForPath(path, leadByToken),
      label: formatPageLabelWithLead(path, leadByToken),
    }));

  const funnelCounts = new Map<string, { views: number; leadName: string | null }>();
  for (const row of funnelRows) {
    const label = formatFunnelLabelWithLead(
      row.funnelLabel,
      row.path,
      leadByToken,
    );
    if (!label || label === "—") continue;
    const leadName = resolveLeadNameForPath(row.path, leadByToken);
    const prev = funnelCounts.get(label);
    funnelCounts.set(label, {
      views: (prev?.views ?? 0) + 1,
      leadName: prev?.leadName ?? leadName,
    });
  }
  const topFunnels = [...funnelCounts.entries()]
    .sort((a, b) => b[1].views - a[1].views)
    .slice(0, 8)
    .map(([label, meta]) => ({
      label,
      views: meta.views,
      leadName: meta.leadName,
    }));

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
