import "server-only";

import { createHash } from "crypto";
import fs from "fs/promises";
import path from "path";
import * as cheerio from "cheerio";
import {
  getScrapeProvinceConfig,
  getBrowserLeadSearchQueries,
  resolveRegionId,
  type ScrapeBranchId,
} from "./branches";
import type { ScrapeRegionId } from "./regions";
import { getProvince, type ProvinceConfig } from "./provinces";
import {
  extractEmailFromHtml,
  extractEmailFromWebsite,
  normalizeEmail,
} from "./contact-utils";
import { normalizeWebsiteUrl } from "./capture-website-preview";
import { launchPreviewBrowser, newPreviewPage } from "./capture-website-preview";
import { defaultOutreachSubcategory } from "@/lib/mail/outreach-draft";
import type { Bedrijf, BedrijvenCache, ScrapeBatchResult } from "./types";
import { loadBedrijvenCacheFromDb, saveBedrijvenCacheToDb } from "./business-db";
import { upsertBusinessesBatch } from "./business-db";

const DATA_ROOT = path.join(process.cwd(), "data", "bedrijven");
const META_PATH = path.join(process.cwd(), "data", "bedrijven-meta.json");
const MIN_BATCH_INTERVAL_MS = 5_000;
const QUERIES_PER_BATCH = 2;
const WEBSITES_PER_BATCH = 10;
const SEARCH_DELAY_MS = 2_500;

const BLOCKED_HOST_PATTERNS = [
  /google\./i,
  /facebook\.com/i,
  /instagram\.com/i,
  /linkedin\.com/i,
  /youtube\.com/i,
  /yelp\./i,
  /trustpilot\./i,
  /detelefoongids\./i,
  /telefoongids\./i,
  /openingstijden\./i,
  /werkspot\./i,
  /trustoo\./i,
  /kvk\.nl/i,
  /duckduckgo\./i,
  /bing\.com/i,
  /wikipedia\.org/i,
];

type BrowserScrapeProgress = {
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

type SearchHit = { url: string; title?: string };

function progressPath(branchId: ScrapeBranchId, regionId: ScrapeRegionId) {
  return path.join(DATA_ROOT, branchId, `${regionId}-browser-progress.json`);
}

function cachePath(branchId: ScrapeBranchId, regionId: ScrapeRegionId) {
  return path.join(DATA_ROOT, branchId, `${regionId}.json`);
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function hostBlocked(hostname: string): boolean {
  return BLOCKED_HOST_PATTERNS.some((re) => re.test(hostname));
}

function businessIdFromUrl(url: string): string {
  const hash = createHash("sha256").update(url).digest("hex").slice(0, 20);
  return `browser/${hash}`;
}

function mergeBusinesses(existing: Bedrijf[], added: Bedrijf[]): Bedrijf[] {
  const byId = new Map<string, Bedrijf>();
  for (const b of existing) byId.set(b.placeId, b);
  for (const b of added) byId.set(b.placeId, b);
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name, "nl"));
}

