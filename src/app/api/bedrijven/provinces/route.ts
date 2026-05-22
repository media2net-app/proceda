import { NextResponse } from "next/server";
import { resolveBranchId } from "@/lib/bedrijven/scraper";
import { listProvincesWithDataForBranch } from "@/lib/bedrijven/branches-data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const branchId = resolveBranchId(searchParams.get("branch"));
  const provinces = await listProvincesWithDataForBranch(branchId);
  return NextResponse.json({ branch: branchId, provinces });
}
