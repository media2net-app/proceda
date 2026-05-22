/**
 * Scrape makelaardij per provincie (standaard 500 bedrijven per provincie).
 *
 *   npx tsx scripts/scrape-makelaardij-batch.ts
 *   TARGET=500 npx tsx scripts/scrape-makelaardij-batch.ts
 *   PROVINCE=noord-holland npx tsx scripts/scrape-makelaardij-batch.ts
 */
import fs from "fs/promises";
import path from "path";
import { DEFAULT_BRANCH } from "../src/lib/bedrijven/branches";
import { PROVINCE_IDS, type ProvinceId } from "../src/lib/bedrijven/provinces";
import {
  loadBedrijvenCache,
  scrapeBedrijvenBatch,
} from "../src/lib/bedrijven/scraper";

const BRANCH = DEFAULT_BRANCH;
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

  await log(`=== ${provinceId} — doel ${TARGET} makelaars ===`);

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
        `${provinceId} batch ${batches}: +${result.batchAdded} → totaal ${lastCount}, wachtrij ${result.remaining}, discovery=${result.discoveryComplete ? "klaar" : "bezig"}`,
      );

      if (result.done && lastCount < TARGET) {
        await log(
          `${provinceId}: inventarisatie + wachtrij leeg (${lastCount} gevonden, onder doel ${TARGET})`,
        );
        return lastCount;
      }

      if (lastCount >= TARGET) {
        await log(`${provinceId}: doel bereikt na batch ${batches}`);
        return lastCount;
      }

      if (result.batchAdded === 0 && result.remaining === 0 && !result.discoveryComplete) {
        await log(`${provinceId}: nog geen wachtrij, discovery loopt door…`);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.startsWith("RATE_LIMIT_COOLDOWN:")) {
        const sec = Number(msg.split(":")[1] ?? "5");
        await log(`${provinceId}: rate limit, wacht ${sec}s…`);
        await sleep(sec * 1000 + 500);
        continue;
      }
      if (msg.includes("DISCOVERY_IN_PROGRESS")) {
        await log(`${provinceId}: discovery bezig, opnieuw proberen…`);
        await sleep(DELAY_MS);
        continue;
      }
      await log(`${provinceId}: FOUT — ${msg}`);
      throw e;
    }

    await sleep(DELAY_MS);
  }

  await log(
    `${provinceId}: max batches (${MAX_BATCHES_PER_PROVINCE}) bereikt, laatste teller ${lastCount}`,
  );
  return lastCount;
}

async function main() {
  const provinces = ONLY_PROVINCE
    ? [ONLY_PROVINCE]
    : [...PROVINCE_IDS];

  await log(
    `Start makelaardij-batch: ${provinces.length} provincie(s), ${TARGET}/provincie`,
  );

  const summary: Record<string, number> = {};

  for (const provinceId of provinces) {
    try {
      summary[provinceId] = await scrapeProvince(provinceId);
    } catch {
      summary[provinceId] = (await loadBedrijvenCache(BRANCH, provinceId))?.count ?? 0;
      await log(`${provinceId}: overgeslagen door fout, ga door…`);
    }
    await sleep(2000);
  }

  await log(`Klaar. Samenvatting: ${JSON.stringify(summary)}`);
}

main().catch(async (e) => {
  await log(`Fatal: ${e instanceof Error ? e.message : e}`);
  process.exit(1);
});
