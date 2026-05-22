import fs from "fs/promises";
import path from "path";
import { prisma } from "@/lib/db/prisma";

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

const AUDIT_PATH = path.join(process.cwd(), "data", "demo-ready-audit.json");

export function getDemoReadyAuditPath(): string {
  return AUDIT_PATH;
}

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

async function loadDemoReadyAuditFromDb(): Promise<DemoReadyAuditFile | null> {
  const run = await prisma.brandAuditRun.findFirst({
    orderBy: { scannedAt: "desc" },
    include: { results: true },
  });
  if (!run) return null;

  const summary = run.summary as DemoReadyAuditSummary;
  const results = run.results.map(rowFromDb);
  return { summary, results };
}

async function loadDemoReadyAuditFromJson(): Promise<DemoReadyAuditFile | null> {
  try {
    const raw = await fs.readFile(AUDIT_PATH, "utf-8");
    return JSON.parse(raw) as DemoReadyAuditFile;
  } catch {
    return null;
  }
}

export async function loadDemoReadyAudit(): Promise<DemoReadyAuditFile | null> {
  const fromDb = await loadDemoReadyAuditFromDb();
  if (fromDb && fromDb.results.length > 0) return fromDb;
  return loadDemoReadyAuditFromJson();
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
