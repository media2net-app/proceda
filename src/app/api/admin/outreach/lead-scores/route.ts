import { NextResponse } from "next/server";
import { resolveOutreachBranchId } from "@/lib/bedrijven/outreach-branches";
import { getOutreachLeadScores } from "@/lib/outreach/outreach-lead-score";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const branchId = resolveOutreachBranchId(searchParams.get("branch"));
  const locale = searchParams.get("locale") ?? "nl";
  const limit = Math.min(Number.parseInt(searchParams.get("limit") ?? "30", 10), 100);

  try {
    const data = await getOutreachLeadScores(branchId, locale, limit);
    return NextResponse.json(data);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed";
    console.error("[admin/outreach/lead-scores]", e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
