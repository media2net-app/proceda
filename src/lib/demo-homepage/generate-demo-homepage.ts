import fs from "fs/promises";
import path from "path";
import type { Bedrijf } from "@/lib/bedrijven/types";
import type { DeepScrapeResult } from "@/lib/bedrijven/deep-scrape-types";
import { businessIdToDemoSlug, demoHomepagePublicPath } from "@/lib/bedrijven/demo-slug";
import { getBrandOverride } from "./brand-overrides";
import { buildUniversalDemoHtml } from "./universal-template";

/**
 * Genereert één universele concept-homepage per bedrijf.
 * Branche bepaalt copy (aanbod/diensten); logo en kleuren uit scrape of brand-overrides.
 */
export async function generateDemoHomepage(
  business: Bedrijf,
  deep: DeepScrapeResult,
): Promise<string> {
  const demoSlug = businessIdToDemoSlug(business.id);
  const outDir = path.join(process.cwd(), "public", "demos", demoSlug);
  const assetsDir = path.join(outDir, "assets");
  await fs.mkdir(assetsDir, { recursive: true });

  const brandOverride = getBrandOverride(demoSlug);
  if (brandOverride?.logoSourceSlug) {
    const src = path.join(
      process.cwd(),
      "public",
      "brand-assets",
      brandOverride.logoSourceSlug,
      "logo.png",
    );
    const dest = path.join(assetsDir, "logo.png");
    try {
      await fs.copyFile(src, dest);
    } catch {
      /* bronlogo ontbreekt — bestaand demo-logo blijft staan */
    }
  }
  const html = buildUniversalDemoHtml(business, deep, demoSlug, brandOverride);
  await fs.writeFile(path.join(outDir, "index.html"), html, "utf-8");
  return demoHomepagePublicPath(demoSlug);
}
