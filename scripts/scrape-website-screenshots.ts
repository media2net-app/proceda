/**
 * Alleen website-screenshots voor rapportage-overzicht (geen volledig rapport).
 *
 *   npx tsx scripts/scrape-website-screenshots.ts
 *   LIMIT=200 SKIP_EXISTING=1 npx tsx scripts/scrape-website-screenshots.ts
 *   PROVINCE=noord-holland npx tsx scripts/scrape-website-screenshots.ts
 */
import fs from "fs/promises";
import path from "path";
import { DEFAULT_BRANCH } from "../src/lib/bedrijven/branches";
import {
  capturePreviewOnPage,
  launchPreviewBrowser,
  newPreviewPage,
  normalizeWebsiteUrl,
} from "../src/lib/bedrijven/capture-website-preview";
import {
  resolveScreenshotFile,
  screenshotFilePath,
} from "../src/lib/bedrijven/business-report-storage";
import { saveScreenshotBuffer } from "../src/lib/bedrijven/page-browser";
import { loadAllBusinesses } from "../src/lib/bedrijven/load-all-businesses";
import type { Bedrijf } from "../src/lib/bedrijven/types";
import type { ScrapeRegionId } from "../src/lib/bedrijven/regions";
import type { ScrapeBranchId } from "../src/lib/bedrijven/branches";

const BRANCH = (process.env.BRANCH?.trim() || DEFAULT_BRANCH) as ScrapeBranchId;
const SKIP_EXISTING = process.env.SKIP_EXISTING !== "0";
const LIMIT = Number(process.env.LIMIT ?? "0");
const DELAY_MS = Number(process.env.DELAY_MS ?? "800");
const ONLY_REGION = process.env.COUNTY?.trim() || process.env.PROVINCE?.trim();

const LOG = path.join(process.cwd(), "data", "audits-screenshots.log");
const PROGRESS = path.join(process.cwd(), "data", "audits-screenshots-progress.json");

async function log(msg: string) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  await fs.mkdir(path.dirname(LOG), { recursive: true });
  await fs.appendFile(LOG, line + "\n", "utf-8");
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function loadProgress(): Promise<{ done: string[]; failed: Record<string, string> }> {
  try {
    const raw = await fs.readFile(PROGRESS, "utf-8");
    return JSON.parse(raw) as { done: string[]; failed: Record<string, string> };
  } catch {
    return { done: [], failed: {} };
  }
}

async function saveProgress(p: { done: string[]; failed: Record<string, string> }) {
  await fs.writeFile(PROGRESS, JSON.stringify(p, null, 2), "utf-8");
}

async function captureOne(
  business: Bedrijf,
  page: Awaited<ReturnType<typeof newPreviewPage>>,
): Promise<"ok" | "skip" | "fail"> {
  const url = normalizeWebsiteUrl(business.website ?? "");
  if (!url) return "fail";

  const buffer = await capturePreviewOnPage(page, url);
  if (!buffer?.length) return "fail";

  await saveScreenshotBuffer(buffer, screenshotFilePath(business.id));
  return "ok";
}

async function main() {
  let list = await loadAllBusinesses(BRANCH);
  list = list.filter((b) => b.website?.trim());

  if (ONLY_REGION) {
    list = list.filter((b) => b.provinceId === ONLY_REGION);
  }

  if (SKIP_EXISTING) {
    const filtered: Bedrijf[] = [];
    for (const b of list) {
      if (!(await resolveScreenshotFile(b.id))) filtered.push(b);
    }
    list = filtered;
  }

  if (LIMIT > 0) list = list.slice(0, LIMIT);

  await log(`Start: ${list.length} websites (${BRANCH}${ONLY_REGION ? ` · ${ONLY_REGION}` : ""})`);

  const progress = await loadProgress();
  const browser = await launchPreviewBrowser();
  const page = await newPreviewPage(browser);

  let ok = 0;
  let fail = 0;
  let skip = 0;

  for (let i = 0; i < list.length; i++) {
    const b = list[i]!;
    if (progress.done.includes(b.id)) {
      skip++;
      continue;
    }

    try {
      const result = await captureOne(b, page);
      if (result === "ok") {
        ok++;
        progress.done.push(b.id);
        delete progress.failed[b.id];
        await log(`[${i + 1}/${list.length}] OK ${b.name}`);
      } else {
        fail++;
        progress.failed[b.id] = "screenshot failed";
        await log(`[${i + 1}/${list.length}] FAIL ${b.name}`);
      }
    } catch (e) {
      fail++;
      progress.failed[b.id] = e instanceof Error ? e.message : "error";
      await log(`[${i + 1}/${list.length}] ERR ${b.name}: ${progress.failed[b.id]}`);
    }

    if ((i + 1) % 10 === 0) await saveProgress(progress);
    await sleep(DELAY_MS);
  }

  await browser.close();
  await saveProgress(progress);
  await log(`Klaar. OK: ${ok}, fail: ${fail}, skip: ${skip}, totaal done: ${progress.done.length}`);
}

main().catch(async (e) => {
  await log(`Fatal: ${e instanceof Error ? e.message : e}`);
  process.exit(1);
});
