import * as cheerio from "cheerio";
import fs from "fs/promises";
import path from "path";
import type { ScrapedPage } from "./deep-scrape-types";

export type ScrapedListing = {
  badge: string;
  title: string;
  city: string;
  price: string;
  imageUrl: string | null;
  imageLocalPath: string | null;
};

const LISTING_TEXT_RE =
  /(Nieuw|Te koop|Onder bod)\s+(.+?)\s+(\d{4}\s*[A-Z]{2})\s+([^€]+?)\s+€\s*([\d.,]+)/gi;

function resolveUrl(base: string, href: string): string | null {
  try {
    return new URL(href, base).href;
  } catch {
    return null;
  }
}

/** Haal woning-/productfoto's uit Realworks & vergelijkbare CMS'en. */
export function collectListingImageUrls(pages: ScrapedPage[]): string[] {
  const seen = new Set<string>();
  const urls: string[] = [];

  for (const page of pages) {
    for (const u of page.imageUrls) {
      if (
        /media\.objectmedia|objectmedia\/\d+|woningaanbod|property/i.test(u) &&
        !/logo|favicon|partner|icon|employee|nvm|funda/i.test(u)
      ) {
        const norm = u.split("#")[0]!;
        if (!seen.has(norm)) {
          seen.add(norm);
          urls.push(norm);
        }
      }
    }
  }

  return urls;
}

export function pickHeroImageUrl(
  pages: ScrapedPage[],
  listingImageUrls: string[],
): string | null {
  for (const page of pages) {
    for (const u of page.imageUrls) {
      if (/headerbanner|hero|banner|slider|header.*\.(jpg|webp)/i.test(u)) {
        if (!/logo/i.test(u)) return upscaleImageUrl(u);
      }
    }
  }

  if (listingImageUrls[0]) return upscaleImageUrl(listingImageUrls[0]);

  for (const page of pages) {
    const og = page.imageUrls.find((u) => /cmsfile.*\.(jpg|webp)/i.test(u));
    if (og && !/logo|favicon/i.test(og)) return upscaleImageUrl(og);
  }

  return null;
}

/** Grotere variant voor hero (Realworks resize-params). */
export function upscaleImageUrl(url: string): string {
  return url
    .replace(/width=\d+/i, "width=1400")
    .replace(/height=\d+/i, "height=800");
}

export function extractListingsFromPages(
  pages: ScrapedPage[],
  max = 6,
): Omit<ScrapedListing, "imageUrl" | "imageLocalPath">[] {
  const listings: Omit<ScrapedListing, "imageUrl" | "imageLocalPath">[] = [];
  const text = pages.flatMap((p) => p.paragraphs).join("\n");
  let m: RegExpExecArray | null;
  LISTING_TEXT_RE.lastIndex = 0;
  while ((m = LISTING_TEXT_RE.exec(text)) !== null && listings.length < max) {
    listings.push({
      badge: m[1]!,
      title: `${m[2]!.trim()}, ${m[3]!.trim()}`,
      city: m[4]!.trim(),
      price: `€ ${m[5]!.trim().replace(/,-$/, "")}`,
    });
  }
  return listings;
}

/** Parse listing-kaarten uit HTML (Realworks woningaanbod). */
export function extractListingsFromHtml(
  html: string,
  pageUrl: string,
  max = 6,
): { badge: string; title: string; city: string; price: string; imageUrl: string | null }[] {
  const $ = cheerio.load(html);
  const out: {
    badge: string;
    title: string;
    city: string;
    price: string;
    imageUrl: string | null;
  }[] = [];

  const cardSelectors = [
    "[class*='object']",
    "[class*='woning']",
    "[class*='aanbod']",
    "article",
    ".card",
  ];

  for (const sel of cardSelectors) {
    $(sel).each((_, el) => {
      if (out.length >= max) return;
      const block = $(el);
      const imgSrc =
        block.find("img").first().attr("src") ||
        block.find("img").first().attr("data-src");
      if (!imgSrc || !/objectmedia|media\./i.test(imgSrc)) return;

      const text = block.text().replace(/\s+/g, " ");
      const match = LISTING_TEXT_RE.exec(text);
      LISTING_TEXT_RE.lastIndex = 0;
      if (match) {
        out.push({
          badge: match[1]!,
          title: `${match[2]!.trim()}, ${match[3]!.trim()}`,
          city: match[4]!.trim(),
          price: `€ ${match[5]!.trim().replace(/,-$/, "")}`,
          imageUrl: resolveUrl(pageUrl, imgSrc),
        });
        return;
      }

      const heading = block
        .find("h2, h3, h4, .street, [class*='address']")
        .first()
        .text()
        .trim();
      if (heading.length >= 5) {
        out.push({
          badge: /nieuw/i.test(text) ? "Nieuw" : /onder bod/i.test(text) ? "Onder bod" : "Te koop",
          title: heading,
          city: "",
          price: text.match(/€\s*[\d.,]+/)?.[0] ?? "€ —",
          imageUrl: resolveUrl(pageUrl, imgSrc),
        });
      }
    });
    if (out.length >= max) break;
  }

  return out.slice(0, max);
}

