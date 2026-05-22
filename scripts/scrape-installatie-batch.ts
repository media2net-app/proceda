/**
 * Scrape installatie & technische dienst per provincie (NL).
 *
 *   npx tsx scripts/scrape-installatie-batch.ts
 *   TARGET=500 npx tsx scripts/scrape-installatie-batch.ts
 *   PROVINCE=zuid-holland npx tsx scripts/scrape-installatie-batch.ts
 */
import fs from "fs/promises";
import path from "path";
import type { ScrapeBranchId } from "../src/lib/bedrijven/branches";
import { PROVINCE_IDS, type ProvinceId } from "../src/lib/bedrijven/provinces";
import {
  loadBedrijvenCache,
  scrapeBedrijvenBatch,
} from "../src/lib/bedrijven/scraper";

const BRANCH = "installatie" as ScrapeBranchId;
const TARGET = Number(process.env.TARGET ?? "500");
const DELAY_MS = Number(process.env.DELAY_MS ?? "4000");
const MAX_BATCHES_PER_PROVINCE = Number(process.env.MAX_BATCHES ?? "30");
const ONLY_PROVINCE = process.env.PROVINCE?.trim() as ProvinceId | undefined;

const LOG_FILE = path.join(
  process.cwd(),
  "data",
  "bedrijven",
  BRANCH,
  "_batch-scrape.log",
);

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function log(line: string) {
  const msg = `[${new Date().toISOString()}] ${line}`;
  console.log(msg);
  await fs.mkdir(path.dirname(LOG_FILE), { recursive: true });
  await fs.appendFile(LOG_FILE, msg + "\n", "utf-8");
}

async function scrapeProvince(provinceId: ProvinceId): Promise<number> {
  let batches = 0;
  let lastCount = 0;

  await log(`=== ${provinceId} — doel ${TARGET} installateurs ===`);

  while (batches < MAX_BATCHES_PER_PROVINCE) {
    const cacheBefore = await loadBedrijvenCache(BRANCH, provinceId);
    const countBefore = cacheBefore?.count ?? 0;

    if (countBefore >= TARGET) {
      await log(`${provinceId}: doel bereikt (${countBefore})`);
      return countBefore;
    }

    try {
      const result = await scrapeBedrijvenBatch(BRANCH, provinceId);
      batches++;
      lastCount = result.cache.count;

      await log(
        `${provinceId} batch ${batches}: +${result.batchAdded} → totaal ${lastCount}`,
      );

      if (result.done && lastCount < TARGET) {
        await log(`${provinceId}: klaar met ${lastCount} (onder doel ${TARGET})`);
        return lastCount;
      }

      if (lastCount >= TARGET) {
        await log(`${provinceId}: doel bereikt`);
        return lastCount;
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.startsWith("RATE_LIMIT_COOLDOWN:")) {
        const sec = Number(msg.split(":")[1] ?? "5");
        await log(`${provinceId}: rate limit, wacht ${sec}s…`);
        await sleep(sec * 1000 + 500);
        continue;
      }
      throw e;
    }

    await sleep(DELAY_MS);
  }

  return lastCount;
}

async function main() {
  const provinces = ONLY_PROVINCE ? [ONLY_PROVINCE] : [...PROVINCE_IDS];
  await log(`Start installatie · ${provinces.length} provincie(s)`);

  for (const provinceId of provinces) {
    await scrapeProvince(provinceId);
  }

  await log("Installatie batch afgerond.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
