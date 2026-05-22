import { NextResponse } from "next/server";
import { resolveOutreachBranchId } from "@/lib/bedrijven/outreach-branches";
import { getOutreachFunnelStats } from "@/lib/outreach/outreach-funnel-stats";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const branchId = resolveOutreachBranchId(searchParams.get("branch"));
  const locale = searchParams.get("locale") ?? "nl";

  try {
    const stats = await getOutreachFunnelStats(branchId, locale);
    return NextResponse.json(stats);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed";
    console.error("[admin/outreach/funnel]", e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
