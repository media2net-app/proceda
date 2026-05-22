/**
 * Volledige deep scrape + rapport + demo homepage voor Schenkel Makelaardij.
 * Run: npx tsx scripts/schenkel-full-report.ts
 */
import { SCHENKEL_BUSINESS } from "../src/lib/bedrijven/seed-schenkel";
import { upsertBusinessInProvince } from "../src/lib/bedrijven/upsert-business";
import { generateFullBusinessReport } from "../src/lib/bedrijven/generate-full-report";
import { businessIdToSlug } from "../src/lib/bedrijven/slug";

async function main() {
  console.log("=== Schenkel Makelaardij — volledig rapport ===\n");

  await upsertBusinessInProvince(SCHENKEL_BUSINESS, "drenthe");
  console.log("Bedrijf opgeslagen in data/bedrijven/drenthe.json\n");

  const result = await generateFullBusinessReport(SCHENKEL_BUSINESS);

  const slug = businessIdToSlug(SCHENKEL_BUSINESS.id);
  console.log("\n--- Resultaat ---");
  console.log("Rapportage:", `http://localhost:3000/nl/dashboard-admin/rapportage/${slug}`);
  console.log("Demo homepage:", `http://localhost:3000${result.demoHomepageUrl}`);
  console.log("Pagina's gescraped:", result.pagesScraped);
  console.log("Leadscore:", result.report.overallScore, result.report.leadQuality);
  console.log("App-voorstel:", result.report.primaryAppType);
  console.log("Demo URL in rapport:", result.report.demoHomepageUrl);

  if (result.deepScrapeErrors.length > 0) {
    console.log("\nWaarschuwingen:");
    result.deepScrapeErrors.forEach((e) => console.log(" -", e));
  }

  console.log("\nKlaar.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
