import { NextResponse } from "next/server";
import { parseAdminVerticalScope } from "@/lib/bedrijven/outreach-branches";
import { getAdminKpiStatsForScope } from "@/lib/bedrijven/kpi-stats";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scope = parseAdminVerticalScope(searchParams.get("branch"));
  const stats = await getAdminKpiStatsForScope(scope);
  return NextResponse.json({ ...stats, branchId: scope });
}
