import { NextResponse } from "next/server";
import { loadAllBusinesses } from "@/lib/bedrijven/load-all-businesses";
import {
  getActiveDataSource,
  getScrapeStatus,
  loadBedrijvenCache,
  resolveBranchId,
  resolveProvinceId,
} from "@/lib/bedrijven/scraper";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const branchId = resolveBranchId(searchParams.get("branch"));
  const provinceParam = searchParams.get("province")?.trim() ?? "all";
  const configuredSource = getActiveDataSource();

  if (provinceParam === "all") {
    const businesses = await loadAllBusinesses(branchId);
    return NextResponse.json({
      branch: branchId,
      province: "all",
      provinceName: branchId === "lenjerii-hotel" ? "România" : "Nederland",
      scrapedAt: new Date().toISOString(),
      count: businesses.length,
      dataSource: "google" as const,
      businesses,
      configuredSource,
      progress: null,
    });
  }

  const provinceId = resolveProvinceId(provinceParam, branchId);
  const cache = await loadBedrijvenCache(branchId, provinceId);
  const status = await getScrapeStatus(branchId, provinceId);

  if (!cache) {
    return NextResponse.json({
      branch: branchId,
      province: provinceId,
      scrapedAt: null,
      count: 0,
      businesses: [],
      configuredSource,
      progress: status,
    });
  }

  return NextResponse.json({
    ...cache,
    configuredSource,
    progress: status,
  });
}
