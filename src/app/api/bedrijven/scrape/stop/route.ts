import { NextResponse } from "next/server";
import {
  resolveBranchId,
  resolveProvinceId,
  stopProvinceScrape,
} from "@/lib/bedrijven/scraper";
import { getScrapeProvinceConfig } from "@/lib/bedrijven/branches";

export async function POST(request: Request) {
  try {
    let branchId = resolveBranchId(null);
    let provinceId = resolveProvinceId(null, branchId);
    try {
      const body = (await request.json()) as { province?: string; branch?: string };
      branchId = resolveBranchId(body.branch ?? null);
      provinceId = resolveProvinceId(body.province ?? null, branchId);
    } catch {
      // empty body
    }

    const province = getScrapeProvinceConfig(branchId, provinceId);
    if (!province) {
      return NextResponse.json({ error: "UNKNOWN_BRANCH_OR_PROVINCE" }, { status: 400 });
    }

    const progress = await stopProvinceScrape(branchId, provinceId);
    const remaining = progress.placeQueue.filter(
      (p) => !progress.enrichedPlaceIds.includes(p.place_id),
    ).length;

    return NextResponse.json({
      ok: true,
      branch: branchId,
      province: provinceId,
      stopped: true,
      enriched: progress.enrichedPlaceIds.length,
      remaining,
      discoveryComplete: progress.discoveryComplete,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Stop failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
