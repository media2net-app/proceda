import * as cheerio from "cheerio";
import fs from "fs/promises";
import path from "path";
import type { Bedrijf } from "./types";
import type { DeepScrapeResult, ScrapedPage } from "./deep-scrape-types";
import {
  extractBrandFromHtml,
  pickBrandPalette,
  parseHexOrRgb,
} from "./brand-extraction";
import { businessIdToDemoSlug } from "./demo-slug";
import { dismissCookieConsent } from "./cookie-consent";
import { extractEmailFromHtml } from "./contact-utils";
import { screenshotApiPath } from "./slug";
import { screenshotFilePath } from "./business-report-storage";
import { saveScreenshotBuffer } from "./page-browser";
import {
  collectListingImageUrls,
  downloadHeroImage,
  downloadListingImages,
  extractListingsFromHtml,
  extractListingsFromPages,
  mergeListingsWithImages,
  pickHeroImageUrl,
  saveHomepageScreenshotAsHero,
} from "./listing-scrape";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function normalizeUrl(url: string): string {
  const t = url.trim();
  return t.startsWith("http") ? t : `https://${t}`;
}

const COOKIE_RE =
  /\b(cookie|cookies|toestemming|consent|privacy preference)\b/i;

function scrapePageHtml(
  html: string,
  pageUrl: string,
): Omit<ScrapedPage, "url" | "scrapedAt"> {
  const $ = cheerio.load(html);
  $("script, style, noscript").remove();

  const title = $("title").first().text().trim() || null;
  const metaDescription =
    $('meta[name="description"]').attr("content")?.trim() || null;

  const headings: string[] = [];
  $("h1, h2, h3").each((_, el) => {
    const t = $(el).text().replace(/\s+/g, " ").trim();
    if (t.length >= 3 && !COOKIE_RE.test(t)) headings.push(t);
  });

  const paragraphs: string[] = [];
  $("p, li").each((_, el) => {
    const t = $(el).text().replace(/\s+/g, " ").trim();
    if (t.length >= 50 && !COOKIE_RE.test(t)) paragraphs.push(t);
  });

  const navLinks: { text: string; href: string }[] = [];
  $("nav a, header a").each((_, el) => {
    const text = $(el).text().replace(/\s+/g, " ").trim();
    const href = $(el).attr("href");
    if (text && href && text.length < 50) {
      navLinks.push({ text, href });
    }
  });

  const brandBits = extractBrandFromHtml(html, pageUrl);

  let pagePath = "/";
  try {
    pagePath = new URL(pageUrl).pathname || "/";
  } catch {
    // keep /
  }

  return {
    path: pagePath,
    title,
    metaDescription,
    headings: [...new Set(headings)].slice(0, 25),
    paragraphs: [...new Set(paragraphs)].slice(0, 30),
    navLinks: navLinks.slice(0, 40),
    imageUrls: brandBits.imageUrls,
  };
}

function discoverInternalUrls(html: string, baseUrl: string, max = 10): string[] {
  const $ = cheerio.load(html);
  const base = new URL(baseUrl);
  const out = new Set<string>();
  const priority = [
    /diensten/i,
    /aanbod|woning/i,
    /over.?ons|overons/i,
    /contact/i,
    /vestiging/i,
    /taxatie|verkoop|aankoop|huur/i,
  ];

  const candidates: { url: string; score: number }[] = [];
  out.add(baseUrl);

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href || href.startsWith("#") || href.startsWith("mailto:")) return;
    try {
      const u = new URL(href, baseUrl);
      if (u.hostname !== base.hostname) return;
      if (/\.(pdf|jpg|png|zip)$/i.test(u.pathname)) return;
      let score = 0;
      for (let i = 0; i < priority.length; i++) {
        if (priority[i]!.test(u.pathname)) score += 10 - i;
      }
      candidates.push({ url: u.href.split("#")[0]!, score });
    } catch {
      // skip
    }
  });

  candidates.sort((a, b) => b.score - a.score);
  for (const c of candidates) {
    if (out.size >= max) break;
    out.add(c.url);
  }
  return [...out];
}

async function downloadAsset(
  url: string,
  destPath: string,
): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; ProcedaBot/1.0; +https://proceda.nl)",
      },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 200) return null;
    await fs.mkdir(path.dirname(destPath), { recursive: true });
    await fs.writeFile(destPath, buf);
    return destPath;
  } catch {
    return null;
  }
}

