import fs from "fs/promises";
import path from "path";
import type { ScrapeBranchId } from "./branches";
import { getRegionConfig, getRegionIdsForBranch } from "./regions";
import { loadScrapeProgress } from "./scraper";
import type { ScrapeProgress } from "./types";

const DATA_ROOT = path.join(process.cwd(), "data", "bedrijven");
const MAX_LOG_LINES = 50;

export type BatchScrapeLogStatus = {
  branch: ScrapeBranchId;
  running: boolean;
  logLines: string[];
  summary: {
    regionsDone: number;
    regionsTotal: number;
    totalBusinesses: number;
    withEmail: number;
    currentRegionId: string | null;
    currentRegionName: string | null;
    phase: string | null;
    percent: number | null;
    pending: number | null;
    enriched: number | null;
  };
  updatedAt: string;
};

function batchLogPath(branchId: ScrapeBranchId) {
  return path.join(DATA_ROOT, branchId, "_batch-scrape.log");
}

async function readLogTail(branchId: ScrapeBranchId): Promise<string[]> {
  try {
    const raw = await fs.readFile(batchLogPath(branchId), "utf-8");
    return raw
      .trim()
      .split("\n")
      .filter(Boolean)
      .slice(-MAX_LOG_LINES);
  } catch {
    return [];
  }
}

function parseLogRunning(logLines: string[]): boolean {
  if (logLines.length === 0) return false;
  const last = logLines[logLines.length - 1] ?? "";
  if (
    last.includes("Klaar. Samenvatting") ||
    last.includes("Stopped by user") ||
    last.includes("Gestopt door gebruiker") ||
    last.includes("Fatal:")
  ) {
    return false;
  }
  return true;
}

function pendingCount(progress: ScrapeProgress): number {
  const enriched = new Set(progress.enrichedPlaceIds);
  return progress.placeQueue.filter((p) => !enriched.has(p.place_id)).length;
}

async function findActiveProgress(
  branchId: ScrapeBranchId,
): Promise<ScrapeProgress | null> {
  const regionIds = getRegionIdsForBranch(branchId);
  let best: ScrapeProgress | null = null;
  let bestTime = 0;

  for (const regionId of regionIds) {
    const progress = await loadScrapeProgress(branchId, regionId);
    const pending = pendingCount(progress);
    const active =
      progress.active ||
      (!progress.discoveryComplete && progress.placeQueue.length > 0) ||
      pending > 0;

    if (!active && progress.discoveryComplete && pending === 0) continue;

    const t = new Date(progress.updatedAt).getTime();
    if (t >= bestTime) {
      bestTime = t;
      best = progress;
    }
  }

  return best;
}

async function countBranchStats(branchId: ScrapeBranchId) {
  const dir = path.join(DATA_ROOT, branchId);
  let regionsDone = 0;
  let totalBusinesses = 0;
  let withEmail = 0;

  try {
    const files = await fs.readdir(dir);
    for (const file of files) {
      if (!file.endsWith(".json") || file.includes("-progress") || file.startsWith("_")) {
        continue;
      }
      const raw = await fs.readFile(path.join(dir, file), "utf-8");
      const cache = JSON.parse(raw) as {
        count?: number;
        businesses?: { email?: string }[];
      };
      regionsDone++;
      totalBusinesses += cache.count ?? cache.businesses?.length ?? 0;
      for (const b of cache.businesses ?? []) {
        if (b.email?.trim()) withEmail++;
      }
    }
  } catch {
    // empty
  }

  return { regionsDone, totalBusinesses, withEmail };
}

export async function getBatchScrapeLogStatus(
  branchId: ScrapeBranchId,
): Promise<BatchScrapeLogStatus> {
  const logLines = await readLogTail(branchId);
  const logRunning = parseLogRunning(logLines);
  const activeProgress = await findActiveProgress(branchId);
  const stats = await countBranchStats(branchId);
  const regionsTotal = getRegionIdsForBranch(branchId).length;

  let currentRegionId: string | null = null;
  let currentRegionName: string | null = null;
  let phase: string | null = null;
  let percent: number | null = null;
  let pending: number | null = null;
  let enriched: number | null = null;

  if (activeProgress) {
    currentRegionId = activeProgress.province;
    const cfg = getRegionConfig(branchId, activeProgress.province);
    currentRegionName = cfg?.name ?? activeProgress.province;
    phase = activeProgress.phase ?? "idle";
    percent = activeProgress.percent ?? null;
    pending = pendingCount(activeProgress);
    enriched = activeProgress.enrichedPlaceIds.length;
  }

  const running =
    logRunning ||
    (activeProgress != null &&
      (activeProgress.active ||
        !activeProgress.discoveryComplete ||
        pendingCount(activeProgress) > 0));

  return {
    branch: branchId,
    running,
    logLines,
    summary: {
      regionsDone: stats.regionsDone,
      regionsTotal,
      totalBusinesses: stats.totalBusinesses,
      withEmail: stats.withEmail,
      currentRegionId,
      currentRegionName,
      phase,
      percent,
      pending,
      enriched,
    },
    updatedAt: new Date().toISOString(),
  };
}
