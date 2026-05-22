import * as cheerio from "cheerio";
import type { Bedrijf } from "./types";
import { screenshotApiPath } from "./slug";
import { screenshotFilePath } from "./business-report-storage";
import { browsePageForReport, saveScreenshotBuffer } from "./page-browser";

function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (trimmed.startsWith("http")) return trimmed;
  return `https://${trimmed}`;
}

const COOKIE_BOILERPLATE =
  /\b(cookie|cookies|toestemming|consent|privacy preference|uw privacy|gdpr|avg)\b/i;

export type WebsiteScanResult = {
  url: string;
  html: string;
  pageTitle: string | null;
  metaDescription: string | null;
  extractedSnippet: string;
  navTexts: string[];
  usesHttps: boolean;
  responseTimeMs: number;
  seoScore: number;
  modernityScore: number;
  screenshotPath: string | null;
  cookiesDismissed?: boolean;
  extractedEmail?: string;
  fetchError?: string;
};

function extractSnippet($: cheerio.CheerioAPI): string {
  const parts: string[] = [];

  $("script, style, noscript, [id*='cookie'], [class*='cookie'], [id*='consent'], [class*='consent']").remove();

  $("h1").each((_, el) => {
    const t = $(el).text().trim();
    if (t && !COOKIE_BOILERPLATE.test(t)) parts.push(t);
  });
  $("h2").slice(0, 4).each((_, el) => {
    const t = $(el).text().trim();
    if (t && !COOKIE_BOILERPLATE.test(t)) parts.push(t);
  });
  $("p").slice(0, 12).each((_, el) => {
    const t = $(el).text().trim();
    if (t.length > 40 && !COOKIE_BOILERPLATE.test(t)) parts.push(t);
  });

  const combined = parts.join(" ").replace(/\s+/g, " ").trim();
  return combined.slice(0, 2500);
}

function extractNavTexts($: cheerio.CheerioAPI): string[] {
  const texts = new Set<string>();
  const selectors = [
    "nav a",
    "header a",
    '[role="navigation"] a',
    ".menu a",
    ".nav a",
  ];
  for (const sel of selectors) {
    $(sel).each((_, el) => {
      const t = $(el).text().replace(/\s+/g, " ").trim();
      if (t.length >= 2 && t.length <= 48 && !COOKIE_BOILERPLATE.test(t)) {
        texts.add(t);
      }
    });
  }
  return [...texts].slice(0, 35);
}

export async function scanWebsite(business: Bedrijf): Promise<WebsiteScanResult> {
  const url = normalizeUrl(business.website!);
  const start = Date.now();

  const browse = await browsePageForReport(url);
  const responseTimeMs = Date.now() - start;
  const usesHttps = browse.finalUrl.startsWith("https://");
  const fetchError = browse.error;

  const html = browse.html || "";
  const $ = cheerio.load(html || "<html></html>");
  const pageTitle = $("title").first().text().trim() || null;
  const metaDescription =
    $('meta[name="description"]').attr("content")?.trim() || null;
  const extractedSnippet = extractSnippet($);
  const navTexts = extractNavTexts($);
  const hasViewport = $('meta[name="viewport"]').length > 0;
  const h1Count = $("h1").length;

  let seoScore = 40;
  let modernityScore = 35;
  if (!fetchError && html.length > 200) {
    if (usesHttps) {
      seoScore += 15;
      modernityScore += 10;
    }
    if (pageTitle && pageTitle.length >= 25 && pageTitle.length <= 65) seoScore += 15;
    if (metaDescription && metaDescription.length >= 70) seoScore += 15;
    if (h1Count === 1) seoScore += 10;
    if (hasViewport) modernityScore += 25;
    if (responseTimeMs < 8000) modernityScore += 10;
    if (extractedSnippet.length > 200) seoScore += 10;
  } else {
    seoScore = 15;
    modernityScore = 10;
  }

  seoScore = Math.min(100, seoScore);
  modernityScore = Math.min(100, modernityScore);

  const filePath = screenshotFilePath(business.id);
  let screenshotOk = false;
  if (browse.screenshot) {
    await saveScreenshotBuffer(browse.screenshot, filePath);
    screenshotOk = true;
  }

  if (browse.cookiesDismissed) {
    console.log(`[report] cookies accepted for ${business.name}`);
  }

  if (browse.extractedEmail) {
    const { patchBusinessContact } = await import("./patch-business-contact");
    await patchBusinessContact(business.id, { email: browse.extractedEmail });
  }

  return {
    url: browse.finalUrl,
    html,
    pageTitle,
    metaDescription,
    extractedSnippet,
    navTexts,
    usesHttps,
    responseTimeMs,
    seoScore,
    modernityScore,
    screenshotPath: screenshotOk ? screenshotApiPath(business.id) : null,
    cookiesDismissed: browse.cookiesDismissed,
    extractedEmail: browse.extractedEmail,
    fetchError,
  };
}
