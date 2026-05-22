import { NextResponse } from "next/server";
import {
  listReportSummaries,
  loadBusinessReport,
  resolveScreenshotFile,
} from "@/lib/bedrijven/business-report-storage";
import {
  LENJERII_SEGMENTS,
  type LenjeriiSegment,
} from "@/lib/bedrijven/branches";
import { isValidRegionId } from "@/lib/bedrijven/regions";
import { resolveBranchId } from "@/lib/bedrijven/scraper";
import { loadAllBusinesses } from "@/lib/bedrijven/load-all-businesses";
import type { Bedrijf } from "@/lib/bedrijven/types";

function countLenjeriiSegments(businesses: Bedrijf[]) {
  const segments: Record<LenjeriiSegment, number> = {
    hotel: 0,
    pension: 0,
    restaurant: 0,
    spa: 0,
  };
  let other = 0;
  for (const b of businesses) {
    const seg = b.subcategory as LenjeriiSegment;
    if (LENJERII_SEGMENTS.includes(seg)) segments[seg]++;
    else other++;
  }
  return { segments, other };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const branchId = resolveBranchId(searchParams.get("branch"));
  const provinceParam = searchParams.get("province")?.trim() ?? "all";

  let businesses = await loadAllBusinesses(branchId);
  if (provinceParam !== "all" && isValidRegionId(branchId, provinceParam)) {
    businesses = businesses.filter((b) => b.provinceId === provinceParam);
  }

  const byId = new Map(businesses.map((b) => [b.id, b]));
  const summaries = await listReportSummaries(byId);
  const reportById = new Map(summaries.map((s) => [s.businessId, s]));

  const withWebsite = businesses.filter((b) => b.website?.trim());
  const withEmail = businesses.filter((b) => b.email?.trim()).length;
  const withPhone = businesses.filter((b) => b.phone?.trim()).length;

  const rows = await Promise.all(
    withWebsite.map(async (b) => {
      const summary = reportById.get(b.id);
      const full = summary ? await loadBusinessReport(b.id) : null;
      const hasScreenshot = (await resolveScreenshotFile(b.id)) != null;

      return {
        id: b.id,
        name: b.name,
        category: b.category,
        city: b.city,
        province: b.province,
        provinceId: b.provinceId ?? null,
        website: b.website,
        email: b.email ?? null,
        address: b.address,
        subcategory: b.subcategory,
        hasScreenshot,
        report: summary
          ? {
              generatedAt: summary.generatedAt,
              seoScore: summary.seoScore,
              modernityScore: summary.modernityScore,
              overallScore: summary.overallScore,
              leadQuality: summary.leadQuality,
              primaryAppType: summary.primaryAppType,
              detectedServices: summary.detectedServices,
              servicesSummary: summary.servicesSummary,
              hasScreenshot,
              hasFullReport: !!full?.deepScrape,
              demoHomepageUrl: full?.demoHomepageUrl ?? null,
              demoAppUrl: full?.demoAppUrl ?? null,
            }
          : null,
      };
    }),
  );

  const stats: {
    total: number;
    withWebsite: number;
    withEmail: number;
    withPhone: number;
    segments?: Record<LenjeriiSegment, number>;
    otherSegment?: number;
  } = {
    total: businesses.length,
    withWebsite: withWebsite.length,
    withEmail,
    withPhone,
  };

  if (branchId === "lenjerii-hotel") {
    const seg = countLenjeriiSegments(businesses);
    stats.segments = seg.segments;
    stats.otherSegment = seg.other;
  }

  return NextResponse.json({
    branch: branchId,
    province: provinceParam,
    count: rows.length,
    stats,
    businesses: rows,
  });
}
