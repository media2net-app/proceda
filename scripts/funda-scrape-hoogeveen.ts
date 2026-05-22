/**
 * Funda marktscan Hoogeveen — cache naar data/funda-hoogeveen.json
 * Gebruik: npx tsx scripts/funda-scrape-hoogeveen.ts
 */
import { getFundaHoogeveenData } from "../src/lib/funda/scrape-hoogeveen";

async function main() {
  console.log("Funda scrape Hoogeveen (Drenthe)…");
  const data = await getFundaHoogeveenData(true);
  console.log(`Totaal op Funda: ${data.totalCount}`);
  console.log(`Geparsed in sample: ${data.listings.length}`);
  console.log(`Schenkel listings: ${data.stats.schenkelCount}`);
  console.log(`Gem. prijs: ${data.stats.avgPrice ?? "—"}`);
  if (data.stats.competitors.length) {
    console.log("Concurrentie:");
    for (const c of data.stats.competitors) {
      console.log(`  ${c.name}: ${c.count} (${c.sharePct}%)`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
