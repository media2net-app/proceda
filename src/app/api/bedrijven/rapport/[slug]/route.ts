import { NextResponse } from "next/server";
import { loadBusinessReport } from "@/lib/bedrijven/business-report-storage";
import { enrichBusinessReport } from "@/lib/bedrijven/enrich-report";
import { slugToBusinessId } from "@/lib/bedrijven/slug";
import { findBusinessById } from "@/lib/bedrijven/load-all-businesses";
import { generateBusinessReport } from "@/lib/bedrijven/generate-business-report";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, context: RouteContext) {
  const { slug } = await context.params;
  const businessId = slugToBusinessId(slug);
  const business = await findBusinessById(businessId);

  if (!business?.website?.trim()) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const raw = await loadBusinessReport(businessId);
  const report = raw ? enrichBusinessReport(raw, business) : null;
  return NextResponse.json({ business, report });
}

export async function POST(_req: Request, context: RouteContext) {
  const { slug } = await context.params;
  const businessId = slugToBusinessId(slug);
  const business = await findBusinessById(businessId);

  if (!business?.website?.trim()) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  try {
    const report = await generateBusinessReport(business);
    return NextResponse.json({ business, report });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Report generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
