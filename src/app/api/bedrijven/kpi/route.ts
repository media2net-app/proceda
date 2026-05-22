import { NextResponse } from "next/server";
import { getAdminKpiStats } from "@/lib/bedrijven/kpi-stats";

export async function GET() {
  const stats = await getAdminKpiStats();
  return NextResponse.json(stats);
}
