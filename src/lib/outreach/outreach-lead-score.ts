import "server-only";

import { prisma } from "@/lib/db/prisma";
import { loadDemoClickStatsByTokens } from "@/lib/mail/demo-click-stats";
import { listDemoOutreachTemplates } from "@/lib/mail/list-demo-outreach";
import {
  ADMIN_VERTICAL_ALL,
  type AdminVerticalScope,
  outreachBranchesForScope,
} from "@/lib/bedrijven/outreach-branches";
import type { MailTemplatePreview } from "@/lib/mail/types";

export type OutreachLeadScoreRow = {
  businessId: string;
  businessName: string;
  slug: string;
  email?: string;
  reportScore: number;
  outreachScore: number;
  signals: string[];
  demoVisited: boolean;
  bookingEngaged: boolean;
  pipelineStatus?: string;
  firstTouchAt?: string;
  lastTouchAt?: string;
  firstTouchPath?: string;
  lastTouchPath?: string;
};

export type OutreachLeadScores = {
  branchId: AdminVerticalScope;
  updatedAt: string;
  rows: OutreachLeadScoreRow[];
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
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

export async function getOutreachLeadScores(
  scope: AdminVerticalScope,
  locale = "nl",
  limit = 30,
): Promise<OutreachLeadScores> {
  const previews = await loadPreviewsForScope(scope, locale);
  const tokens = previews.map((p) => p.token);
  const clickByToken = await loadDemoClickStatsByTokens(tokens);

  const sentTokens = previews
    .filter((p) => p.status === "sent" || p.status === "booked")
    .map((p) => p.token);

  const engagedTokens = new Set<string>();
  if (sentTokens.length > 0) {
    const rows = await prisma.analyticsSession.findMany({
      where: { mailToken: { in: sentTokens }, bookingActive: true },
      select: { mailToken: true },
    });
    for (const r of rows) {
      if (r.mailToken) engagedTokens.add(r.mailToken);
    }
  }

  const touchByToken = new Map<
    string,
    { first: Date; last: Date; firstPath?: string; lastPath?: string }
  >();

  if (tokens.length > 0) {
    const events = await prisma.analyticsEvent.findMany({
      where: { mailToken: { in: tokens } },
      orderBy: { createdAt: "asc" },
      select: { mailToken: true, createdAt: true, path: true },
    });
    for (const ev of events) {
      if (!ev.mailToken) continue;
      const cur = touchByToken.get(ev.mailToken);
      if (!cur) {
        touchByToken.set(ev.mailToken, {
          first: ev.createdAt,
          last: ev.createdAt,
          firstPath: ev.path ?? undefined,
          lastPath: ev.path ?? undefined,
        });
      } else {
        cur.last = ev.createdAt;
        cur.lastPath = ev.path ?? cur.lastPath;
      }
    }
  }

  const rows: OutreachLeadScoreRow[] = [];

  for (const p of previews) {
    if (p.status === "draft") continue;

    const demoVisited = !!(p.demoVisited || clickByToken.has(p.token));
    const bookingEngaged = engagedTokens.has(p.token);
    const reportScore = p.overallScore ?? 50;
    const signals: string[] = [];

    let bonus = 0;
    if (p.leadQuality === "hot") {
      bonus += 18;
      signals.push("hot");
    } else if (p.leadQuality === "warm") {
      bonus += 10;
      signals.push("warm");
    }
    if (demoVisited) {
      bonus += 22;
      signals.push("demo_open");
    }
    if (bookingEngaged) {
      bonus += 28;
      signals.push("booking_engaged");
    }
    if (p.status === "booked") {
      bonus += 15;
      signals.push("booked");
    }
    if (p.pipelineStatus === "proposal") bonus += 8;
    if (p.pipelineStatus === "meeting") bonus += 6;

    const outreachScore = clamp(Math.round(reportScore * 0.45 + bonus), 0, 100);
    const touch = touchByToken.get(p.token);

    rows.push({
      businessId: p.businessId,
      businessName: p.businessName,
      slug: p.slug,
      email: p.email,
      reportScore,
      outreachScore,
      signals,
      demoVisited,
      bookingEngaged,
      pipelineStatus: p.pipelineStatus,
      firstTouchAt: touch?.first.toISOString(),
      lastTouchAt: touch?.last.toISOString(),
      firstTouchPath: touch?.firstPath,
      lastTouchPath: touch?.lastPath,
    });
  }

  rows.sort((a, b) => b.outreachScore - a.outreachScore);

  return {
    branchId: scope,
    updatedAt: new Date().toISOString(),
    rows: rows.slice(0, limit),
  };
}
