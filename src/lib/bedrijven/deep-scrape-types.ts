export type ScrapedPage = {
  url: string;
  path: string;
  title: string | null;
  metaDescription: string | null;
  headings: string[];
  paragraphs: string[];
  navLinks: { text: string; href: string }[];
  imageUrls: string[];
  scrapedAt: string;
};

export type BrandAssets = {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  textColor: string;
  logoUrl: string | null;
  logoLocalPath: string | null;
  faviconUrl: string | null;
  heroImageUrl: string | null;
  heroImageLocalPath: string | null;
  fontFamily: string | null;
  allColors: string[];
};

import type { ScrapedListing } from "./listing-scrape";

export type { ScrapedListing };

export type DeepScrapeResult = {
  businessId: string;
  businessName: string;
  website: string;
  scrapedAt: string;
  brand: BrandAssets;
  pages: ScrapedPage[];
  /** Woningen/producten met optionele foto (demo aanbod-sectie). */
  listings: ScrapedListing[];
  allNavTexts: string[];
  allImageUrls: string[];
  contact: {
    emails: string[];
    phones: string[];
    addresses: string[];
  };
  tagline: string | null;
  services: string[];
  aboutText: string | null;
  homepageScreenshotPath: string | null;
  errors: string[];
};
