import "server-only";

import fs from "fs/promises";
import path from "path";
import type { ScrapeBranchId } from "@/lib/bedrijven/branches";
import { businessIdToDemoSlug } from "@/lib/bedrijven/demo-slug";
import { patchReportDemoUrls } from "@/lib/bedrijven/patch-demo-urls";
import {
  ensureCampaignDir,
  getDemoBrandsPath,
} from "@/lib/bedrijven/campaign-paths";
import { loadBranchDemoAudit } from "@/lib/bedrijven/demo-ready-probe";
import type { DemoReadyAuditRow } from "@/lib/bedrijven/demo-ready-audit";
import type { DeepScrapeResult } from "@/lib/bedrijven/deep-scrape-types";
import { loadAllBusinesses } from "@/lib/bedrijven/load-all-businesses";
import type { Bedrijf } from "@/lib/bedrijven/types";
import {
  clearDemoBrandRegistryCache,
  type DemoBrandEntry,
  type DemoBrandsFile,
} from "@/lib/demo-homepage/demo-brand-registry";
import { generateDemoHomepage } from "@/lib/demo-homepage/generate-demo-homepage";
import { prisma } from "@/lib/db/prisma";

const SHARED_LISTINGS_SRC = path.join(
  process.cwd(),
  "public",
  "demos",
  "schenkel-makelaardij",
  "assets",
  "listings",
);
const SHARED_LISTINGS_DEST = path.join(
  process.cwd(),
  "public",
  "demos",
  "_shared",
  "listings",
);

async function ensureSharedListingThumbs(): Promise<void> {
  await fs.mkdir(SHARED_LISTINGS_DEST, { recursive: true });
  for (let i = 0; i < 6; i++) {
    const src = path.join(SHARED_LISTINGS_SRC, `${i}.webp`);
    const dest = path.join(SHARED_LISTINGS_DEST, `${i}.webp`);
    try {
      await fs.copyFile(src, dest);
    } catch {
      /* optioneel */
    }
  }
}

function extFromUrl(url: string, contentType: string | null): string {
  const lower = url.toLowerCase();
  if (contentType?.includes("svg") || lower.endsWith(".svg")) return "svg";
  if (contentType?.includes("webp") || lower.endsWith(".webp")) return "webp";
  if (
    contentType?.includes("jpeg") ||
    lower.endsWith(".jpg") ||
    lower.endsWith(".jpeg")
  ) {
    return "jpg";
  }
  if (contentType?.includes("png") || lower.endsWith(".png")) return "png";
  return "png";
}

async function downloadLogo(
  logoUrl: string,
  demoSlug: string,
  assetsDir: string,
): Promise<{ logoPath: string; ok: boolean }> {
  try {
    const res = await fetch(logoUrl, {
      signal: AbortSignal.timeout(20_000),
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; ProcedaBot/1.0; +https://proceda.nl)",
        Accept: "image/*,*/*",
      },
    });
    if (!res.ok) return { logoPath: "", ok: false };
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 80) return { logoPath: "", ok: false };
    const ext = extFromUrl(logoUrl, res.headers.get("content-type"));
    const filename = `logo.${ext}`;
    await fs.writeFile(path.join(assetsDir, filename), buf);
    return { logoPath: `/demos/${demoSlug}/assets/${filename}`, ok: true };
  } catch {
    return { logoPath: "", ok: false };
  }
}

function mockDeepFromRow(row: DemoReadyAuditRow, business: Bedrijf): DeepScrapeResult {
  const colors =
    row.brandColors ??
    [row.primaryColor, row.secondaryColor, row.accentColor].filter(Boolean);
  return {
    businessId: business.id,
    businessName: business.name,
    website: row.website,
    scrapedAt: new Date().toISOString(),
    brand: {
      primaryColor: row.primaryColor || "#1e3a5f",
      secondaryColor: row.secondaryColor || "#2d5a87",
      accentColor: row.accentColor || "#c9a227",
      textColor: "#1F2937",
      logoUrl: row.logoUrl,
      logoLocalPath: null,
      faviconUrl: null,
      heroImageUrl: null,
      heroImageLocalPath: null,
      fontFamily: null,
      allColors: colors as string[],
    },
    pages: [],
    listings: [],
    allNavTexts: [],
    allImageUrls: [],
    contact: {
      emails: business.email ? [business.email] : [],
      phones: business.phone ? [business.phone] : [],
      addresses: [],
    },
    tagline: null,
    services: [],
    aboutText: null,
    homepageScreenshotPath: null,
    errors: [],
  };
}