async function loadProgress(
  branchId: ScrapeBranchId,
  regionId: ScrapeRegionId,
  province: ProvinceConfig,
): Promise<BrowserScrapeProgress> {
  try {
    const raw = await fs.readFile(progressPath(branchId, regionId), "utf-8");
    const parsed = JSON.parse(raw) as BrowserScrapeProgress;
    return {
      ...parsed,
      branch: branchId,
      province: regionId,
      queries: parsed.queries?.length
        ? parsed.queries
        : getBrowserLeadSearchQueries(branchId, province),
    };
  } catch {
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
}

async function saveProgress(progress: BrowserScrapeProgress) {
  await fs.mkdir(path.join(DATA_ROOT, progress.branch), { recursive: true });
  progress.updatedAt = new Date().toISOString();
  await fs.writeFile(
    progressPath(progress.branch, progress.province),
    JSON.stringify(progress, null, 2),
    "utf-8",
  );
}

function appendLog(progress: BrowserScrapeProgress, line: string) {
  progress.log = [...(progress.log ?? []).slice(-40), line];
}

async function loadCache(
  branchId: ScrapeBranchId,
  regionId: ScrapeRegionId,
): Promise<BedrijvenCache | null> {
  const fromDb = await loadBedrijvenCacheFromDb(branchId, regionId);
  if (fromDb) return { ...fromDb, dataSource: "browser" };
  try {
    const raw = await fs.readFile(cachePath(branchId, regionId), "utf-8");
    return JSON.parse(raw) as BedrijvenCache;
  } catch {
    return null;
  }
}

async function saveCache(cache: BedrijvenCache) {
  await saveBedrijvenCacheToDb(cache);
  await fs.mkdir(path.join(DATA_ROOT, cache.branch), { recursive: true });
  await fs.writeFile(
    cachePath(cache.branch, cache.province),
    JSON.stringify(cache, null, 2),
    "utf-8",
  );
}

async function canScrapeBatch(
  branchId: ScrapeBranchId,
  regionId: ScrapeRegionId,
): Promise<{ allowed: boolean; waitSeconds?: number }> {
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
      provider: "browser",
    }),
    "utf-8",
  );
}

function parseDuckDuckGoHtml(html: string): SearchHit[] {
  const $ = cheerio.load(html);
  const hits: SearchHit[] = [];
  const seen = new Set<string>();

  $("a.result__a, a[data-testid='result-title-a']").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;
    let url = href;
    if (href.includes("uddg=")) {
      try {
        const u = new URL(href, "https://duckduckgo.com");
        const decoded = u.searchParams.get("uddg");
        if (decoded) url = decodeURIComponent(decoded);
      } catch {
        return;
      }
    }
    const normalized = normalizeWebsiteUrl(url);
    if (!normalized) return;
    let host: string;
    try {
      host = new URL(normalized).hostname;
    } catch {
      return;
    }
    if (hostBlocked(host) || seen.has(host)) return;
    seen.add(host);
    const title = $(el).text().trim() || undefined;
    hits.push({ url: normalized, title });
  });

  return hits;
}

async function searchDuckDuckGoFetch(query: string): Promise<SearchHit[]> {
  const q = encodeURIComponent(query);
  const res = await fetch(`https://html.duckduckgo.com/html/?q=${q}`, {
    signal: AbortSignal.timeout(15_000),
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html",
    },
  });
  if (!res.ok) return [];
  const html = await res.text();
  return parseDuckDuckGoHtml(html);
}

async function searchDuckDuckGoPuppeteer(query: string): Promise<SearchHit[]> {
  const browser = await launchPreviewBrowser();
  try {
    const page = await newPreviewPage(browser);
    const q = encodeURIComponent(query);
    await page.goto(`https://duckduckgo.com/?q=${q}&ia=web`, {
      waitUntil: "domcontentloaded",
      timeout: 25_000,
    });
    await sleep(1500);
    const html = await page.content();
    return parseDuckDuckGoHtml(html);
  } finally {
    await browser.close();
  }
}

async function searchWeb(query: string): Promise<SearchHit[]> {
  const useBrowser = process.env.BROWSER_SCRAPE_USE_PUPPETEER === "1";
  if (useBrowser) {
    return searchDuckDuckGoPuppeteer(query);
  }
  const fromFetch = await searchDuckDuckGoFetch(query);
  if (fromFetch.length >= 3) return fromFetch;
  try {
    return await searchDuckDuckGoPuppeteer(query);
  } catch {
    return fromFetch;
  }
}

function extractPhoneFromHtml(html: string): string | undefined {
  const nl = html.match(
    /(?:\+31|0031|0)\s*(?:\d{2}|\d{3})[\s.-]?\d{3}[\s.-]?\d{2}[\s.-]?\d{2}/,
  );
  if (nl) return nl[0].replace(/\s+/g, " ").trim();
  return undefined;
}

