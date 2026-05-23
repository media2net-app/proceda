import "server-only";

import { prisma } from "@/lib/db/prisma";
import { loadDemoClickStatsByTokens } from "@/lib/mail/demo-click-stats";
import { getRecordByBusinessId } from "@/lib/mail/storage";
import type { OutreachPipelineStatus } from "@/lib/mail/types";

export type LeadTimelineEntry = {
  id: string;
  at: string;
  kind: "mail_sent" | "followup_sent" | "booked" | "event" | "page_view" | "pipeline";
  label: string;
  detail?: string;
};

export type LeadTimeline = {
  businessId: string;
  businessName: string;
  pipelineStatus: OutreachPipelineStatus;
  sendBatch?: string;
  entries: LeadTimelineEntry[];
};

export async function getLeadTimeline(
  businessId: string,
  businessName: string,
): Promise<LeadTimeline | null> {
  const record = await getRecordByBusinessId(businessId);
  if (!record) return null;

  const entries: LeadTimelineEntry[] = [];
  const token = record.token;

  if (record.sentAt) {
    entries.push({
      id: "sent",
      at: record.sentAt,
      kind: "mail_sent",
      label: "Outreach verstuurd",
      detail: record.sendBatch ? `Batch ${record.sendBatch}` : undefined,
    });
  }
  if (record.followupSentAt) {
    entries.push({
      id: "followup",
      at: record.followupSentAt,
      kind: "followup_sent",
      label: "Follow-up verstuurd",
    });
  }
  if (record.bookedAt) {
    entries.push({
      id: "booked",
      at: record.bookedAt,
      kind: "booked",
      label: "Demo geboekt",
    });
  }

  const [events, clickStats] = await Promise.all([
    prisma.analyticsEvent.findMany({
      where: {
        OR: [{ businessId }, { mailToken: token }],
      },
      orderBy: { createdAt: "asc" },
      take: 100,
    }),
    loadDemoClickStatsByTokens([token]),
  ]);

  const click = clickStats.get(token);
  if (click?.firstClickedAt && !entries.some((e) => e.id === "first_click")) {
    entries.push({
      id: "first_click",
      at: click.firstClickedAt,
      kind: "event",
      label: "Eerste link geopend",
      detail: `${click.clickCount} pageviews`,
    });
  }

  for (const ev of events) {
    entries.push({
      id: ev.id,
      at: ev.createdAt.toISOString(),
      kind: "event",
      label: eventLabel(ev.eventName),
      detail: ev.path ?? undefined,
    });
  }

  entries.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());

  return {
    businessId,
    businessName,
    pipelineStatus: record.pipelineStatus ?? "lead",
    sendBatch: record.sendBatch,
    entries,
  };
}

function eventLabel(name: string): string {
  const labels: Record<string, string> = {
    mail_link_open: "Mail-link geopend",
    booking_view: "Boekpagina bekeken",
    slot_select: "Tijdslot gekozen",
    booking_submit: "Boeking gestart",
    booking_confirmed: "Boeking bevestigd",
    demo_app_open: "Demo-app geopend",
    mail_sent: "Mail verzonden (event)",
    followup_sent: "Follow-up (event)",
  };
  return labels[name] ?? name;
}
