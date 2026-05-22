import { NextRequest, NextResponse } from "next/server";
import { businessIdToDemoSlug, demoAppPublicPath } from "@/lib/bedrijven/demo-slug";
import {
  filterAuditRows,
  loadDemoReadyAudit,
  type HuisstijlFilter,
} from "@/lib/bedrijven/demo-ready-audit";
import {
  getDemoBrandEntry,
  loadDemoBrandsFile,
  refreshDemoBrandCache,
} from "@/lib/demo-homepage/demo-brand-registry";

const VALID_FILTERS: HuisstijlFilter[] = [
  "demoReady",
  "hasBrand",
  "hasLogo",
  "failed",
  "all",
];

export async function GET(request: NextRequest) {
  await refreshDemoBrandCache();
  const audit = await loadDemoReadyAudit();
  if (!audit) {
    return NextResponse.json(
      {
        error: "no_audit",
        message:
          "Geen audit gevonden. Draai: npx tsx scripts/count-demo-ready.ts",
      },
      { status: 404 },
    );
  }

  const { searchParams } = request.nextUrl;
  const filterParam = (searchParams.get("filter") ?? "demoReady") as HuisstijlFilter;
  const filter = VALID_FILTERS.includes(filterParam) ? filterParam : "demoReady";
  const q = (searchParams.get("q") ?? "").trim().toLowerCase();
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const limit = Math.min(
    200,
    Math.max(10, parseInt(searchParams.get("limit") ?? "50", 10) || 50),
  );

  let rows = filterAuditRows(audit.results, filter);
  if (q) {
    rows = rows.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.website.toLowerCase().includes(q),
    );
  }

  rows = [...rows].sort((a, b) => a.name.localeCompare(b.name, "nl"));

  const total = rows.length;
  const start = (page - 1) * limit;
  const pageRows = rows.slice(start, start + limit).map((r) => {
    const demoSlug = businessIdToDemoSlug(r.businessId);
    const brand = getDemoBrandEntry(demoSlug);
    return {
      ...r,
      demoSlug,
      demoAppUrl: demoAppPublicPath(demoSlug, "nl"),
      demo: brand
        ? {
            hasDemo: true,
            logoPath: brand.logoPath,
            logoOk: brand.logoOk,
            primaryColor: brand.primaryColor,
            secondaryColor: brand.secondaryColor,
            accentColor: brand.accentColor,
          }
        : {
            hasDemo: false,
            logoPath: null,
            logoOk: false,
            primaryColor: null,
            secondaryColor: null,
            accentColor: null,
          },
    };
  });

  const brandsFile = loadDemoBrandsFile();

  return NextResponse.json({
    summary: {
      ...audit.summary,
      demosGenerated: brandsFile?.demoReadyCount ?? 0,
      demosLogoOk: brandsFile?.logoOkCount ?? 0,
      brandsGeneratedAt: brandsFile?.generatedAt ?? null,
    },
    filter,
    q: q || null,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1,
    rows: pageRows,
  });
}
