import "server-only";

import fs from "fs/promises";
import type { ScrapeBranchId } from "@/lib/bedrijven/branches";
import {
  ensureCampaignDir,
  getDemoReadyAuditPath,
} from "@/lib/bedrijven/campaign-paths";
import {
  extractBrandFromHtml,
  pickBrandPalette,
} from "@/lib/bedrijven/brand-extraction";
import {
  assessBrandFromHtml,
  canAttemptDemoProbe,
  isDemoBrandReady,
} from "@/lib/bedrijven/demo-ready";
import type {
  DemoReadyAuditFile,
  DemoReadyAuditRow,
} from "@/lib/bedrijven/demo-ready-audit";
import { hasAutoMailerContact } from "@/lib/bedrijven/contact-utils";
import { loadAllBusinesses } from "@/lib/bedrijven/load-all-businesses";
import { prisma } from "@/lib/db/prisma";
import type { Bedrijf } from "@/lib/bedrijven/types";

export type DemoProbeBatchResult = {
  probed: number;
  newlyDemoReady: number;
  demoReadyTotal: number;
  withEmailTotal: number;
  alreadyAudited: number;
  remainingToAudit: number;
  rows: DemoReadyAuditRow[];
};

async function fetchHtml(
  website: string,
): Promise<{ html: string; url: string } | null> {
  let url = website.trim();
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(18_000),
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; ProcedaBot/1.0; +https://proceda.nl)",
        Accept: "text/html",
      },
    });
    if (!res.ok) return null;
    const html = await res.text();
    if (html.length < 200) return null;
    return { html, url: res.url };
  } catch {
    return null;
  }
}

export async function probeBusinessForDemo(
  b: Bedrijf,
): Promise<DemoReadyAuditRow> {
  const website = b.website!.trim();
  const fetched = await fetchHtml(website);
  if (!fetched) {
    return {
      businessId: b.id,
      name: b.name,
      website,
      ok: false,
      demoReady: false,
      hasLogo: false,
      hasColors: false,
      colorCount: 0,
      primaryColor: "",
      logoUrl: null,
      error: "fetch_failed",
    };
  }

  const extracted = extractBrandFromHtml(fetched.html, fetched.url);
  const palette = pickBrandPalette(extracted.colors);
  const q = assessBrandFromHtml(fetched.html, fetched.url);
  const brandColors = [...new Set(extracted.colors)].slice(0, 8);

  return {
    businessId: b.id,
    name: b.name,
    website,
    ok: true,
    demoReady: isDemoBrandReady(q),
    hasLogo: q.hasLogo,
    hasColors: q.hasExtractedColors,
    colorCount: q.colorCount,
    primaryColor: palette.primaryColor,
    secondaryColor: palette.secondaryColor,
    accentColor: palette.accentColor,
    brandColors,
    logoUrl: extracted.logoUrl,
    error: null,
  };
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  if (items.length === 0) return [];
  const results = new Array<R>(items.length);
  let next = 0;
  async function worker() {
    for (;;) {
      const i = next++;
      if (i >= items.length) return;
      results[i] = await fn(items[i]!);
    }
  }
  const workers = Math.min(Math.max(1, concurrency), items.length);
  await Promise.all(Array.from({ length: workers }, () => worker()));
  return results;
}

export async function loadBranchDemoAudit(
  branchId: ScrapeBranchId,
): Promise<DemoReadyAuditFile> {
  const filePath = getDemoReadyAuditPath(branchId);
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw) as DemoReadyAuditFile;
  } catch {
    return {
      summary: {
        scannedAt: new Date().toISOString(),
        totalWithEmail: 0,
        probed: 0,
        demoReady: 0,
        demoReadyPct: 0,
        hasLogoNotColors: 0,
        hasColorsNotLogo: 0,
        fetchFailed: 0,
      },
      results: [],
    };
  }
}

async function ensureAuditRun(branchId: ScrapeBranchId): Promise<string> {
  const existing = await prisma.brandAuditRun.findFirst({
    orderBy: { scannedAt: "desc" },
  });
  const summary = (existing?.summary ?? {}) as Record<string, unknown>;
  if (existing && summary.branchId === branchId) return existing.id;

  const run = await prisma.brandAuditRun.create({
    data: {
      scannedAt: new Date(),
      summary: { branchId, scannedAt: new Date().toISOString() },
    },
  });
  return run.id;
}

