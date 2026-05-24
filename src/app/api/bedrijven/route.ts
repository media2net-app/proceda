import { NextResponse } from "next/server";
import {
  loadAllBusinesses,
  loadOutreachPipelineBusinesses,
} from "@/lib/bedrijven/load-all-businesses";
import { ADMIN_VERTICAL_ALL } from "@/lib/bedrijven/outreach-branches";
import {
  getActiveDataSource,
  getScrapeStatus,
  loadBedrijvenCache,
  resolveBranchId,
  resolveProvinceId,
} from "@/lib/bedrijven/scraper";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const branchParam = searchParams.get("branch");
  const branchId =
    branchParam === ADMIN_VERTICAL_ALL
      ? ADMIN_VERTICAL_ALL
      : resolveBranchId(branchParam);
  const provinceParam = searchParams.get("province")?.trim() ?? "all";
  const configuredSource = getActiveDataSource();

  if (provinceParam === "all") {
    const businesses =
      branchId === ADMIN_VERTICAL_ALL
        ? await loadOutreachPipelineBusinesses()
        : await loadAllBusinesses(branchId);
    return NextResponse.json({
      branch: branchId,
      province: "all",
      provinceName:
        branchId === ADMIN_VERTICAL_ALL
          ? "Alle branches"
          : branchId === "lenjerii-hotel"
            ? "România"
            : "Nederland",
      scrapedAt: new Date().toISOString(),
      count: businesses.length,
      dataSource: configuredSource,
      businesses,
      configuredSource,
      progress: null,
    });
  }

  if (branchId === ADMIN_VERTICAL_ALL) {
    return NextResponse.json(
      { error: "branch=all requires province=all" },
      { status: 400 },
    );
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
