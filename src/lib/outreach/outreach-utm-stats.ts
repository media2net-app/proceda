import "server-only";

import { prisma } from "@/lib/db/prisma";
import type { ScrapeBranchId } from "@/lib/bedrijven/branches";

export type UtmCampaignRow = {
  utmCampaign: string;
  sessions: number;
  bookingActive: number;
  mailTokens: number;
};

export async function getOutreachUtmStats(
  branchId: ScrapeBranchId,
): Promise<{ rows: UtmCampaignRow[]; updatedAt: string }> {
  const sessions = await prisma.analyticsSession.findMany({
    where: {
      utmCampaign: { not: null },
      mailToken: { not: null },
    },
    select: {
      utmCampaign: true,
      bookingActive: true,
      mailToken: true,
    },
  });

  const tokensInBranch = new Set(
    (
      await prisma.mailOutreach.findMany({
        where: { business: { branchId } },
        select: { token: true },
      })
    ).map((r) => r.token),
  );

  const byCampaign = new Map<
    string,
    { sessions: number; bookingActive: number; tokens: Set<string> }
  >();

  for (const s of sessions) {
    if (!s.mailToken || !tokensInBranch.has(s.mailToken)) continue;
    const key = s.utmCampaign!;
    let g = byCampaign.get(key);
    if (!g) {
      g = { sessions: 0, bookingActive: 0, tokens: new Set() };
      byCampaign.set(key, g);
    }
    g.sessions++;
    if (s.bookingActive) g.bookingActive++;
    g.tokens.add(s.mailToken);
  }

  const rows: UtmCampaignRow[] = [...byCampaign.entries()]
    .map(([utmCampaign, g]) => ({
      utmCampaign,
      sessions: g.sessions,
      bookingActive: g.bookingActive,
      mailTokens: g.tokens.size,
    }))
    .sort((a, b) => b.sessions - a.sessions);

  return { rows, updatedAt: new Date().toISOString() };
}
