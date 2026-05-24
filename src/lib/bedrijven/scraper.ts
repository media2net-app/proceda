import fs from "fs/promises";
import path from "path";
import {
  DEFAULT_BRANCH,
  resolveBranchId,
  resolveRegionId,
  type ScrapeBranchId,
} from "./branches";
import type { ScrapeRegionId } from "./regions";
import { getProvince } from "./provinces";
import type {
  BedrijvenCache,
  ScrapeBatchOptions,
  ScrapeBatchResult,
  ScrapeProgress,
} from "./types";
import { loadBedrijvenCacheFromDb } from "./business-db";
import {
  getBrowserScrapeStatus,
  loadBrowserScrapeProgressLegacy,
  resetBrowserProvinceScrape,
  scrapeBedrijvenBatchBrowser,
  stopBrowserProvinceScrape,
} from "./browser-lead-scraper";

const DATA_ROOT = path.join(process.cwd(), "data", "bedrijven");
const META_PATH = path.join(process.cwd(), "data", "bedrijven-meta.json");
const MIN_BATCH_INTERVAL_MS = 3_000;

function branchDir(branchId: ScrapeBranchId) {
  return path.join(DATA_ROOT, branchId);
}

function cachePath(branchId: ScrapeBranchId, regionId: ScrapeRegionId) {
  return path.join(branchDir(branchId), `${regionId}.json`);
}

export async function loadScrapeProgress(
  branchId: ScrapeBranchId,
  regionId: ScrapeRegionId,
): Promise<ScrapeProgress> {
  return loadBrowserScrapeProgressLegacy(branchId, regionId);
}

export async function loadBedrijvenCache(
  branchId: ScrapeBranchId = DEFAULT_BRANCH,
  regionId?: ScrapeRegionId,
): Promise<BedrijvenCache | null> {
  const resolvedRegion = regionId ?? resolveRegionId(branchId, null);
  const fromDb = await loadBedrijvenCacheFromDb(branchId, resolvedRegion);
  if (fromDb) return fromDb;
  try {
    const raw = await fs.readFile(cachePath(branchId, resolvedRegion), "utf-8");
    return JSON.parse(raw) as BedrijvenCache;
  } catch {
    return null;
  }
}

export async function getScrapeStatus(
  branchId: ScrapeBranchId,
  regionId: ScrapeRegionId,
) {
  return getBrowserScrapeStatus(branchId, regionId);
}

export async function canScrapeBatch(
  branchId: ScrapeBranchId,
  regionId: ScrapeRegionId,
): Promise<{
  allowed: boolean;
  waitSeconds?: number;
}> {
  try {
    const raw = await fs.readFile(META_PATH, "utf-8");
    const meta = JSON.parse(raw) as {
      lastAttemptAt: string;
      branch: ScrapeBranchId;
      province: ScrapeRegionId;
    };
    if (meta.branch !== branchId || meta.province !== regionId) {
      return { allowed: true };
    }
    const elapsed = Date.now() - new Date(meta.lastAttemptAt).getTime();
    if (elapsed >= MIN_BATCH_INTERVAL_MS) return { allowed: true };
    return {
      allowed: false,
      waitSeconds: Math.ceil((MIN_BATCH_INTERVAL_MS - elapsed) / 1000),
    };
  } catch {
    return { allowed: true };
  }
}

export async function resetProvinceScrape(
  branchId: ScrapeBranchId,
  regionId: ScrapeRegionId,
): Promise<void> {
  await resetBrowserProvinceScrape(branchId, regionId);
}

export async function stopProvinceScrape(
  branchId: ScrapeBranchId,
  regionId: ScrapeRegionId,
): Promise<ScrapeProgress> {
  return stopBrowserProvinceScrape(branchId, regionId);
}

export async function scrapeBedrijvenBatch(
  branchId: ScrapeBranchId = DEFAULT_BRANCH,
  regionId?: ScrapeRegionId,
  options?: ScrapeBatchOptions,
): Promise<ScrapeBatchResult> {
  return scrapeBedrijvenBatchBrowser(branchId, regionId, options);
}

export function getActiveDataSource(): "browser" {
  return "browser";
}

export function resolveProvinceId(
  value: string | null,
  branchId: ScrapeBranchId = DEFAULT_BRANCH,
): ScrapeRegionId {
  return resolveRegionId(branchId, value);
}

export { resolveBranchId, DEFAULT_BRANCH };

export async function cleanupLegacyCache(): Promise<void> {
  const legacyPaths = [
    path.join(process.cwd(), "data", "bedrijven.json"),
    path.join(process.cwd(), "data", "bedrijven-seed.json"),
    path.join(DATA_ROOT, "drenthe.json"),
    path.join(DATA_ROOT, "noord-holland.json"),
    path.join(DATA_ROOT, "drenthe-progress.json"),
    path.join(DATA_ROOT, "noord-holland-progress.json"),
  ];
  await Promise.all(
    legacyPaths.map((p) => fs.unlink(p).catch(() => undefined)),
  );
}

/** @deprecated gebruik getScrapeProvinceConfig */
export function getProvinceForScrape(id: string) {
  return getProvince(id);
}
