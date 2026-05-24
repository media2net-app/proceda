import { NextResponse } from "next/server";
import { parseAdminVerticalScope } from "@/lib/bedrijven/outreach-branches";
import { getOutreachUtmStats } from "@/lib/outreach/outreach-utm-stats";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scope = parseAdminVerticalScope(searchParams.get("branch"));

  try {
    const stats = await getOutreachUtmStats(scope);
    return NextResponse.json({ branchId: scope, ...stats });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
