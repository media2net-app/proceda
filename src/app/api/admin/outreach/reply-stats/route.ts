import { NextResponse } from "next/server";
import { parseAdminVerticalScope } from "@/lib/bedrijven/outreach-branches";
import { getOutreachReplyStats } from "@/lib/outreach/outreach-reply-stats";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scope = parseAdminVerticalScope(searchParams.get("branch"));
  const locale = searchParams.get("locale") ?? "nl";

  try {
    const stats = await getOutreachReplyStats(scope, locale);
    return NextResponse.json(stats);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
