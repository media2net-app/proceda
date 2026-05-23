import "server-only";

import type { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/db/prisma";

export const ANALYTICS_EVENT_NAMES = [
  "mail_link_open",
  "booking_view",
  "slot_select",
  "booking_submit",
  "booking_confirmed",
  "demo_app_open",
  "mail_sent",
  "followup_sent",
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENT_NAMES)[number];

export type RecordAnalyticsEventInput = {
  eventName: AnalyticsEventName;
  sessionId?: string | null;
  visitorId?: string | null;
  mailToken?: string | null;
  businessId?: string | null;
  path?: string | null;
  metadata?: Record<string, unknown> | null;
  /** Eén keer per sessie+event (bijv. mail_link_open) */
  dedupeSession?: boolean;
};

const SESSION_DEDUPE_EVENTS = new Set<AnalyticsEventName>([
  "mail_link_open",
  "booking_view",
  "demo_app_open",
]);

export async function recordAnalyticsEvent(
  input: RecordAnalyticsEventInput,
): Promise<void> {
  const sessionId = input.sessionId?.trim() || null;
  const dedupe =
    input.dedupeSession ?? SESSION_DEDUPE_EVENTS.has(input.eventName);

  if (dedupe && sessionId) {
    const existing = await prisma.analyticsEvent.findFirst({
      where: { sessionId, eventName: input.eventName },
      select: { id: true },
    });
    if (existing) return;
  }

  await prisma.analyticsEvent.create({
    data: {
      eventName: input.eventName,
      sessionId,
      visitorId: input.visitorId?.trim() || null,
      mailToken: input.mailToken?.trim() || null,
      businessId: input.businessId?.trim() || null,
      path: input.path?.trim().slice(0, 500) || null,
      metadata: (input.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
    },
  });
}

export function pathToAnalyticsEvent(path: string): AnalyticsEventName | null {
  const p = path.split("?")[0].toLowerCase();
  if (/\/demo\/[^/]+/.test(p)) return "booking_view";
  if (p.startsWith("/demos/") && p.includes("/app")) return "demo_app_open";
  return null;
}
