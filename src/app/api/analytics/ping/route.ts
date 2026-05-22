import { NextResponse } from "next/server";
import { geoFromRequestHeaders } from "@/lib/analytics-geo";
import { recordAnalyticsPing } from "@/lib/analytics-db";

export const dynamic = "force-dynamic";

type PingBody = {
  visitorId?: string;
  sessionId?: string;
  path?: string;
  referrer?: string | null;
  bookingActive?: boolean;
  leadName?: string | null;
  mailToken?: string | null;
};

const SKIP_PREFIXES = [
  "/dashboard-admin",
  "/dashboard",
  "/login",
  "/api/",
  "/_next",
];

export async function POST(request: Request) {
  let body: PingBody;
  try {
    body = (await request.json()) as PingBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const visitorId = body.visitorId?.trim();
  const sessionId = body.sessionId?.trim();
  const path = body.path?.trim() || "/";

  if (!visitorId || !sessionId || visitorId.length > 80 || sessionId.length > 80) {
    return NextResponse.json({ error: "Invalid session" }, { status: 400 });
  }

  if (path.length > 500 || SKIP_PREFIXES.some((p) => path.startsWith(p))) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  try {
    await recordAnalyticsPing({
      visitorId,
      sessionId,
      path,
      referrer: body.referrer?.trim().slice(0, 500) || null,
      userAgent: request.headers.get("user-agent")?.slice(0, 500) || null,
      geo: geoFromRequestHeaders(request.headers),
      bookingActive: body.bookingActive === true,
      leadName: body.leadName,
      mailToken: body.mailToken,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed";
    console.error("[analytics/ping]", e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
