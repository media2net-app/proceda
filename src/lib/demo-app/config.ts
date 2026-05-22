import { getBrandOverride } from "@/lib/demo-homepage/brand-overrides";
import { getDemoBrandEntry } from "@/lib/demo-homepage/demo-brand-registry";
import { demoHomepagePublicPath } from "@/lib/bedrijven/demo-slug";
import type { DemoAppBrand } from "./types";

const DEFAULT_PRIMARY = "#7F56D9";
const DEFAULT_SECONDARY = "#101828";

function titleFromSlug(demoSlug: string): string {
  return demoSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getDemoAppBrand(
  demoSlug: string,
  locale: string = "nl",
): DemoAppBrand {
  const override = getBrandOverride(demoSlug);
  const entry = getDemoBrandEntry(demoSlug);
  const name = entry?.businessName ?? titleFromSlug(demoSlug);

  return {
    businessName: name,
    primaryColor: override?.primaryColor ?? DEFAULT_PRIMARY,
    secondaryColor: override?.secondaryColor ?? DEFAULT_SECONDARY,
    textColor: override?.textColor ?? "#1F2937",
    logoPath:
      override?.logoPath ??
      (override?.logoSourceSlug
        ? `/brand-assets/${override.logoSourceSlug}/logo.png`
        : `/demos/${demoSlug}/assets/logo.png`),
    homepageDemoPath: demoHomepagePublicPath(demoSlug, locale),
  };
}
