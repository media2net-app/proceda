import fs from "fs/promises";
import { prisma } from "@/lib/db/prisma";
import type { ScrapeBranchId } from "./branches";
import { DEFAULT_BRANCH } from "./branches";
import {
  ensureLegacyCampaignMigrated,
  getDemoReadyAuditPath,
  LEGACY_DEMO_READY_AUDIT_PATH,
} from "./campaign-paths";

export type DemoReadyAuditRow = {
  businessId: string;
  name: string;
  website: string;
  ok: boolean;
  demoReady: boolean;
  hasLogo: boolean;
  hasColors: boolean;
  colorCount: number;
  primaryColor: string;
  secondaryColor?: string;
  accentColor?: string;
  brandColors?: string[];
  logoUrl: string | null;
  error: string | null;
};

export type DemoReadyAuditSummary = {
  scannedAt: string;
  totalWithEmail: number;
  probed: number;
  demoReady: number;
  demoReadyPct: number;
  hasLogoNotColors: number;
  hasColorsNotLogo: number;
  fetchFailed: number;
};

export type DemoReadyAuditFile = {
  summary: DemoReadyAuditSummary;
  results: DemoReadyAuditRow[];
};

export { getDemoReadyAuditPath } from "./campaign-paths";

function rowFromDb(
  r: {
    businessId: string;
    name: string;
    website: string;
    demoReady: boolean;
    logoOk: boolean;
    logoUrl: string | null;
    colorCount: number;
    colors: string[];
    error: string | null;
    row: unknown;
  },
): DemoReadyAuditRow {
  const extra = (r.row ?? {}) as Partial<DemoReadyAuditRow>;
  const hasColors = r.colorCount >= 2 || extra.hasColors === true;
  const hasLogo = r.logoOk || extra.hasLogo === true;
  const ok = extra.ok ?? (!r.error && (hasLogo || hasColors));
  return {
    businessId: r.businessId,
    name: r.name,
    website: r.website,
    ok,
    demoReady: r.demoReady,
    hasLogo,
    hasColors,
    colorCount: r.colorCount,
    primaryColor: extra.primaryColor ?? r.colors[0] ?? "",
    secondaryColor: extra.secondaryColor ?? r.colors[1],
    accentColor: extra.accentColor ?? r.colors[2],
    brandColors: r.colors.length ? r.colors : extra.brandColors,
    logoUrl: r.logoUrl,
    error: r.error,
  };
}

async function loadDemoReadyAuditFromDb(
  branchId: ScrapeBranchId,
): Promise<DemoReadyAuditFile | null> {
  const run = await prisma.brandAuditRun.findFirst({
    orderBy: { scannedAt: "desc" },
    include: { results: true },
  });
  if (!run) return null;

  const businessIds = run.results.map((r) => r.businessId);
  const businesses = await prisma.business.findMany({
    where: { id: { in: businessIds }, branchId },
    select: { id: true },
  });
  const allowed = new Set(businesses.map((b) => b.id));

  const summary = run.summary as DemoReadyAuditSummary;
  const results = run.results
    .filter((r) => allowed.has(r.businessId))
    .map(rowFromDb);
  if (results.length === 0) return null;
  return { summary, results };
}

async function loadDemoReadyAuditFromJson(
  branchId: ScrapeBranchId,
): Promise<DemoReadyAuditFile | null> {
  await ensureLegacyCampaignMigrated(DEFAULT_BRANCH);
  const paths = [getDemoReadyAuditPath(branchId)];
  if (branchId === DEFAULT_BRANCH) {
    paths.push(LEGACY_DEMO_READY_AUDIT_PATH);
  }
  for (const filePath of paths) {
    try {
      const raw = await fs.readFile(filePath, "utf-8");
      return JSON.parse(raw) as DemoReadyAuditFile;
    } catch {
      /* volgende pad */
    }
  }
  return null;
}

export async function loadDemoReadyAudit(
  branchId: ScrapeBranchId = DEFAULT_BRANCH,
): Promise<DemoReadyAuditFile | null> {
  const fromDb = await loadDemoReadyAuditFromDb(branchId);
  if (fromDb && fromDb.results.length > 0) return fromDb;
  return loadDemoReadyAuditFromJson(branchId);
}

export type HuisstijlFilter = "demoReady" | "hasBrand" | "hasLogo" | "failed" | "all";

export function filterAuditRows(
  rows: DemoReadyAuditRow[],
  filter: HuisstijlFilter,
): DemoReadyAuditRow[] {
  switch (filter) {
    case "demoReady":
      return rows.filter((r) => r.demoReady);
    case "hasBrand":
      return rows.filter((r) => r.ok && (r.hasLogo || r.hasColors));
    case "hasLogo":
      return rows.filter((r) => r.hasLogo);
    case "failed":
      return rows.filter((r) => !r.ok);
    default:
      return rows;
  }
}
