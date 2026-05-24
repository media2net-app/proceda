import fs from "fs/promises";
import path from "path";
import {
  DEFAULT_BRANCH,
  getScrapeProvinceConfig,
  resolveBranchId,
  resolveRegionId,
  type ScrapeBranchId,
} from "./branches";
import type { ScrapeRegionId } from "./regions";
import {
  enrichPlacesBatch,
  getGoogleApiKey,
  runDiscoveryStep,
  setGooglePlacesProvince,
} from "./google-places";
import { getProvince } from "./provinces";
import {
  appendScrapeLog,
  batchPercent,
  discoveryPercent,
} from "./scrape-progress";
import type {
  Bedrijf,
  BedrijvenCache,
  ScrapeBatchResult,
  ScrapeProgress,
} from "./types";
import { SCRAPE_BATCH_SIZE } from "./types";
import {
  loadBedrijvenCacheFromDb,
  saveBedrijvenCacheToDb,
} from "./business-db";
import { resolveScrapeProvider } from "./scrape-provider";
import { scrapeBedrijvenBatchBrowser } from "./browser-lead-scraper";

const DATA_ROOT = path.join(process.cwd(), "data", "bedrijven");
const META_PATH = path.join(process.cwd(), "data", "bedrijven-meta.json");
const MIN_BATCH_INTERVAL_MS = 3_000;

function branchDir(branchId: ScrapeBranchId) {
  return path.join(DATA_ROOT, branchId);
}

function cachePath(branchId: ScrapeBranchId, regionId: ScrapeRegionId) {
  return path.join(branchDir(branchId), `${regionId}.json`);
}

function progressPath(branchId: ScrapeBranchId, regionId: ScrapeRegionId) {
  return path.join(branchDir(branchId), `${regionId}-progress.json`);
}

function emptyProgress(
  branchId: ScrapeBranchId,
  regionId: ScrapeRegionId,
): ScrapeProgress {
  return {
    branch: branchId,
    province: regionId,
    discoveryComplete: false,
    discoveryCursor: { phase: "grid", gridIndex: 0, typeIndex: 0, queryIndex: 0 },
    placeQueue: [],
    enrichedPlaceIds: [],
    updatedAt: new Date().toISOString(),
  };
}

export async function loadScrapeProgress(
  branchId: ScrapeBranchId,
  regionId: ScrapeRegionId,
): Promise<ScrapeProgress> {
  try {
    const raw = await fs.readFile(progressPath(branchId, regionId), "utf-8");
    const parsed = JSON.parse(raw) as ScrapeProgress;
    return { ...emptyProgress(branchId, regionId), ...parsed, branch: branchId, province: regionId };
  } catch {
    return emptyProgress(branchId, regionId);
  }
}