export async function syncDemoAuditRowToDb(
  runId: string,
  row: DemoReadyAuditRow,
): Promise<void> {
  await prisma.brandAuditResult.upsert({
    where: { businessId: row.businessId },
    create: {
      businessId: row.businessId,
      runId,
      name: row.name,
      website: row.website,
      demoReady: row.demoReady,
      logoOk: row.hasLogo,
      logoUrl: row.logoUrl,
      colorCount: row.colorCount,
      colors:
        row.brandColors ??
        ([row.primaryColor, row.secondaryColor, row.accentColor].filter(
          Boolean,
        ) as string[]),
      error: row.error,
      row: row as object,
    },
    update: {
      runId,
      name: row.name,
      website: row.website,
      demoReady: row.demoReady,
      logoOk: row.hasLogo,
      logoUrl: row.logoUrl,
      colorCount: row.colorCount,
      colors:
        row.brandColors ??
        ([row.primaryColor, row.secondaryColor, row.accentColor].filter(
          Boolean,
        ) as string[]),
      error: row.error,
      row: row as object,
    },
  });
}

export async function saveBranchDemoAudit(
  branchId: ScrapeBranchId,
  audit: DemoReadyAuditFile,
): Promise<void> {
  await ensureCampaignDir(branchId);
  const filePath = getDemoReadyAuditPath(branchId);
  await fs.writeFile(filePath, JSON.stringify(audit, null, 2), "utf-8");
}

export async function countBranchDemoReady(
  branchId: ScrapeBranchId,
): Promise<number> {
  return prisma.brandAuditResult.count({
    where: { demoReady: true, business: { branchId } },
  });
}

export type DemoProbeBatchOptions = {
  limit?: number;
  concurrency?: number;
  onProbe?: (row: DemoReadyAuditRow) => Promise<void>;
};

export async function runDemoReadyProbeBatch(
  branchId: ScrapeBranchId,
  options?: DemoProbeBatchOptions,
): Promise<DemoProbeBatchResult> {
  const limit = options?.limit ?? 25;
  const concurrency = options?.concurrency ?? 8;

  const all = await loadAllBusinesses(branchId);
  const withEmail = all.filter((b) => hasAutoMailerContact(b));
  const audit = await loadBranchDemoAudit(branchId);
  const byId = new Map(audit.results.map((r) => [r.businessId, r]));

  const candidates = withEmail.filter((b) => {
    if (!canAttemptDemoProbe(b)) return false;
    const prev = byId.get(b.id);
    if (!prev) return true;
    if (prev.error === "fetch_failed") return true;
    return false;
  });

  candidates.sort((a, b) => {
    const score = (id: string) => {
      const prev = byId.get(id);
      if (!prev) return 0;
      if (prev.error === "fetch_failed") return 1;
      return 2;
    };
    return score(a.id) - score(b.id);
  });

  const toProbe = candidates.slice(0, limit);
  const alreadyAudited = withEmail.filter((b) => byId.has(b.id)).length;

  const runId = await ensureAuditRun(branchId);
  let newlyDemoReady = 0;
  const newRows: DemoReadyAuditRow[] = [];

  const probed = await mapWithConcurrency(toProbe, concurrency, async (b) => {
    const row = await probeBusinessForDemo(b);
    byId.set(b.id, row);
    await syncDemoAuditRowToDb(runId, row);
    if (row.demoReady) {
      const wasReady = audit.results.find((r) => r.businessId === b.id)?.demoReady;
      if (!wasReady) newlyDemoReady++;
    }
    newRows.push(row);
    await options?.onProbe?.(row);
    return row;
  });

  const results = Array.from(byId.values());
  const demoReady = results.filter((r) => r.demoReady).length;
  const hasLogoOnly = results.filter((r) => r.hasLogo && !r.hasColors);
  const hasColorsOnly = results.filter((r) => !r.hasLogo && r.hasColors);
  const fetchFailed = results.filter((r) => !r.ok);

  const nextAudit: DemoReadyAuditFile = {
    summary: {
      scannedAt: new Date().toISOString(),
      totalWithEmail: withEmail.length,
      probed: results.length,
      demoReady,
      demoReadyPct:
        results.length > 0
          ? Math.round((demoReady / results.length) * 1000) / 10
          : 0,
      hasLogoNotColors: hasLogoOnly.length,
      hasColorsNotLogo: hasColorsOnly.length,
      fetchFailed: fetchFailed.length,
    },
    results,
  };

  await saveBranchDemoAudit(branchId, nextAudit);

  const demoReadyTotal = await countBranchDemoReady(branchId);

  return {
    probed: probed.length,
    newlyDemoReady,
    demoReadyTotal,
    withEmailTotal: withEmail.length,
    alreadyAudited,
    remainingToAudit: Math.max(0, candidates.length - toProbe.length),
    rows: newRows,
  };
}
