import { NextResponse } from "next/server";
import {
  cleanupLegacyCache,
  resolveBranchId,
  resolveProvinceId,
  scrapeBedrijvenBatch,
  getActiveDataSource,
} from "@/lib/bedrijven/scraper";
import { getScrapeProvinceConfig } from "@/lib/bedrijven/branches";
import {
  isLocalScrapeEnvironment,
  LOCAL_SCRAPE_ONLY_MESSAGE,
} from "@/lib/bedrijven/local-scrape-only";

function mapError(message: string) {
  if (message.startsWith("RATE_LIMIT_COOLDOWN:")) {
    const seconds = message.split(":")[1] ?? "3";
    return NextResponse.json(
      { error: "RATE_LIMIT_COOLDOWN", waitSeconds: Number(seconds) },
      { status: 429 },
    );
  }
  return NextResponse.json({ error: message }, { status: 500 });
}

export async function POST(request: Request) {
  if (!isLocalScrapeEnvironment()) {
    return NextResponse.json(
      { error: "LOCAL_SCRAPE_ONLY", message: LOCAL_SCRAPE_ONLY_MESSAGE },
      { status: 503 },
    );
  }

  try {
    let branchId = resolveBranchId(null);
    let provinceId = resolveProvinceId(null);
    try {
      const body = (await request.json()) as {
        province?: string;
        branch?: string;
      };
      branchId = resolveBranchId(body.branch ?? null);
      provinceId = resolveProvinceId(body.province ?? null, branchId);
    } catch {
      // empty body is fine
    }

    const province = getScrapeProvinceConfig(branchId, provinceId);
    if (!province) {
      return NextResponse.json(
        { error: "UNKNOWN_BRANCH_OR_PROVINCE", branch: branchId, province: provinceId },
        { status: 400 },
      );
    }

    await cleanupLegacyCache();
    const result = await scrapeBedrijvenBatch(branchId, provinceId);

    return NextResponse.json({
      ok: true,
      provider: getActiveDataSource(),
      branch: result.cache.branch,
      province: result.cache.province,
      provinceName: result.cache.provinceName,
      scrapedAt: result.cache.scrapedAt,
      count: result.cache.count,
      batchAdded: result.batchAdded,
      totalEnriched: result.totalEnriched,
      queueTotal: result.queueTotal,
      remaining: result.remaining,
      discoveryComplete: result.discoveryComplete,
      done: result.done,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Scraping failed";

    if (message.includes("GOOGLE_API_KEY_MISSING")) {
      return NextResponse.json(
        { error: "GOOGLE_API_KEY_MISSING", message },
        { status: 400 },
      );
    }

    if (message.includes("Billing") || message.includes("REQUEST_DENIED")) {
      return NextResponse.json(
        { error: "GOOGLE_BILLING_REQUIRED", message },
        { status: 402 },
      );
    }

    return mapError(message);
  }
}