function extractNameFromHtml(html: string, fallback: string): string {
  const $ = cheerio.load(html);
  const og = $('meta[property="og:site_name"]').attr("content")?.trim();
  if (og && og.length > 2) return og;
  const title = $("title").first().text().trim();
  if (title) {
    const cleaned = title.split("|")[0]?.split("–")[0]?.split("-")[0]?.trim();
    if (cleaned && cleaned.length > 2 && cleaned.length < 80) return cleaned;
  }
  return fallback;
}

async function enrichWebsiteToBedrijf(
  hit: SearchHit,
  ctx: {
    branchId: ScrapeBranchId;
    regionId: ScrapeRegionId;
    provinceName: string;
    cityHint: string;
  },
): Promise<Bedrijf | null> {
  const url = normalizeWebsiteUrl(hit.url);
  if (!url) return null;
  let host: string;
  try {
    host = new URL(url).hostname;
  } catch {
    return null;
  }
  if (hostBlocked(host)) return null;

  let html = "";
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(12_000),
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        Accept: "text/html",
      },
      redirect: "follow",
    });
    if (!res.ok) return null;
    html = (await res.text()).slice(0, 200_000);
  } catch {
    return null;
  }

  const email =
    extractEmailFromHtml(html) ?? (await extractEmailFromWebsite(url));
  if (!email) return null;

  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return null;

  const name = extractNameFromHtml(html, hit.title ?? host.replace(/^www\./, ""));
  const phone = extractPhoneFromHtml(html);
  const id = businessIdFromUrl(url);

  return {
    id,
    placeId: id,
    name,
    category: "services",
    subcategory: defaultOutreachSubcategory(ctx.branchId),
    address: "",
    city: ctx.cityHint,
    province: ctx.provinceName,
    provinceId: ctx.regionId,
    branchId: ctx.branchId,
    phone,
    email: normalizedEmail,
    website: url,
    source: "browser",
  };
}

function cityHintFromQuery(query: string): string {
  const parts = query.trim().split(/\s+/);
  return parts.length > 1 ? (parts[parts.length - 1] ?? "") : "";
}

