import fs from "fs";
import path from "path";
import { prisma } from "@/lib/db/prisma";
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

const BRANDS_PATH = path.join(process.cwd(), "data", "demo-brands.json");

let cached: DemoBrandsFile | null = null;
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

export async function refreshDemoBrandCache(): Promise<void> {
  const rows = await prisma.demoBrand.findMany();
  dbBrandMap = new Map(rows.map((r) => [r.demoSlug, rowToEntry(r)]));
}

function loadBrandsFile(): DemoBrandsFile | null {
  if (cached) return cached;
  try {
    const raw = fs.readFileSync(BRANDS_PATH, "utf-8");
    cached = JSON.parse(raw) as DemoBrandsFile;
    return cached;
  } catch {
    return null;
  }
}

export function loadDemoBrandsFile(): DemoBrandsFile | null {
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
  return loadBrandsFile();
}

export function getDemoBrandEntry(demoSlug: string): DemoBrandEntry | null {
  const fromDb = dbBrandMap?.get(demoSlug);
  if (fromDb) return fromDb;

  const file = loadBrandsFile();
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
  const file = loadBrandsFile();
  if (file) return Object.keys(file.brands).sort();
  return Object.keys(BRAND_OVERRIDES).sort();
}

export function clearDemoBrandRegistryCache(): void {
  cached = null;
  dbBrandMap = null;
}
