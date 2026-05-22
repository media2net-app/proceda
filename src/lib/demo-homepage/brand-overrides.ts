/** Handmatige brand-assets wanneer website-scrape faalt (bijv. CMS-logo). */
export type BrandOverride = {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  textColor: string;
  logoPath: string;
  /** Transparant bronlogo in public/brand-assets/{slug}/logo.png */
  logoSourceSlug?: string;
  skipHeroDownload?: boolean;
};

const SCHENKEL_SLUG = "schenkel-makelaardij";

export const BRAND_OVERRIDES: Record<string, BrandOverride> = {
  [SCHENKEL_SLUG]: {
    primaryColor: "#E85B2B",
    secondaryColor: "#3A3A3A",
    accentColor: "#E85B2B",
    textColor: "#1F2937",
    logoPath: `/brand-assets/${SCHENKEL_SLUG}/logo.png`,
    logoSourceSlug: SCHENKEL_SLUG,
  },
};

export { getBrandOverrideFromRegistry as getBrandOverride } from "./demo-brand-registry";
