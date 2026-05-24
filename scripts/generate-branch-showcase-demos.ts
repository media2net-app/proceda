/**
 * Eén showcase demo per outreach-verticale (voorbeeld huisstijl + copy).
 * Run: npx tsx scripts/generate-branch-showcase-demos.ts
 */
import fs from "fs/promises";
import path from "path";
import { AUTOPILOT_PIPELINE_BRANCH_IDS } from "../src/lib/bedrijven/autopilot-pipeline-branches";
import { BRANCHES, type ScrapeBranchId } from "../src/lib/bedrijven/branches";
import type { Bedrijf } from "../src/lib/bedrijven/types";
import type { DeepScrapeResult } from "../src/lib/bedrijven/deep-scrape-types";
import { SCRAPE_BRANCH_DEMO } from "../src/lib/demo-homepage/branch-config";
import { generateDemoHomepage } from "../src/lib/demo-homepage/generate-demo-homepage";

const SHOWCASE: Record<
  string,
  { name: string; colors: [string, string, string]; tagline: string }
> = {
  makelaardij: {
    name: "Voorbeeld Makelaardij",
    colors: ["#1e3a5f", "#2d5a87", "#c9a227"],
    tagline: "Uw makelaar in de regio",
  },
  installatie: {
    name: "Voorbeeld Installatiebedrijf",
    colors: ["#0f766e", "#14b8a6", "#f59e0b"],
    tagline: "Techniek & service voor particulier en zakelijk",
  },
  vastgoedbeheer: {
    name: "Voorbeeld Vastgoedbeheer",
    colors: ["#1e293b", "#475569", "#38bdf8"],
    tagline: "VvE- en verhuurbeheer met overzicht",
  },
  accountants: {
    name: "Voorbeeld Accountantskantoor",
    colors: ["#1d4ed8", "#3b82f6", "#10b981"],
    tagline: "Administratie en belastingadvies",
  },
  recruitment: {
    name: "Voorbeeld Recruitment",
    colors: ["#7c3aed", "#a78bfa", "#06b6d4"],
    tagline: "Werving, selectie en detachering",
  },
  verzekering: {
    name: "Voorbeeld Verzekeringsadvies",
    colors: ["#0369a1", "#0ea5e9", "#22c55e"],
    tagline: "Onafhankelijk verzekeringsadvies",
  },
};

function mockBusiness(branchId: ScrapeBranchId, cfg: (typeof SHOWCASE)[string]): Bedrijf {
  const id = `showcase/${branchId}`;
  return {
    id,
    placeId: id,
    name: cfg.name,
    category: "services",
    subcategory: branchId,
    address: "Voorbeeldstraat 1",
    city: "Nederland",
    province: "Nederland",
    provinceId: "noord-holland",
    branchId,
    phone: "020 123 4567",
    email: "info@voorbeeld.nl",
    website: `https://voorbeeld-${branchId}.nl`,
    source: "browser",
  };
}

function mockDeep(branchId: ScrapeBranchId, cfg: (typeof SHOWCASE)[string]): DeepScrapeResult {
  const id = `showcase/${branchId}`;
  return {
    businessId: id,
    businessName: cfg.name,
    website: `https://voorbeeld-${branchId}.nl`,
    scrapedAt: new Date().toISOString(),
    brand: {
      primaryColor: cfg.colors[0],
      secondaryColor: cfg.colors[1],
      accentColor: cfg.colors[2],
      textColor: "#1F2937",
      logoUrl: null,
      logoLocalPath: null,
      faviconUrl: null,
      heroImageUrl: null,
      heroImageLocalPath: null,
      fontFamily: null,
      allColors: [...cfg.colors],
    },
    pages: [],
    listings: [],
    allNavTexts: [],
    allImageUrls: [],
    contact: { emails: ["info@voorbeeld.nl"], phones: [], addresses: [] },
    tagline: cfg.tagline,
    services: [],
    aboutText: null,
    homepageScreenshotPath: null,
    errors: [],
  };
}

async function main() {
  console.log("Showcase demos per verticale:\n");

  for (const branchId of AUTOPILOT_PIPELINE_BRANCH_IDS) {
    const cfg = SHOWCASE[branchId as ScrapeBranchId];
    if (!cfg) continue;
    const demoBranch = SCRAPE_BRANCH_DEMO[branchId];
    const slug = `showcase-${branchId}`;
    const business = mockBusiness(branchId, cfg);
    const deep = mockDeep(branchId, cfg);

    const outDir = path.join(process.cwd(), "public", "demos", slug);
    await fs.rm(outDir, { recursive: true, force: true }).catch(() => undefined);

    const publicPath = await generateDemoHomepage(
      { ...business, id: `showcase/${branchId}` },
      deep,
    );

    console.log(
      `  ${BRANCHES[branchId]?.name ?? branchId} → template "${demoBranch}" → ${publicPath}`,
    );
  }

  console.log("\nOpen bv. http://localhost:3000/nl/demos/showcase-accountants");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
