/**
 * Scrape Lenjerii hotel — hotels, pensiuni, restaurants, spa in Roemenië.
 *
 *   npx tsx scripts/scrape-lenjerii-hotel-batch.ts
 *   COUNTY=ro-cluj npx tsx scripts/scrape-lenjerii-hotel-batch.ts
 *   MAX_BATCHES=800 DELAY_MS=3500 npx tsx scripts/scrape-lenjerii-hotel-batch.ts
 */
import fs from "fs/promises";
import path from "path";
import type { ScrapeBranchId } from "../src/lib/bedrijven/branches";
import { ROMANIA_COUNTY_IDS, type RomaniaCountyId } from "../src/lib/bedrijven/romania-counties";
import {
  loadBedrijvenCache,
  scrapeBedrijvenBatch,
} from "../src/lib/bedrijven/scraper";

const BRANCH = "lenjerii-hotel" as ScrapeBranchId;
const DELAY_MS = Number(process.env.DELAY_MS ?? "3500");
const MAX_BATCHES_PER_COUNTY = Number(process.env.MAX_BATCHES ?? "600");
const ONLY_COUNTY = process.env.COUNTY?.trim() as RomaniaCountyId | undefined;

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

async function scrapeCounty(countyId: RomaniaCountyId): Promise<number> {
  let batches = 0;
  let lastCount = 0;

  await log(`=== ${countyId} — Lenjerii hotel (RO) ===`);

  while (batches < MAX_BATCHES_PER_COUNTY) {
    const cacheBefore = await loadBedrijvenCache(BRANCH, countyId);
    const countBefore = cacheBefore?.count ?? 0;

    try {
      const result = await scrapeBedrijvenBatch(BRANCH, countyId);
      batches++;
      lastCount = result.cache.count;

      await log(
        `${countyId} batch ${batches}: +${result.batchAdded} → totaal ${lastCount}, wachtrij ${result.remaining}, discovery=${result.discoveryComplete ? "klaar" : "bezig"}, done=${result.done}`,
      );

      if (result.done) {
        await log(`${countyId}: volledig afgerond (${lastCount} bedrijven)`);
        return lastCount;
      }

      if (
        result.batchAdded === 0 &&
        result.remaining === 0 &&
        !result.discoveryComplete
      ) {
        await log(`${countyId}: discovery loopt door…`);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.startsWith("RATE_LIMIT_COOLDOWN:")) {
        const sec = Number(msg.split(":")[1] ?? "5");
        await log(`${countyId}: rate limit, wacht ${sec}s…`);
        await sleep(sec * 1000 + 500);
        continue;
      }
      if (msg.includes("DISCOVERY_IN_PROGRESS")) {
        await log(`${countyId}: discovery bezig, opnieuw…`);
        await sleep(DELAY_MS);
        continue;
      }
      await log(`${countyId}: FOUT — ${msg}`);
      throw e;
    }

    await sleep(DELAY_MS);
  }

  await log(
    `${countyId}: max batches (${MAX_BATCHES_PER_COUNTY}), laatste teller ${lastCount}`,
  );
  return lastCount;
}

async function main() {
  const counties = ONLY_COUNTY ? [ONLY_COUNTY] : [...ROMANIA_COUNTY_IDS];

  await log(
    `Start Lenjerii hotel scrape: ${counties.length} județ(e), max ${MAX_BATCHES_PER_COUNTY} batches/județ`,
  );

  const summary: Record<string, number> = {};

  for (const countyId of counties) {
    try {
      summary[countyId] = await scrapeCounty(countyId);
    } catch {
      summary[countyId] =
        (await loadBedrijvenCache(BRANCH, countyId))?.count ?? 0;
      await log(`${countyId}: overgeslagen door fout, ga door…`);
    }
    await sleep(1500);
  }

  const total = Object.values(summary).reduce((s, n) => s + n, 0);
  await log(`Klaar. Totaal ${total} bedrijven. Samenvatting: ${JSON.stringify(summary)}`);
}

main().catch(async (e) => {
  await log(`Fatal: ${e instanceof Error ? e.message : e}`);
  process.exit(1);
});
