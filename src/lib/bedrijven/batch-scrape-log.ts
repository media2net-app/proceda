import fs from "fs/promises";
import path from "path";
import type { ScrapeBranchId } from "./branches";
import { getRegionConfig, getRegionIdsForBranch } from "./regions";
import type { ScrapeRegionId } from "./regions";
import { getScrapeStatus } from "./scraper";

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

type ActiveScrapeRegion = {
  regionId: ScrapeRegionId;
  active: boolean;
  discoveryComplete: boolean;
  remaining: number;
  queueTotal: number;
  phase: string;
  percent: number | null;
  totalEnriched: number;
  updatedAt: string;
};

async function findActiveRegion(
  branchId: ScrapeBranchId,
): Promise<ActiveScrapeRegion | null> {
  const regionIds = getRegionIdsForBranch(branchId);
  let best: ActiveScrapeRegion | null = null;
  let bestTime = 0;

  for (const regionId of regionIds) {
    const status = await getScrapeStatus(branchId, regionId);
    const active =
      status.active ||
      (!status.discoveryComplete && status.queueTotal > 0) ||
      status.remaining > 0;

    if (!active && status.discoveryComplete && status.remaining === 0) continue;

    const t = new Date(status.updatedAt).getTime();
    if (t >= bestTime) {
      bestTime = t;
      best = {
        regionId,
        active: status.active,
        discoveryComplete: status.discoveryComplete,
        remaining: status.remaining,
        queueTotal: status.queueTotal,
        phase: status.phase,
        percent: status.percent ?? null,
        totalEnriched: status.totalEnriched,
        updatedAt: status.updatedAt,
      };
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
  const activeRegion = await findActiveRegion(branchId);
  const stats = await countBranchStats(branchId);
  const regionsTotal = getRegionIdsForBranch(branchId).length;

  let currentRegionId: string | null = null;
  let currentRegionName: string | null = null;
  let phase: string | null = null;
  let percent: number | null = null;
  let pending: number | null = null;
  let enriched: number | null = null;

  if (activeRegion) {
    currentRegionId = activeRegion.regionId;
    const cfg = getRegionConfig(branchId, activeRegion.regionId);
    currentRegionName = cfg?.name ?? activeRegion.regionId;
    phase = activeRegion.phase ?? "idle";
    percent = activeRegion.percent ?? null;
    pending = activeRegion.remaining;
    enriched = activeRegion.totalEnriched;
  }

  const running =
    logRunning ||
    (activeRegion != null &&
      (activeRegion.active ||
        !activeRegion.discoveryComplete ||
        activeRegion.remaining > 0));

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
