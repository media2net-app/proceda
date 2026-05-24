import "server-only";

import { prisma } from "@/lib/db/prisma";
import {
  getBrowserLeadSearchQueries,
  type ScrapeBranchId,
} from "./branches";
import type { ScrapeRegionId } from "./regions";
import { PROVINCE_IDS, type ProvinceConfig } from "./provinces";

export type BrowserScrapeProgressState = {
  branch: ScrapeBranchId;
  province: ScrapeRegionId;
  queries: string[];
  queryIndex: number;
  urlQueue: string[];
  enrichedHosts: string[];
  discoveryComplete: boolean;
  active?: boolean;
  phase?: string;
  percent?: number;
  log?: string[];
  updatedAt: string;
};

function parseUrlQueue(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((v): v is string => typeof v === "string");
}

function rowToState(
  branchId: ScrapeBranchId,
  regionId: ScrapeRegionId,
  row: {
    queries: string[];
    queryIndex: number;
    urlQueue: unknown;
    enrichedHosts: string[];
    discoveryComplete: boolean;
    active: boolean | null;
    phase: string | null;
    percent: number | null;
    log: string[];
    updatedAt: Date;
  },
): BrowserScrapeProgressState {
  return {
    branch: branchId,
    province: regionId,
    queries: row.queries,
    queryIndex: row.queryIndex,
    urlQueue: parseUrlQueue(row.urlQueue),
    enrichedHosts: row.enrichedHosts,
    discoveryComplete: row.discoveryComplete,
    active: row.active ?? undefined,
    phase: row.phase ?? undefined,
    percent: row.percent ?? undefined,
    log: row.log,
    updatedAt: row.updatedAt.toISOString(),
  };
}

function freshProgress(
  branchId: ScrapeBranchId,
  regionId: ScrapeRegionId,
  province: ProvinceConfig,
): BrowserScrapeProgressState {
  return {
    branch: branchId,
    province: regionId,
    queries: getBrowserLeadSearchQueries(branchId, province),
    queryIndex: 0,
    urlQueue: [],
    enrichedHosts: [],
    discoveryComplete: false,
    updatedAt: new Date().toISOString(),
  };
}

export async function loadBrowserScrapeProgressFromDb(
  branchId: ScrapeBranchId,
  regionId: ScrapeRegionId,
  province: ProvinceConfig,
): Promise<BrowserScrapeProgressState> {
  const row = await prisma.browserScrapeProgress.findUnique({
    where: { branchId_regionId: { branchId, regionId } },
  });
  if (!row) return freshProgress(branchId, regionId, province);
  const state = rowToState(branchId, regionId, row);
  if (state.queries.length === 0) {
    state.queries = getBrowserLeadSearchQueries(branchId, province);
  }
  return state;
}

export async function saveBrowserScrapeProgressToDb(
  progress: BrowserScrapeProgressState,
): Promise<void> {
  await prisma.browserScrapeProgress.upsert({
    where: {
      branchId_regionId: {
        branchId: progress.branch,
        regionId: progress.province,
      },
    },
    create: {
      branchId: progress.branch,
      regionId: progress.province,
      queries: progress.queries,
      queryIndex: progress.queryIndex,
      urlQueue: progress.urlQueue,
      enrichedHosts: progress.enrichedHosts,
      discoveryComplete: progress.discoveryComplete,
      active: progress.active ?? null,
      phase: progress.phase ?? null,
      percent: progress.percent ?? null,
      log: progress.log ?? [],
    },
    update: {
      queries: progress.queries,
      queryIndex: progress.queryIndex,
      urlQueue: progress.urlQueue,
      enrichedHosts: progress.enrichedHosts,
      discoveryComplete: progress.discoveryComplete,
      active: progress.active ?? null,
      phase: progress.phase ?? null,
      percent: progress.percent ?? null,
      log: progress.log ?? [],
    },
  });
}

export async function touchBrowserScrapeBatchAttempt(
  branchId: ScrapeBranchId,
  regionId: ScrapeRegionId,
): Promise<void> {
  const now = new Date();
  await prisma.browserScrapeProgress.upsert({
    where: { branchId_regionId: { branchId, regionId } },
    create: {
      branchId,
      regionId,
      lastBatchAttemptAt: now,
    },
    update: { lastBatchAttemptAt: now },
  });
}

export async function browserScrapeBatchCooldown(
  branchId: ScrapeBranchId,
  regionId: ScrapeRegionId,
  minIntervalMs: number,
): Promise<{ allowed: boolean; waitSeconds?: number }> {
  const row = await prisma.browserScrapeProgress.findUnique({
    where: { branchId_regionId: { branchId, regionId } },
    select: { lastBatchAttemptAt: true },
  });
  if (!row?.lastBatchAttemptAt) return { allowed: true };
  const elapsed = Date.now() - row.lastBatchAttemptAt.getTime();
  if (elapsed >= minIntervalMs) return { allowed: true };
  return {
    allowed: false,
    waitSeconds: Math.ceil((minIntervalMs - elapsed) / 1000),
  };
}

function isProgressExhausted(progress: BrowserScrapeProgressState): boolean {
  if (!progress.discoveryComplete) return false;
  const enriched = new Set(progress.enrichedHosts ?? []);
  const pending = (progress.urlQueue ?? []).filter((url) => {
    try {
      return !enriched.has(new URL(url).hostname);
    } catch {
      return false;
    }
  });
  return pending.length === 0;
}

export async function isProvinceBrowserScrapeExhaustedInDb(
  branchId: ScrapeBranchId,
  regionId: ScrapeRegionId,
): Promise<boolean> {
  const row = await prisma.browserScrapeProgress.findUnique({
    where: { branchId_regionId: { branchId, regionId } },
  });
  if (!row) return false;
  return isProgressExhausted(rowToState(branchId, regionId, row));
}

export async function isBranchBrowserScrapeExhaustedInDb(
  branchId: ScrapeBranchId,
): Promise<boolean> {
  let anyStarted = false;
  for (const provinceId of PROVINCE_IDS) {
    const row = await prisma.browserScrapeProgress.findUnique({
      where: { branchId_regionId: { branchId, regionId: provinceId } },
    });
    if (!row) return false;
    anyStarted = true;
    if (!isProgressExhausted(rowToState(branchId, provinceId, row))) {
      return false;
    }
  }
  return anyStarted;
}

export async function deleteBrowserScrapeProgressForBranch(
  branchId: ScrapeBranchId,
): Promise<number> {
  const result = await prisma.browserScrapeProgress.deleteMany({
    where: { branchId },
  });
  return result.count;
}
