import { extractBrandFromHtml, pickBrandPalette } from "./brand-extraction";
import { hasAutoMailerContact } from "./contact-utils";
import type { DeepScrapeResult } from "./deep-scrape-types";
import type { Bedrijf } from "./types";

export type DemoBrandQuality = {
  hasLogo: boolean;
  hasExtractedColors: boolean;
  colorCount: number;
  primaryColor: string;
  logoUrl: string | null;
};

/** Minimaal voor gepersonaliseerde demo-mail: logo + kleuren uit hun site (geen kale defaults). */
export function assessBrandFromHtml(
  html: string,
  pageUrl: string,
): DemoBrandQuality {
  const extracted = extractBrandFromHtml(html, pageUrl);
  const palette = pickBrandPalette(extracted.colors);
  const hasLogo = !!extracted.logoUrl;
  const hasExtractedColors = extracted.colors.length >= 2;

  return {
    hasLogo,
    hasExtractedColors,
    colorCount: extracted.colors.length,
    primaryColor: palette.primaryColor,
    logoUrl: extracted.logoUrl,
  };
}

export function assessDeepScrapeBrand(deep: DeepScrapeResult): DemoBrandQuality {
  const hasLogo = !!(deep.brand.logoLocalPath || deep.brand.logoUrl);
  const hasExtractedColors = deep.brand.allColors.length >= 2;

  return {
    hasLogo,
    hasExtractedColors,
    colorCount: deep.brand.allColors.length,
    primaryColor: deep.brand.primaryColor,
    logoUrl: deep.brand.logoUrl,
  };
}

export function isDemoBrandReady(quality: DemoBrandQuality): boolean {
  return quality.hasLogo && quality.hasExtractedColors;
}

export function canAttemptDemoProbe(b: Bedrijf): boolean {
  return hasAutoMailerContact(b) && !!b.website?.trim();
}
