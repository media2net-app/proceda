import fs from "fs";
import { prisma } from "@/lib/db/prisma";
import type { ScrapeBranchId } from "@/lib/bedrijven/branches";
import { DEFAULT_BRANCH } from "@/lib/bedrijven/branches";
import {
  ensureLegacyCampaignMigrated,
  getDemoBrandsPath,
  LEGACY_DEMO_BRANDS_PATH,
} from "@/lib/bedrijven/campaign-paths";
import type { BrandOverride } from "./brand-overrides";
import { BRAND_OVERRIDES } from "./brand-overrides";

export type DemoBrandEntry = {
  businessId: string;
  demoSlug: string;
  businessName: string;
  website: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  textColor: string;
  logoPath: string;
  logoOk: boolean;
};

export type DemoBrandsFile = {
  generatedAt: string;
  demoReadyCount: number;
  logoOkCount: number;
  brands: Record<string, DemoBrandEntry>;
};

let cached: DemoBrandsFile | null = null;
let cachedBranchId: ScrapeBranchId | null = null;
let dbBrandMap: Map<string, DemoBrandEntry> | null = null;

function rowToEntry(row: {
  demoSlug: string;
  businessId: string | null;
  businessName: string;
  website: string;
  primary: string | null;
  secondary: string | null;
  accent: string | null;
  textColor: string | null;
  logoPath: string | null;
  logoOk: boolean;
}): DemoBrandEntry {
  return {
    businessId: row.businessId ?? `manual/${row.demoSlug}`,
    demoSlug: row.demoSlug,
    businessName: row.businessName,
    website: row.website,
    primaryColor: row.primary ?? "#7F56D9",
    secondaryColor: row.secondary ?? "#101828",
    accentColor: row.accent ?? row.primary ?? "#7F56D9",
    textColor: row.textColor ?? "#1F2937",
    logoPath: row.logoPath ?? `/demos/${row.demoSlug}/assets/logo.png`,
    logoOk: row.logoOk,
  };
}

export async function refreshDemoBrandCache(
  branchId: ScrapeBranchId = DEFAULT_BRANCH,
): Promise<void> {
  if (cachedBranchId !== branchId) {
    cached = null;
    cachedBranchId = branchId;
  }
  const rows = await prisma.demoBrand.findMany();
  dbBrandMap = new Map(rows.map((r) => [r.demoSlug, rowToEntry(r)]));
}

function loadBrandsFile(branchId: ScrapeBranchId): DemoBrandsFile | null {
  if (cached && cachedBranchId === branchId) return cached;
  const paths = [getDemoBrandsPath(branchId)];
  if (branchId === DEFAULT_BRANCH) paths.push(LEGACY_DEMO_BRANDS_PATH);
  for (const filePath of paths) {
    try {
      const raw = fs.readFileSync(filePath, "utf-8");
      cached = JSON.parse(raw) as DemoBrandsFile;
      cachedBranchId = branchId;
      return cached;
    } catch {
      /* volgende */
    }
  }
  return null;
}

export function loadDemoBrandsFile(
  branchId: ScrapeBranchId = DEFAULT_BRANCH,
): DemoBrandsFile | null {
  if (dbBrandMap && dbBrandMap.size > 0) {
    const brands: Record<string, DemoBrandEntry> = {};
    for (const [slug, entry] of dbBrandMap) brands[slug] = entry;
    return {
      generatedAt: new Date().toISOString(),
      demoReadyCount: dbBrandMap.size,
      logoOkCount: [...dbBrandMap.values()].filter((b) => b.logoOk).length,
      brands,
    };
  }
  return loadBrandsFile(branchId);
}

export function getDemoBrandEntry(demoSlug: string): DemoBrandEntry | null {
  const fromDb = dbBrandMap?.get(demoSlug);
  if (fromDb) return fromDb;

  const file = loadBrandsFile(cachedBranchId ?? DEFAULT_BRANCH);
  const fromRegistry = file?.brands[demoSlug];
  if (fromRegistry) return fromRegistry;

  const manual = BRAND_OVERRIDES[demoSlug];
  if (!manual) return null;

  return {
    businessId: `manual/${demoSlug}`,
    demoSlug,
    businessName:
      demoSlug === "schenkel-makelaardij"
        ? "Schenkel Makelaardij"
        : demoSlug.replace(/-/g, " "),
    website: "",
    primaryColor: manual.primaryColor,
    secondaryColor: manual.secondaryColor,
    accentColor: manual.accentColor,
    textColor: manual.textColor,
    logoPath: manual.logoPath,
    logoOk: true,
  };
}

export function getBrandOverrideFromRegistry(
  demoSlug: string,
): BrandOverride | null {
  const entry = getDemoBrandEntry(demoSlug);
  if (!entry) return BRAND_OVERRIDES[demoSlug] ?? null;

  return {
    primaryColor: entry.primaryColor,
    secondaryColor: entry.secondaryColor,
    accentColor: entry.accentColor,
    textColor: entry.textColor,
    logoPath: entry.logoPath,
  };
}

export function hasDemoBrand(demoSlug: string): boolean {
  return !!getDemoBrandEntry(demoSlug);
}

export function listDemoBrandSlugs(): string[] {
  if (dbBrandMap && dbBrandMap.size > 0) {
    return [...dbBrandMap.keys()].sort();
  }
  const file = loadBrandsFile(cachedBranchId ?? DEFAULT_BRANCH);
  if (file) return Object.keys(file.brands).sort();
  return Object.keys(BRAND_OVERRIDES).sort();
}

export function clearDemoBrandRegistryCache(): void {
  cached = null;
  cachedBranchId = null;
  dbBrandMap = null;
}
