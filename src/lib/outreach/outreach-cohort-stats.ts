import "server-only";

import { prisma } from "@/lib/db/prisma";
import {
  ADMIN_VERTICAL_ALL,
  type AdminVerticalScope,
  OUTREACH_BRANCH_IDS,
} from "@/lib/bedrijven/outreach-branches";
import { loadDemoClickStatsByTokens } from "@/lib/mail/demo-click-stats";

export type CohortRow = {
  sendBatch: string;
  sent: number;
  opened: number;
  booked: number;
  won: number;
  openRate: number;
  bookRate: number;
  sentAtMin: string | null;
  sentAtMax: string | null;
};

export async function getOutreachCohortStats(
  scope: AdminVerticalScope,
): Promise<CohortRow[]> {
  const rows = await prisma.mailOutreach.findMany({
    where: {
      sendBatch: { not: null },
      business:
        scope === ADMIN_VERTICAL_ALL
          ? { branchId: { in: [...OUTREACH_BRANCH_IDS] } }
          : { branchId: scope },
    },
    select: {
      sendBatch: true,
      status: true,
      sentAt: true,
      token: true,
      pipelineStatus: true,
    },
  });

  const byBatch = new Map<
    string,
    {
      sent: number;
      booked: number;
      won: number;
      tokens: string[];
      sentAts: Date[];
    }
  >();

  for (const row of rows) {
    const batch = row.sendBatch!;
    let g = byBatch.get(batch);
    if (!g) {
      g = { sent: 0, booked: 0, won: 0, tokens: [], sentAts: [] };
      byBatch.set(batch, g);
    }
    if (row.status === "sent" || row.status === "booked") {
      g.sent++;
      g.tokens.push(row.token);
      if (row.sentAt) g.sentAts.push(row.sentAt);
    }
    if (row.status === "booked") g.booked++;
    if (row.pipelineStatus === "won") g.won++;
  }

  const allTokens = [...byBatch.values()].flatMap((g) => g.tokens);
  const clickMap = await loadDemoClickStatsByTokens(allTokens);

  const out: CohortRow[] = [];
  for (const [sendBatch, g] of byBatch) {
    let opened = 0;
    for (const t of g.tokens) {
      if (clickMap.has(t)) opened++;
    }
    const sentAts = g.sentAts.sort((a, b) => a.getTime() - b.getTime());
    out.push({
      sendBatch,
      sent: g.sent,
      opened,
      booked: g.booked,
      won: g.won,
      openRate: g.sent > 0 ? Math.round((opened / g.sent) * 1000) / 10 : 0,
      bookRate: g.sent > 0 ? Math.round((g.booked / g.sent) * 1000) / 10 : 0,
      sentAtMin: sentAts[0]?.toISOString() ?? null,
      sentAtMax: sentAts[sentAts.length - 1]?.toISOString() ?? null,
    });
  }

  out.sort((a, b) => (b.sentAtMax ?? "").localeCompare(a.sentAtMax ?? ""));
  return out;
}