async function saveScrapeProgress(progress: ScrapeProgress) {
  await fs.mkdir(branchDir(progress.branch), { recursive: true });
  progress.updatedAt = new Date().toISOString();
  await fs.writeFile(
    progressPath(progress.branch, progress.province),
    JSON.stringify(progress, null, 2),
    "utf-8",
  );
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

async function saveBedrijvenCache(cache: BedrijvenCache) {
  await saveBedrijvenCacheToDb(cache);
  await fs.mkdir(branchDir(cache.branch), { recursive: true });
  await fs.writeFile(
    cachePath(cache.branch, cache.province),
    JSON.stringify(cache, null, 2),
    "utf-8",
  );
}

function mergeBusinesses(existing: Bedrijf[], added: Bedrijf[]): Bedrijf[] {
  const byPlaceId = new Map<string, Bedrijf>();
  for (const b of existing) byPlaceId.set(b.placeId, b);
  for (const b of added) byPlaceId.set(b.placeId, b);
  return [...byPlaceId.values()].sort((a, b) =>
    a.name.localeCompare(b.name, "nl"),
  );
}

function getPendingPlaces(progress: ScrapeProgress) {
  const enriched = new Set(progress.enrichedPlaceIds);
  return progress.placeQueue.filter((p) => !enriched.has(p.place_id));
}

export async function getScrapeStatus(
  branchId: ScrapeBranchId,
  regionId: ScrapeRegionId,
) {
  const progress = await loadScrapeProgress(branchId, regionId);
  const cache = await loadBedrijvenCache(branchId, regionId);
  const pending = getPendingPlaces(progress);
  return {
    totalEnriched: progress.enrichedPlaceIds.length,
    count: cache?.count ?? 0,
    queueTotal: progress.placeQueue.length,
    remaining: pending.length,
    discoveryComplete: progress.discoveryComplete,
    done:
      progress.discoveryComplete &&
      pending.length === 0 &&
      progress.enrichedPlaceIds.length > 0,
    active: progress.active ?? false,
    phase: progress.phase ?? "idle",
    percent: progress.percent ?? 0,
    statusMessage: progress.statusMessage ?? "",
    log: progress.log ?? [],
    enrichingDone: progress.enrichingDone ?? 0,
    enrichingTotal: progress.enrichingTotal ?? 0,
  };
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

async function writeMeta(branchId: ScrapeBranchId, regionId: ScrapeRegionId) {
  await fs.mkdir(path.dirname(META_PATH), { recursive: true });
  await fs.writeFile(
    META_PATH,
    JSON.stringify({
      lastAttemptAt: new Date().toISOString(),
      branch: branchId,
      province: regionId,
    }),
    "utf-8",
  );
}

export async function resetProvinceScrape(
  branchId: ScrapeBranchId,
  regionId: ScrapeRegionId,
): Promise<void> {
  await Promise.all([
    fs.unlink(cachePath(branchId, regionId)).catch(() => undefined),
    fs.unlink(progressPath(branchId, regionId)).catch(() => undefined),
  ]);
}

export async function stopProvinceScrape(
  branchId: ScrapeBranchId,
  regionId: ScrapeRegionId,
): Promise<ScrapeProgress> {
  const progress = await loadScrapeProgress(branchId, regionId);
  const pending = getPendingPlaces(progress).length;
  progress.placeQueue = progress.placeQueue.filter((p) =>
    progress.enrichedPlaceIds.includes(p.place_id),
  );
  progress.discoveryComplete = true;
  progress.active = false;
  progress.phase = "idle";
  progress.percent = progress.enrichedPlaceIds.length > 0 ? 100 : 0;
  appendScrapeLog(
    progress,
    `Queue stopped (${pending} skipped, ${progress.enrichedPlaceIds.length} already processed).`,
  );
  await saveScrapeProgress(progress);
  return progress;
}

export async function scrapeBedrijvenBatch(
  branchId: ScrapeBranchId = DEFAULT_BRANCH,
  regionId?: ScrapeRegionId,
  options?: import("./types").ScrapeBatchOptions,
): Promise<ScrapeBatchResult> {
  if (resolveScrapeProvider() === "browser") {
    return scrapeBedrijvenBatchBrowser(branchId, regionId, options);
  }

  const resolvedRegion = regionId ?? resolveRegionId(branchId, null);
  const province = getScrapeProvinceConfig(branchId, resolvedRegion);
  if (!province) throw new Error(`UNKNOWN_BRANCH_OR_PROVINCE:${branchId}/${resolvedRegion}`);

  const gate = await canScrapeBatch(branchId, resolvedRegion);
  if (!gate.allowed) {
    throw new Error(`RATE_LIMIT_COOLDOWN:${gate.waitSeconds ?? 3}`);
  }

  await writeMeta(branchId, resolvedRegion);
  setGooglePlacesProvince(resolvedRegion);

  const googleKey = getGoogleApiKey();
  if (!googleKey) {
    throw new Error(
      "GOOGLE_API_KEY_MISSING: Set GOOGLE_PLACES_API_KEY in .env.local",
    );
  }

  let progress = await loadScrapeProgress(branchId, resolvedRegion);
  progress.active = true;
  progress.phase = "discovering";
  progress.percent = 0;
  progress.enrichingDone = 0;
  progress.enrichingTotal = 0;
  appendScrapeLog(progress, `Batch started: ${province.name}`);
  await saveScrapeProgress(progress);

  const knownIds = new Set([
    ...progress.placeQueue.map((p) => p.place_id),
    ...progress.enrichedPlaceIds,
  ]);

  let pending = getPendingPlaces(progress);

  const MAX_DISCOVERY_STEPS_PER_REQUEST = 40;
  let steps = 0;
  while (
    !progress.discoveryComplete &&
    pending.length < SCRAPE_BATCH_SIZE &&
    steps < MAX_DISCOVERY_STEPS_PER_REQUEST
  ) {
    const step = await runDiscoveryStep(
      googleKey,
      province,
      progress.discoveryCursor,
      knownIds,
      branchId,
    );
    if (step.added.length > 0) {
      progress.placeQueue.push(...step.added);
      appendScrapeLog(
        progress,
        `${step.added.length} new (queue: ${progress.placeQueue.length})`,
      );
    }
    progress.discoveryCursor = step.cursor;
    if (step.complete) progress.discoveryComplete = true;
    pending = getPendingPlaces(progress);
    const discPct = discoveryPercent(
      province,
      progress.discoveryCursor,
      progress.discoveryComplete,
      province.nearbyTypes.length,
    );
    progress.percent = batchPercent("discovering", discPct, 0, 0);
    appendScrapeLog(
      progress,
      progress.discoveryComplete
        ? "Discovery complete"
        : `Searching… (${pending.length} in queue)`,
    );
    await saveScrapeProgress(progress);
    steps++;
    await new Promise((r) => setTimeout(r, 250));
  }

  if (pending.length === 0 && progress.discoveryComplete) {
    const cache =
      (await loadBedrijvenCache(branchId, resolvedRegion)) ??
      ({
        branch: branchId,
        province: resolvedRegion,
        provinceName: province.name,
        scrapedAt: new Date().toISOString(),
        count: 0,
        dataSource: "google" as const,
        businesses: [],
      } satisfies BedrijvenCache);

    progress.active = false;
    progress.phase = "done";
    progress.percent = 100;
    appendScrapeLog(progress, "All businesses processed.");
    await saveScrapeProgress(progress);
    setGooglePlacesProvince(undefined);
    return {
      cache,
      batchAdded: 0,
      totalEnriched: progress.enrichedPlaceIds.length,
      queueTotal: progress.placeQueue.length,
      remaining: 0,
      discoveryComplete: true,
      done: true,
      leadLog: [],
    };
  }

  if (pending.length === 0) {
    throw new Error(
      "DISCOVERY_IN_PROGRESS: No businesses in queue yet. Try again.",
    );
  }

  const toEnrich = pending.slice(0, SCRAPE_BATCH_SIZE);
  progress.phase = "enriching";
  progress.enrichingTotal = toEnrich.length;
  progress.enrichingDone = 0;
  appendScrapeLog(
    progress,
    `Enriching ${toEnrich.length} businesses (phone, website, hours)…`,
  );
  await saveScrapeProgress(progress);

  const enriched = await enrichPlacesBatch(
    googleKey,
    province,
    toEnrich,
    SCRAPE_BATCH_SIZE,
    branchId,
    async (done, total, name) => {
      progress.enrichingDone = done;
      progress.enrichingTotal = total;
      progress.percent = batchPercent("enriching", 100, done, total);
      if (name) {
        appendScrapeLog(progress, `Processed (${done}/${total}): ${name}`);
      }
      await saveScrapeProgress(progress);
    },
  );

  for (const place of toEnrich) {
    progress.enrichedPlaceIds.push(place.place_id);
  }

  const existingCache = await loadBedrijvenCache(branchId, resolvedRegion);
  const merged = mergeBusinesses(existingCache?.businesses ?? [], enriched);

  const cache: BedrijvenCache = {
    branch: branchId,
    province: resolvedRegion,
    provinceName: province.name,
    scrapedAt: new Date().toISOString(),
    count: merged.length,
    dataSource: "google",
    businesses: merged,
  };

  await saveBedrijvenCache(cache);

  pending = getPendingPlaces(progress);
  const done = progress.discoveryComplete && pending.length === 0;
  progress.active = false;
  progress.phase = done ? "done" : "idle";
  progress.percent = 100;
  appendScrapeLog(
    progress,
    `Batch done: +${enriched.length} businesses (total ${merged.length}, ${pending.length} remaining)`,
  );
  await saveScrapeProgress(progress);
  setGooglePlacesProvince(undefined);

  return {
    cache,
    batchAdded: enriched.length,
    totalEnriched: progress.enrichedPlaceIds.length,
    queueTotal: progress.placeQueue.length,
    remaining: pending.length,
    discoveryComplete: progress.discoveryComplete,
    done,
    leadLog: [],
  };
}

export function getActiveDataSource(): "google" | "browser" {
  return resolveScrapeProvider();
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
