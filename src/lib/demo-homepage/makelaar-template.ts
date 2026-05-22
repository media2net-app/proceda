/** @deprecated Gebruik buildUniversalDemoHtml uit universal-template.ts */
import type { Bedrijf } from "@/lib/bedrijven/types";
import type { DeepScrapeResult } from "@/lib/bedrijven/deep-scrape-types";
import type { BrandOverride } from "./brand-overrides";
import { buildUniversalDemoHtml } from "./universal-template";

export function buildMakelaarDemoHtml(
  business: Bedrijf,
  deep: DeepScrapeResult,
  demoSlug: string,
  override: BrandOverride | null,
): string {
  return buildUniversalDemoHtml(business, deep, demoSlug, override);
}
