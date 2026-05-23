import { NextResponse } from "next/server";
import {
  ANALYTICS_EVENT_NAMES,
  recordAnalyticsEvent,
  type AnalyticsEventName,
} from "@/lib/analytics-events";

export const dynamic = "force-dynamic";

const SKIP_PREFIXES = ["/dashboard-admin", "/dashboard", "/login", "/api/"];

export async function POST(request: Request) {
  let body: {
    eventName?: string;
    sessionId?: string;
    visitorId?: string;
    mailToken?: string;
    businessId?: string;
    path?: string;
    metadata?: Record<string, unknown>;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventName = body.eventName as AnalyticsEventName;
  if (!ANALYTICS_EVENT_NAMES.includes(eventName)) {
    return NextResponse.json({ error: "INVALID_EVENT" }, { status: 400 });
  }

  const path = body.path?.trim() || "/";
  if (SKIP_PREFIXES.some((p) => path.startsWith(p))) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  try {
    await recordAnalyticsEvent({
      eventName,
      sessionId: body.sessionId,
      visitorId: body.visitorId,
      mailToken: body.mailToken,
      businessId: body.businessId,
      path: path,
      metadata: body.metadata,
      dedupeSession: eventName === "slot_select" ? false : undefined,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
