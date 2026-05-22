import { NextResponse } from "next/server";
import { slugToBusinessId } from "@/lib/bedrijven/slug";
import { findBusinessById } from "@/lib/bedrijven/load-all-businesses";
import { generateFullBusinessReport, loadFullReportBundle } from "@/lib/bedrijven/generate-full-report";
import { loadDeepScrape } from "@/lib/bedrijven/deep-scrape-storage";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, context: RouteContext) {
  const { slug } = await context.params;
  const businessId = slugToBusinessId(slug);
  const business = await findBusinessById(businessId);
  if (!business) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const report = (await loadFullReportBundle(businessId)).report;
  const deep = await loadDeepScrape(businessId);
  return NextResponse.json({ business, report, deep });
}

export async function POST(_req: Request, context: RouteContext) {
  const { slug } = await context.params;
  const businessId = slugToBusinessId(slug);
  const business = await findBusinessById(businessId);

  if (!business?.website?.trim()) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  try {
    const result = await generateFullBusinessReport(business);
    const deep = await loadDeepScrape(businessId);
    return NextResponse.json({
      business,
      report: result.report,
      deep,
      demoHomepageUrl: result.demoHomepageUrl,
      demoAppUrl: result.demoAppUrl,
      pagesScraped: result.pagesScraped,
      errors: result.deepScrapeErrors,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Full report failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
