import { NextResponse } from "next/server";
import { resolveOutreachBranchId } from "@/lib/bedrijven/outreach-branches";
import { getAdminKpiStats } from "@/lib/bedrijven/kpi-stats";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const branchId = resolveOutreachBranchId(searchParams.get("branch"));
  const stats = await getAdminKpiStats(branchId);
  return NextResponse.json({ ...stats, branchId });
}
