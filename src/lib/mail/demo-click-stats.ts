import "server-only";

import { prisma } from "@/lib/db/prisma";
import { extractDemoTokenFromPath } from "@/lib/analytics-demo-lead";

const FULL_MAIL_TOKEN_LEN = 32;

export type DemoClickStat = {
  clickCount: number;
  sessionCount: number;
  firstClickedAt: string | null;
  lastClickedAt: string | null;
};

type MutableStat = {
  clickCount: number;
  sessionIds: Set<string>;
  firstClickedAt: Date | null;
  lastClickedAt: Date | null;
};

function emptyStat(): MutableStat {
  return {
    clickCount: 0,
    sessionIds: new Set(),
    firstClickedAt: null,
    lastClickedAt: null,
  };
}

function recordVisit(
  stat: MutableStat,
  at: Date,
  sessionId?: string | null,
): void {
  stat.clickCount += 1;
  if (sessionId) stat.sessionIds.add(sessionId);
  if (!stat.firstClickedAt || at < stat.firstClickedAt) {
    stat.firstClickedAt = at;
  }
  if (!stat.lastClickedAt || at > stat.lastClickedAt) {
    stat.lastClickedAt = at;
  }
}

function resolvePathToken(
  pathToken: string,
  tokenSet: Set<string>,
  prefixToFull: Map<string, string>,
): string | null {
  if (tokenSet.has(pathToken)) return pathToken;
  const byPrefix = prefixToFull.get(pathToken);
  if (byPrefix) return byPrefix;
  if (pathToken.length >= 8 && pathToken.length < FULL_MAIL_TOKEN_LEN) {
    return prefixToFull.get(pathToken.slice(0, 10)) ?? null;
  }
  return null;
}

function toPublic(stat: MutableStat): DemoClickStat {
  return {
    clickCount: stat.clickCount,
    sessionCount: stat.sessionIds.size,
    firstClickedAt: stat.firstClickedAt?.toISOString() ?? null,
    lastClickedAt: stat.lastClickedAt?.toISOString() ?? null,
  };
}

/** Demo-booking bezoeken gekoppeld aan outreach-mail token (analytics). */
export async function loadDemoClickStatsByTokens(
  tokens: string[],
): Promise<Map<string, DemoClickStat>> {
  const unique = [...new Set(tokens.map((t) => t.trim()).filter(Boolean))];
  const out = new Map<string, DemoClickStat>();
  if (unique.length === 0) return out;

  const tokenSet = new Set(unique);
  const mutable = new Map(unique.map((t) => [t, emptyStat()]));
  const prefixToFull = new Map<string, string>();
  for (const t of unique) {
    prefixToFull.set(t.slice(0, 10), t);
  }

  const [sessions, views] = await Promise.all([
    prisma.analyticsSession.findMany({
      where: { mailToken: { in: unique } },
      select: {
        mailToken: true,
        sessionId: true,
        firstSeenAt: true,
        lastSeenAt: true,
      },
    }),
    prisma.analyticsPageView.findMany({
      where: { path: { contains: "/demo/" } },
      select: { path: true, viewedAt: true, sessionId: true },
    }),
  ]);

  for (const row of sessions) {
    const token = row.mailToken?.trim();
    if (!token || !mutable.has(token)) continue;
    const stat = mutable.get(token)!;
    stat.sessionIds.add(row.sessionId);
    if (!stat.firstClickedAt || row.firstSeenAt < stat.firstClickedAt) {
      stat.firstClickedAt = row.firstSeenAt;
    }
    if (!stat.lastClickedAt || row.lastSeenAt > stat.lastClickedAt) {
      stat.lastClickedAt = row.lastSeenAt;
    }
  }

  for (const row of views) {
    const extracted = extractDemoTokenFromPath(row.path);
    if (!extracted) continue;
    const token = resolvePathToken(extracted, tokenSet, prefixToFull);
    if (!token || !mutable.has(token)) continue;
    recordVisit(mutable.get(token)!, row.viewedAt, row.sessionId);
  }

  for (const [token, stat] of mutable) {
    const hasActivity = stat.clickCount > 0 || stat.sessionIds.size > 0;
    if (!hasActivity) continue;
    if (stat.clickCount === 0 && stat.sessionIds.size > 0) {
      stat.clickCount = stat.sessionIds.size;
    }
    out.set(token, toPublic(stat));
  }

  return out;
}

export function summarizeDemoClicks(
  previews: { status: string; token: string }[],
  clickByToken: Map<string, DemoClickStat>,
): { clicked: number; sentOrBooked: number; clickRate: number } {
  let sentOrBooked = 0;
  let clicked = 0;
  for (const p of previews) {
    if (p.status !== "sent" && p.status !== "booked") continue;
    sentOrBooked++;
    if (clickByToken.has(p.token)) clicked++;
  }
  const clickRate =
    sentOrBooked > 0 ? Math.round((clicked / sentOrBooked) * 100) : 0;
  return { clicked, sentOrBooked, clickRate };
}