function extractContacts(text: string): {
  emails: string[];
  phones: string[];
  addresses: string[];
} {
  const emails = [
    ...new Set(
      (text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) ?? [])
        .map((e) => e.toLowerCase())
        .filter((e) => !e.includes("example")),
    ),
  ];
  const phones = [
    ...new Set(text.match(/(?:\+31|0)[\s-]?(?:\d[\s-]?){8,12}/g) ?? []),
  ];
  const addresses: string[] = [];
  const addrMatch = text.match(
    /\b[\w\s]+\s+\d+[a-z]?\s*,\s*\d{4}\s*[A-Z]{2}\s+[\w\s]+\b/g,
  );
  if (addrMatch) addresses.push(...addrMatch.slice(0, 3));
  return { emails, phones, addresses };
}

export async function runDeepScrape(business: Bedrijf): Promise<DeepScrapeResult> {
  const website = normalizeUrl(business.website!);
  const demoSlug = businessIdToDemoSlug(business.id);
  const assetsDir = path.join(process.cwd(), "public", "demos", demoSlug, "assets");
  const errors: string[] = [];
  const pages: ScrapedPage[] = [];
  let homepageScreenshotPath: string | null = null;
  let homepageShotBuffer: Buffer | null = null;
  const htmlByUrl = new Map<string, string>();
  const computedColors: string[] = [];
  let finalUrl = website;
  let homeHtml = "";

  const puppeteer = await import("puppeteer");
  const browser = await puppeteer.default.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    );

    await page.goto(website, { waitUntil: "networkidle2", timeout: 60000 }).catch(
      () => page.goto(website, { waitUntil: "domcontentloaded", timeout: 60000 }),
    );
    try {
      await dismissCookieConsent(page);
    } catch {
      errors.push("Cookie banner dismiss skipped");
    }
    await sleep(1000);

    homeHtml = await page.content();
    finalUrl = page.url();

    try {
      const palette = await page.evaluate(() => {
        const colors = new Set<string>();
        const sample = (el: Element | null) => {
          if (!el) return;
          const s = getComputedStyle(el);
          [s.color, s.backgroundColor, s.borderTopColor].forEach((v) => {
            if (v && v !== "rgba(0, 0, 0, 0)" && v !== "transparent") {
              colors.add(v);
            }
          });
        };
        sample(document.querySelector("header"));
        sample(document.querySelector("nav"));
        sample(document.querySelector("a"));
        sample(document.querySelector("h1"));
        sample(document.body);
        return [...colors];
      });
      for (const c of palette) {
        const p = parseHexOrRgb(c);
        if (p) computedColors.push(p);
      }
    } catch {
      errors.push("Brand colors from browser failed");
    }

    try {
      const shot = (await page.screenshot({
        type: "png",
        fullPage: false,
      })) as Buffer;
      homepageShotBuffer = shot;
      await saveScreenshotBuffer(shot, screenshotFilePath(business.id));
      homepageScreenshotPath = screenshotApiPath(business.id);
    } catch {
      errors.push("Homepage screenshot failed");
    }

    htmlByUrl.set(finalUrl, homeHtml);
    pages.push({
      url: finalUrl,
      ...scrapePageHtml(homeHtml, finalUrl),
      scrapedAt: new Date().toISOString(),
    });

    const urls = discoverInternalUrls(homeHtml, finalUrl, 10);

    for (const url of urls) {
      if (url === finalUrl || url === website) continue;
      try {
        await page.goto(url, {
          waitUntil: "domcontentloaded",
          timeout: 35000,
        });
        try {
          await dismissCookieConsent(page);
        } catch {
          // continue
        }
        await sleep(600);
        const html = await page.content();
        const pageUrl = page.url();
        htmlByUrl.set(pageUrl, html);
        pages.push({
          url: pageUrl,
          ...scrapePageHtml(html, pageUrl),
          scrapedAt: new Date().toISOString(),
        });
      } catch (e) {
        errors.push(
          `Page ${url}: ${e instanceof Error ? e.message : "failed"}`,
        );
      }
    }
  } finally {
    await browser.close();
  }

  const brandExtract = extractBrandFromHtml(homeHtml, finalUrl);
  const allColors = [...new Set([...computedColors, ...brandExtract.colors])];
  let palette = pickBrandPalette(allColors);

  const { getBrandOverride } = await import("@/lib/demo-homepage/brand-overrides");
  const manualBrand = getBrandOverride(demoSlug);
  if (manualBrand) {
    palette = {
      primaryColor: manualBrand.primaryColor,
      secondaryColor: manualBrand.secondaryColor,
      accentColor: manualBrand.accentColor,
      textColor: manualBrand.textColor,
    };
  }

  let logoLocalPath: string | null = null;
  if (manualBrand?.logoPath) {
    logoLocalPath = "assets/logo.png";
  } else if (brandExtract.logoUrl) {
    const ext = brandExtract.logoUrl.match(/\.(png|jpe?g|webp|svg)/i)?.[1] ?? "png";
    const dest = path.join(assetsDir, `logo.${ext}`);
    if (await downloadAsset(brandExtract.logoUrl, dest)) {
      logoLocalPath = `assets/logo.${ext}`;
    }
  }

  const listingImageUrls = collectListingImageUrls(pages);
  const textListings = extractListingsFromPages(pages, 6);
  let htmlListings = extractListingsFromHtml(homeHtml, finalUrl, 6);
  for (const p of pages) {
    if (!/aanbod|woning/i.test(p.url)) continue;
    const html = htmlByUrl.get(p.url);
    if (!html) continue;
    const fromPage = extractListingsFromHtml(html, p.url, 6);
    if (fromPage.length > htmlListings.length) htmlListings = fromPage;
  }
  let listings = mergeListingsWithImages(
    textListings,
    listingImageUrls,
    htmlListings,
    6,
  );
  try {
    listings = await downloadListingImages(listings, assetsDir);
  } catch {
    errors.push("Listing images download failed");
  }

  let heroImageUrl = pickHeroImageUrl(pages, listingImageUrls);
  let heroImageLocalPath: string | null = null;
  if (heroImageUrl && !manualBrand?.skipHeroDownload) {
    heroImageLocalPath = await downloadHeroImage(heroImageUrl, assetsDir);
  }
  if (!heroImageLocalPath && homepageShotBuffer) {
    heroImageLocalPath = await saveHomepageScreenshotAsHero(
      homepageShotBuffer,
      assetsDir,
    );
    heroImageUrl = null;
  }

  const allText = pages.map((p) => p.paragraphs.join(" ")).join(" ");
  const contact = extractContacts(allText);
  const emailFromHtml = extractEmailFromHtml(homeHtml);
  if (emailFromHtml) contact.emails.unshift(emailFromHtml);

  const allNavTexts = [
    ...new Set(pages.flatMap((p) => p.navLinks.map((n) => n.text))),
  ].slice(0, 30);

  const homepage = pages[0];
  const tagline =
    homepage?.headings.find((h) => h.length >= 10 && h.length < 120) ??
    homepage?.title ??
    null;

  let services = allNavTexts.filter((t) =>
    /diensten|aanbod|verkoop|aankoop|huur|taxatie|hypotheek|NVM|woning/i.test(t),
  );
  if (services.length === 0) {
    services = homepage?.headings.filter((h) => h.length < 60).slice(0, 6) ?? [];
  }

  const aboutPage = pages.find((p) => /over|about/i.test(p.url));
  const aboutText = aboutPage?.paragraphs.slice(0, 3).join("\n\n") ?? null;

  return {
    businessId: business.id,
    businessName: business.name,
    website,
    scrapedAt: new Date().toISOString(),
    brand: {
      ...palette,
      logoUrl: brandExtract.logoUrl,
      logoLocalPath,
      faviconUrl: brandExtract.faviconUrl,
      heroImageUrl: heroImageUrl ?? brandExtract.heroImageUrl,
      heroImageLocalPath,
      fontFamily: brandExtract.fontFamily,
      allColors,
    },
    pages,
    listings,
    allNavTexts,
    allImageUrls: [...new Set(pages.flatMap((p) => p.imageUrls))].slice(0, 30),
    contact: {
      emails: [...new Set(contact.emails)],
      phones: [
        ...new Set([
          ...(business.phone ? [business.phone] : []),
          ...contact.phones,
        ]),
      ],
      addresses: contact.addresses,
    },
    tagline,
    services: [...new Set(services)].slice(0, 8),
    aboutText,
    homepageScreenshotPath,
    errors,
  };
}
