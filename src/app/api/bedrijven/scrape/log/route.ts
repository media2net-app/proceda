import { NextResponse } from "next/server";
import { getBatchScrapeLogStatus } from "@/lib/bedrijven/batch-scrape-log";
import { resolveBranchId } from "@/lib/bedrijven/scraper";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const branchId = resolveBranchId(searchParams.get("branch"));
  const status = await getBatchScrapeLogStatus(branchId);
  return NextResponse.json(status);
}