export function mergeListingsWithImages(
  textListings: Omit<ScrapedListing, "imageUrl" | "imageLocalPath">[],
  imageUrls: string[],
  htmlListings: ReturnType<typeof extractListingsFromHtml>,
  max = 6,
): ScrapedListing[] {
  const merged: ScrapedListing[] = [];

  const primary =
    htmlListings.length > 0
      ? htmlListings.map((h) => ({
          badge: h.badge,
          title: h.title,
          city: h.city,
          price: h.price,
          imageUrl: h.imageUrl,
          imageLocalPath: null as string | null,
        }))
      : textListings.map((t, i) => ({
          ...t,
          imageUrl: imageUrls[i] ?? null,
          imageLocalPath: null as string | null,
        }));

  for (const item of primary.slice(0, max)) {
    merged.push({
      badge: item.badge,
      title: item.title,
      city: item.city,
      price: item.price,
      imageUrl: item.imageUrl ?? imageUrls[merged.length] ?? null,
      imageLocalPath: null,
    });
  }

  return merged;
}

export async function downloadAsset(
  url: string,
  destPath: string,
): Promise<boolean> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; ProcedaBot/1.0; +https://proceda.nl)",
        Referer: "https://www.schenkelmakelaardij.nl/",
      },
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return false;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 500) return false;
    await fs.mkdir(path.dirname(destPath), { recursive: true });
    await fs.writeFile(destPath, buf);
    return true;
  } catch {
    return false;
  }
}

function extFromUrl(url: string): string {
  const m = url.match(/\.(webp|jpe?g|png)/i);
  return m ? m[1]!.toLowerCase().replace("jpeg", "jpg") : "webp";
}

export async function downloadListingImages(
  listings: ScrapedListing[],
  assetsDir: string,
): Promise<ScrapedListing[]> {
  const listingsDir = path.join(assetsDir, "listings");
  await fs.mkdir(listingsDir, { recursive: true });

  const result: ScrapedListing[] = [];
  for (let i = 0; i < listings.length; i++) {
    const item = listings[i]!;
    let imageLocalPath: string | null = null;
    if (item.imageUrl) {
      const ext = extFromUrl(item.imageUrl);
      const dest = path.join(listingsDir, `${i}.${ext}`);
      if (await downloadAsset(item.imageUrl, dest)) {
        imageLocalPath = `assets/listings/${i}.${ext}`;
      }
    }
    result.push({ ...item, imageLocalPath });
  }
  return result;
}

export async function downloadHeroImage(
  heroUrl: string,
  assetsDir: string,
): Promise<string | null> {
  const ext = extFromUrl(heroUrl);
  const dest = path.join(assetsDir, `hero.${ext}`);
  if (await downloadAsset(heroUrl, dest)) {
    return `assets/hero.${ext}`;
  }
  return null;
}

export async function saveHomepageScreenshotAsHero(
  screenshotBuffer: Buffer,
  assetsDir: string,
): Promise<string | null> {
  const dest = path.join(assetsDir, "hero-screenshot.png");
  await fs.mkdir(assetsDir, { recursive: true });
  await fs.writeFile(dest, screenshotBuffer);
  return "assets/hero-screenshot.png";
}