export async function scrapeBedrijvenBatchBrowser(
  branchId: ScrapeBranchId = "installatie",
  regionId?: ScrapeRegionId,
): Promise<ScrapeBatchResult> {
  const resolvedRegion = regionId ?? resolveRegionId(branchId, null);
  const provinceConfig = getProvince(resolvedRegion as import("./provinces").ProvinceId);
  const province =
    getScrapeProvinceConfig(branchId, resolvedRegion) ??
    (provinceConfig
      ? { ...provinceConfig, name: provinceConfig.name }
      : undefined);
  if (!province) {
    throw new Error(`UNKNOWN_BRANCH_OR_PROVINCE:${branchId}/${resolvedRegion}`);
  }

  const gate = await canScrapeBatch(branchId, resolvedRegion);
  if (!gate.allowed) {
    throw new Error(`RATE_LIMIT_COOLDOWN:${gate.waitSeconds ?? 5}`);
  }

  await writeMeta(branchId, resolvedRegion);

  let progress = await loadProgress(branchId, resolvedRegion, province as ProvinceConfig);
  progress.active = true;
  progress.phase = "discovering";
  appendLog(progress, `Browser scrape batch (${branchId} · ${province.name})`);
  await saveProgress(progress);

  const enrichedHosts = new Set(progress.enrichedHosts);

  for (let i = 0; i < QUERIES_PER_BATCH; i++) {
    if (progress.queryIndex >= progress.queries.length) {
      progress.discoveryComplete = true;
      break;
    }
    const query = progress.queries[progress.queryIndex]!;
    progress.queryIndex++;
    appendLog(progress, `Zoeken: ${query}`);
    await saveProgress(progress);

    const hits = await searchWeb(query);
    for (const hit of hits) {
      try {
        const host = new URL(hit.url).hostname;
        if (!enrichedHosts.has(host) && !progress.urlQueue.includes(hit.url)) {
          progress.urlQueue.push(hit.url);
        }
      } catch {
        /* skip */
      }
    }
    appendLog(progress, `+${hits.length} URLs (queue: ${progress.urlQueue.length})`);
    await saveProgress(progress);
    await sleep(SEARCH_DELAY_MS);
  }

  if (progress.queryIndex >= progress.queries.length) {
    progress.discoveryComplete = true;
  }

  const pendingUrls = progress.urlQueue.filter((url) => {
    try {
      const host = new URL(url).hostname;
      return !enrichedHosts.has(host);
    } catch {
      return false;
    }
  });

  if (pendingUrls.length === 0 && progress.discoveryComplete) {
    const cache =
      (await loadCache(branchId, resolvedRegion)) ??
      ({
        branch: branchId,
        province: resolvedRegion,
        provinceName: province.name,
        scrapedAt: new Date().toISOString(),
        count: 0,
        dataSource: "browser",
        businesses: [],
      } satisfies BedrijvenCache);

    progress.active = false;
    progress.phase = "done";
    progress.percent = 100;
    appendLog(progress, "Alle browser-queries verwerkt.");
    await saveProgress(progress);

    return {
      cache,
      batchAdded: 0,
      totalEnriched: progress.enrichedHosts.length,
      queueTotal: 0,
      remaining: 0,
      discoveryComplete: true,
      done: true,
    };
  }

  if (pendingUrls.length === 0) {
    progress.active = false;
    progress.phase = "idle";
    await saveProgress(progress);
    throw new Error(
      "BROWSER_DISCOVERY_IN_PROGRESS: Nog geen websites in queue. Probeer opnieuw.",
    );
  }

  progress.phase = "enriching";
  const toProcess = pendingUrls.slice(0, WEBSITES_PER_BATCH);
  appendLog(progress, `Websites scrapen: ${toProcess.length}…`);
  await saveProgress(progress);

  const added: Bedrijf[] = [];
  for (const url of toProcess) {
    const queryHint =
      progress.queries[Math.max(0, progress.queryIndex - 1)] ?? province.name;
    const hit: SearchHit = { url };
    const bedrijf = await enrichWebsiteToBedrijf(hit, {
      branchId,
      regionId: resolvedRegion,
      provinceName: province.name,
      cityHint: cityHintFromQuery(queryHint),
    });
    try {
      const host = new URL(url).hostname;
      progress.enrichedHosts.push(host);
      enrichedHosts.add(host);
      progress.urlQueue = progress.urlQueue.filter((u) => {
        try {
          return new URL(u).hostname !== host;
        } catch {
          return u !== url;
        }
      });
    } catch {
      /* skip */
    }
    if (bedrijf) added.push(bedrijf);
    await sleep(800);
  }

  const existingCache = await loadCache(branchId, resolvedRegion);
  const merged = mergeBusinesses(existingCache?.businesses ?? [], added);

  const cache: BedrijvenCache = {
    branch: branchId,
    province: resolvedRegion,
    provinceName: province.name,
    scrapedAt: new Date().toISOString(),
    count: merged.length,
    dataSource: "browser",
    businesses: merged,
  };

  await saveCache(cache);
  if (added.length > 0) {
    await upsertBusinessesBatch(added);
  }

  const remaining = progress.urlQueue.length;
  const done = progress.discoveryComplete && remaining === 0;

  progress.active = false;
  progress.phase = done ? "done" : "idle";
  progress.percent = progress.discoveryComplete
    ? Math.round((progress.queryIndex / progress.queries.length) * 100)
    : Math.round((progress.queryIndex / progress.queries.length) * 50);
  appendLog(
    progress,
    `Klaar: +${added.length} leads met e-mail (totaal ${merged.length}, ${remaining} URLs resterend)`,
  );
  await saveProgress(progress);

  return {
    cache,
    batchAdded: added.length,
    totalEnriched: progress.enrichedHosts.length,
    queueTotal: progress.urlQueue.length + progress.enrichedHosts.length,
    remaining,
    discoveryComplete: progress.discoveryComplete,
    done,
  };
}
