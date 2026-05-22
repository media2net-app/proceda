/**
 * Download woningfoto's + hero uit bestaande deep-scrape en regenereer demo HTML.
 * Geen volledige Puppeteer-scrape nodig.
 */
import { SCHENKEL_BUSINESS } from "../src/lib/bedrijven/seed-schenkel";
import { loadDeepScrape, saveDeepScrape } from "../src/lib/bedrijven/deep-scrape-storage";
import {
  collectListingImageUrls,
  downloadHeroImage,
  downloadListingImages,
  extractListingsFromPages,
  mergeListingsWithImages,
  pickHeroImageUrl,
} from "../src/lib/bedrijven/listing-scrape";
import { generateDemoHomepage } from "../src/lib/demo-homepage/generate-demo-homepage";
import path from "path";

async function main() {
  const deep = await loadDeepScrape(SCHENKEL_BUSINESS.id);
  if (!deep) {
    console.error("Geen deep scrape — eerst full report draaien.");
    process.exit(1);
  }

  const demoSlug = "schenkel-makelaardij";
  const assetsDir = path.join(process.cwd(), "public", "demos", demoSlug, "assets");

  const listingImageUrls = collectListingImageUrls(deep.pages);
  const textListings = extractListingsFromPages(deep.pages, 6);
  let listings = mergeListingsWithImages(textListings, listingImageUrls, [], 6);
  listings = await downloadListingImages(listings, assetsDir);

  const heroUrl = pickHeroImageUrl(deep.pages, listingImageUrls);
  let heroImageLocalPath: string | null = null;
  if (heroUrl) {
    heroImageLocalPath = await downloadHeroImage(heroUrl, assetsDir);
  }

  const updated = {
    ...deep,
    listings,
    brand: {
      ...deep.brand,
      heroImageUrl: heroUrl,
      heroImageLocalPath,
    },
    scrapedAt: new Date().toISOString(),
  };

  await saveDeepScrape(updated);
  const url = await generateDemoHomepage(SCHENKEL_BUSINESS, updated);
  console.log("Listings met foto:", listings.filter((l) => l.imageLocalPath).length);
  console.log("Hero:", heroImageLocalPath ?? "—");
  console.log("Demo:", url);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