async function processDemoRow(
  row: DemoReadyAuditRow,
  business: Bedrijf,
): Promise<{ entry: DemoBrandEntry; homepage: boolean }> {
  const demoSlug = businessIdToDemoSlug(row.businessId);
  const assetsDir = path.join(process.cwd(), "public", "demos", demoSlug, "assets");
  await fs.mkdir(assetsDir, { recursive: true });

  let logoPath = `/demos/${demoSlug}/assets/logo.png`;
  let logoOk = false;

  if (row.logoUrl) {
    const dl = await downloadLogo(row.logoUrl, demoSlug, assetsDir);
    if (dl.ok && dl.logoPath) {
      logoPath = dl.logoPath;
      logoOk = true;
    }
  }

  const entry: DemoBrandEntry = {
    businessId: row.businessId,
    demoSlug,
    businessName: row.name,
    website: row.website,
    primaryColor: row.primaryColor ?? "#1e3a5f",
    secondaryColor: row.secondaryColor ?? "#2d5a87",
    accentColor: row.accentColor ?? "#c9a227",
    textColor: "#1F2937",
    logoPath: logoOk ? logoPath : row.logoUrl ? logoPath : `/demos/${demoSlug}/assets/logo.png`,
    logoOk,
  };

  await patchReportDemoUrls(row.businessId);

  let homepage = false;
  try {
    await generateDemoHomepage(business, mockDeepFromRow(row, business));
    homepage = true;
  } catch {
    homepage = false;
  }

  await prisma.demoBrand.upsert({
    where: { demoSlug },
    create: {
      demoSlug,
      businessId: row.businessId,
      businessName: row.name,
      website: row.website,
      primary: entry.primaryColor,
      secondary: entry.secondaryColor,
      accent: entry.accentColor,
      textColor: entry.textColor,
      logoPath: entry.logoPath,
      logoOk: entry.logoOk,
    },
    update: {
      businessName: row.name,
      website: row.website,
      primary: entry.primaryColor,
      secondary: entry.secondaryColor,
      accent: entry.accentColor,
      textColor: entry.textColor,
      logoPath: entry.logoPath,
      logoOk: entry.logoOk,
    },
  });

  return { entry, homepage };
}

export type DemoGenerateBatchResult = {
  generated: number;
  homepages: number;
  skipped: number;
  pendingDemoReady: number;
  slugs: string[];
};

export type DemoGenerateBatchOptions = {
  limit?: number;
  concurrency?: number;
  onGenerated?: (payload: {
    name: string;
    demoSlug: string;
    homepage: boolean;
  }) => Promise<void>;
};

export async function runDemoBrandGenerationBatch(
  branchId: ScrapeBranchId,
  options?: DemoGenerateBatchOptions,
): Promise<DemoGenerateBatchResult> {
  const limit = options?.limit ?? 12;
  const concurrency = options?.concurrency ?? 6;

  await ensureCampaignDir(branchId);
  const audit = await loadBranchDemoAudit(branchId);
  const businesses = await loadAllBusinesses(branchId);
  const byId = new Map(businesses.map((b) => [b.id, b]));

  const branchBusinessIds = businesses.map((b) => b.id);
  const existingSlugs = new Set(
    branchBusinessIds.length === 0
      ? []
      : (
          await prisma.demoBrand.findMany({
            where: { businessId: { in: branchBusinessIds } },
            select: { demoSlug: true },
          })
        ).map((r) => r.demoSlug),
  );

  const pending = audit.results.filter(
    (r) => r.demoReady && byId.has(r.businessId),
  );
  const targets = pending
    .filter((r) => !existingSlugs.has(businessIdToDemoSlug(r.businessId)))
    .slice(0, limit);

  if (targets.length === 0) {
    return {
      generated: 0,
      homepages: 0,
      skipped: 0,
      pendingDemoReady: pending.length,
      slugs: [],
    };
  }

  await ensureSharedListingThumbs();

  const outPath = getDemoBrandsPath(branchId);
  let merged: Record<string, DemoBrandEntry> = {};
  try {
    const prev = JSON.parse(await fs.readFile(outPath, "utf-8")) as DemoBrandsFile;
    merged = { ...prev.brands };
  } catch {
    /* fresh */
  }

  const slugs: string[] = [];
  let homepages = 0;
  let idx = 0;

  async function worker() {
    for (;;) {
      const i = idx++;
      if (i >= targets.length) return;
      const row = targets[i]!;
      const business = byId.get(row.businessId)!;
      const { entry, homepage } = await processDemoRow(row, business);
      merged[entry.demoSlug] = entry;
      slugs.push(entry.demoSlug);
      if (homepage) homepages++;
      await options?.onGenerated?.({
        name: entry.businessName,
        demoSlug: entry.demoSlug,
        homepage,
      });
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, targets.length) }, () => worker()),
  );

  const out: DemoBrandsFile = {
    generatedAt: new Date().toISOString(),
    demoReadyCount: Object.keys(merged).length,
    logoOkCount: Object.values(merged).filter((b) => b.logoOk).length,
    brands: merged,
  };

  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, JSON.stringify(out, null, 2), "utf-8");
  clearDemoBrandRegistryCache();

  return {
    generated: slugs.length,
    homepages,
    skipped: pending.length - targets.length,
    pendingDemoReady: pending.length,
    slugs,
  };
}
