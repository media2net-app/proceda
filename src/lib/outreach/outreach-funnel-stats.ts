import "server-only";

import { prisma } from "@/lib/db/prisma";
import {
  ADMIN_VERTICAL_ALL,
  type AdminVerticalScope,
  outreachBranchesForScope,
} from "@/lib/bedrijven/outreach-branches";
import { loadDemoClickStatsByTokens } from "@/lib/mail/demo-click-stats";
import { listDemoOutreachTemplates } from "@/lib/mail/list-demo-outreach";
import type { MailTemplatePreview } from "@/lib/mail/types";

export type OutreachFunnelStep = {
  id: string;
  label: string;
  count: number;
  rateFromPrev: number | null;
  rateFromSent: number | null;
};

export type OutreachFunnelStats = {
  branchId: AdminVerticalScope;
  updatedAt: string;
  steps: OutreachFunnelStep[];
  rates: {
    sentToOpen: number;
    openToEngaged: number;
    engagedToBooked: number;
    sentToBooked: number;
  };
};

function pct(num: number, den: number): number | null {
  if (den <= 0) return null;
  return Math.round((num / den) * 1000) / 10;
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

export async function getOutreachFunnelStats(
  scope: AdminVerticalScope,
  locale = "nl",
): Promise<OutreachFunnelStats> {
  const previews = await loadPreviewsForScope(scope, locale);
  const tokens = previews.map((p) => p.token).filter(Boolean);
  const clickByToken = await loadDemoClickStatsByTokens(tokens);

  const emailPool = previews.length;
  let draft = 0;
  let sent = 0;
  let booked = 0;
  let opened = 0;
  let won = 0;

  const sentTokens: string[] = [];

  for (const p of previews) {
    if (p.status === "draft") draft++;
    if (p.status === "sent" || p.status === "booked") {
      sent++;
      sentTokens.push(p.token);
    }
    if (p.status === "booked") booked++;
    if (clickByToken.has(p.token) || p.demoVisited) opened++;
    if (p.pipelineStatus === "won") won++;
  }

  const engaged =
    sentTokens.length > 0
      ? await prisma.analyticsSession.count({
          where: {
            mailToken: { in: sentTokens },
            bookingActive: true,
          },
        })
      : 0;

  const steps: OutreachFunnelStep[] = [
    {
      id: "with_email",
      label: "Met e-mail",
      count: emailPool,
      rateFromPrev: null,
      rateFromSent: null,
    },
    {
      id: "draft",
      label: "Concept",
      count: draft,
      rateFromPrev: pct(draft, emailPool),
      rateFromSent: null,
    },
    {
      id: "sent",
      label: "Verstuurd",
      count: sent,
      rateFromPrev: pct(sent, emailPool),
      rateFromSent: null,
    },
    {
      id: "opened",
      label: "Link geopend",
      count: opened,
      rateFromPrev: pct(opened, sent),
      rateFromSent: pct(opened, sent),
    },
    {
      id: "engaged",
      label: "Boekpagina engaged",
      count: engaged,
      rateFromPrev: pct(engaged, opened),
      rateFromSent: pct(engaged, sent),
    },
    {
      id: "booked",
      label: "Geboekt",
      count: booked,
      rateFromPrev: pct(booked, engaged),
      rateFromSent: pct(booked, sent),
    },
    {
      id: "won",
      label: "Gewonnen",
      count: won,
      rateFromPrev: pct(won, booked),
      rateFromSent: pct(won, sent),
    },
  ];

  return {
    branchId: scope,
    updatedAt: new Date().toISOString(),
    steps,
    rates: {
      sentToOpen: pct(opened, sent) ?? 0,
      openToEngaged: pct(engaged, opened) ?? 0,
      engagedToBooked: pct(booked, engaged) ?? 0,
      sentToBooked: pct(booked, sent) ?? 0,
    },
  };
}
