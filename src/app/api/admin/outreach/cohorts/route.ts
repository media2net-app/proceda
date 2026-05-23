import { NextResponse } from "next/server";
import { resolveOutreachBranchId } from "@/lib/bedrijven/outreach-branches";
import { scrapeBranchFromOutreach } from "@/lib/bedrijven/outreach-branches";
import { getOutreachCohortStats } from "@/lib/outreach/outreach-cohort-stats";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const branchId = scrapeBranchFromOutreach(
    resolveOutreachBranchId(searchParams.get("branch")),
  );

  try {
    const cohorts = await getOutreachCohortStats(branchId);
    return NextResponse.json({ branchId, cohorts, updatedAt: new Date().toISOString() });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
