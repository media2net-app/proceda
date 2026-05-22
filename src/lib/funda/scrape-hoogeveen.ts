import fs from "fs/promises";
import path from "path";
import {
  HOOGEVEN_OFFICE_FALLBACKS,
  isOwnOfficeName,
  mergeOfficeRefs,
} from "./hoogeveen-offices";
import { extractOfficesFromNuxtHtml } from "./parse-nuxt-offices";
import type { FundaCompetitorStat, FundaListing, FundaScrapeResult } from "./types";

const CACHE_PATH = path.join(process.cwd(), "data", "funda-hoogeveen.json");
const SEARCH_URL =
  "https://www.funda.nl/zoeken/koop?selected_area=%5B%22hoogeveen%22%5D";
const AREA_PARAM = "selected_area=%5B%22hoogeveen%22%5D";
const OFFICE_MATCH = /schenkel/i;
const OFFICE_COUNT_DELAY_MS = 4000;

function parsePriceNum(price: string): number | null {
  const m = price.replace(/\./g, "").match(/€\s*([\d]+)/);
  return m ? Number(m[1]) : null;
}

function formatStreetFromSlug(slugPart: string): string {
  const cleaned = slugPart
    .replace(/^(huis|appartement|woonhuis|bovenwoning|benedenwoning)-/i, "")
    .replace(/-/g, " ");
  return cleaned.replace(/\b\w/g, (c) => c.toUpperCase());
}

function parseListingBlock(
  href: string,
  blockText: string,
  imageUrl: string | null,
): FundaListing | null {
  const id = href.match(/(\d+)\/?$/)?.[1];
  if (!id) return null;

  const slugParts = href.split("/").filter(Boolean);
  const slugStreet = slugParts[slugParts.length - 2] ?? "";
  const propertyType = slugStreet.startsWith("appartement")
    ? "Appartement"
    : "Woning";

  const lines = blockText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const priceLine = lines.find((l) => /€/.test(l)) ?? "";
  const postcodeLine = lines.find((l) => /\d{4}\s*[A-Z]{2}/i.test(l)) ?? "";
  const pcMatch = postcodeLine.match(/(\d{4}\s*[A-Z]{2})\s*(.*)/i);
  const postcode = pcMatch?.[1]?.toUpperCase() ?? "";
  const city = pcMatch?.[2]?.trim() || "Hoogeveen";

  const addressLine =
    lines.find(
      (l) =>
        !/€|m²|schenkel|makelaar|blikvanger|toppositie/i.test(l) && l.length > 3,
    ) ?? formatStreetFromSlug(slugStreet);

  const m2Lines = lines.filter((l) => /m²/.test(l));
  const livingArea = m2Lines[0] ?? "";
  const plotArea = m2Lines[1] ?? "";
  const rooms = lines.find((l) => /^\d+$/.test(l)) ?? "";
  const energyLabel = lines.find((l) => /^[A-G]\+{0,2}$/i.test(l)) ?? "";
  const agent =
    lines.find((l) => /makelaar/i.test(l)) ?? lines[lines.length - 1] ?? "";

  const price =
    priceLine.match(/€\s*[\d.]+(?:\s*k\.k\.|\s*v\.o\.n\.)?/i)?.[0] ?? priceLine;

  return {
    id,
    url: `https://www.funda.nl${href}`,
    address: addressLine.replace(/\s+/g, " ").trim(),
    postcode,
    city,
    price,
    priceNum: parsePriceNum(price),
    livingArea,
    plotArea,
    rooms,
    energyLabel,
    agent: agent.trim(),
    propertyType,
    imageUrl,
    isOwnOffice: OFFICE_MATCH.test(agent),
  };
}

function isBlockedPage(html: string, h1: string): boolean {
  return (
    h1.includes("bijna op de pagina") ||
    html.includes("bijna op de pagina die je zoekt")
  );
}

async function fetchOfficeListingCount(uuid: string): Promise<number | null> {
  const puppeteer = await import("puppeteer");
  const browser = await puppeteer.default.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
    ],
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    );
    const url = `https://www.funda.nl/zoeken/koop?${AREA_PARAM}&agent_office_id=%22${uuid}%22`;
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
    await new Promise((r) => setTimeout(r, 3000));

    const h1 = await page.evaluate(
      () => document.querySelector("h1")?.textContent?.trim() ?? "",
    );

    if (isBlockedPage("", h1)) return null;

    const count = Number(h1.match(/(\d+)/)?.[1] ?? NaN);
    return Number.isFinite(count) ? count : null;
  } finally {
    await browser.close();
  }
}

async function scrapeCompetitorCounts(
  html: string,
  totalCount: number,
): Promise<FundaCompetitorStat[]> {
  const fromPage = extractOfficesFromNuxtHtml(html);
  const offices = mergeOfficeRefs(fromPage, HOOGEVEN_OFFICE_FALLBACKS);

  const competitors: FundaCompetitorStat[] = [];

  for (const office of offices) {
    const count = await fetchOfficeListingCount(office.uuid);
    if (count !== null) {
      competitors.push({
        numId: office.numId,
        name: office.name,
        url: `https://www.funda.nl${office.url}`,
        count,
        sharePct:
          totalCount > 0 ? Math.round((count / totalCount) * 1000) / 10 : 0,
        isOwnOffice: isOwnOfficeName(office.name),
      });
    }

    await new Promise((r) => setTimeout(r, 2000));
  }

  return competitors.sort((a, b) => b.count - a.count);
}

export async function scrapeFundaHoogeveen(
  maxListings = 24,
): Promise<FundaScrapeResult> {
  const puppeteer = await import("puppeteer");
  const browser = await puppeteer.default.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
    ],
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    );
    await page.setViewport({ width: 1400, height: 900 });

    await page.goto(SEARCH_URL, {
      waitUntil: "networkidle2",
      timeout: 60000,
    });
    await new Promise((r) => setTimeout(r, 5000));

    const pageHtml = await page.content();

    const raw = await page.evaluate((limit) => {
      const totalText =
        document.querySelector("h1")?.textContent ??
        document.querySelector("[data-testid='search-result-count']")?.textContent ??
        "";
      const totalMatch = totalText.match(/(\d+)/);
      const totalCount = totalMatch ? Number(totalMatch[1]) : 0;

      const seen = new Set<string>();
      const rows: { href: string; text: string; imageUrl: string | null }[] =
        [];

      for (const link of document.querySelectorAll(
        'a[href*="/detail/koop/hoogeveen/"]',
      )) {
        const href = link.getAttribute("href");
        if (!href || seen.has(href)) continue;

        let block: HTMLElement | null = link.parentElement;
        let blockText = "";
        let imageUrl: string | null = null;

        for (let i = 0; i < 12 && block; i++) {
          const t = block.innerText || "";
          if (t.includes("€") && /Hoogeveen|\d{4}\s*[A-Z]{2}/i.test(t)) {
            blockText = t;
            const img = block.querySelector("img");
            imageUrl = img?.src || img?.getAttribute("data-src") || null;
            break;
          }
          block = block.parentElement;
        }

        if (!blockText) continue;
        seen.add(href);
        rows.push({ href, text: blockText, imageUrl });
        if (rows.length >= limit) break;
      }

      return { totalCount, rows };
    }, maxListings);

    const listings: FundaListing[] = [];
    for (const row of raw.rows) {
      const parsed = parseListingBlock(row.href, row.text, row.imageUrl);
      if (parsed) listings.push(parsed);
    }

    const totalCount = raw.totalCount || listings.length;
    const competitors = await scrapeCompetitorCounts(pageHtml, totalCount);

    const schenkelFromCompetitors = competitors.find((c) => c.isOwnOffice)?.count;
    const prices = listings
      .map((l) => l.priceNum)
      .filter((p): p is number => p != null);

    const stats = {
      avgPrice:
        prices.length > 0
          ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
          : null,
      minPrice: prices.length > 0 ? Math.min(...prices) : null,
      maxPrice: prices.length > 0 ? Math.max(...prices) : null,
      schenkelCount:
        schenkelFromCompetitors ??
        listings.filter((l) => l.isOwnOffice).length,
      competitors,
    };

    return {
      area: "Hoogeveen",
      region: "Drenthe",
      scrapedAt: new Date().toISOString(),
      totalCount,
      listings,
      stats,
    };
  } finally {
    await browser.close();
  }
}

export async function saveFundaCache(data: FundaScrapeResult): Promise<void> {
  await fs.mkdir(path.dirname(CACHE_PATH), { recursive: true });
  await fs.writeFile(CACHE_PATH, JSON.stringify(data, null, 2), "utf-8");
}

export async function loadFundaCache(): Promise<FundaScrapeResult | null> {
  try {
    const raw = await fs.readFile(CACHE_PATH, "utf-8");
    const data = JSON.parse(raw) as FundaScrapeResult;
    if (!data.stats.competitors) {
      data.stats.competitors = [];
    }
    return data;
  } catch {
    return null;
  }
}

export async function getFundaHoogeveenData(
  refresh = false,
): Promise<FundaScrapeResult> {
  if (!refresh) {
    const cached = await loadFundaCache();
    if (cached && cached.listings.length > 0) return cached;
  }

  const fresh = await scrapeFundaHoogeveen(24);

  if (fresh.listings.length === 0) {
    const cached = await loadFundaCache();
    if (cached?.listings.length) {
      if (fresh.stats.competitors.length > 0) {
        return {
          ...cached,
          scrapedAt: fresh.scrapedAt,
          totalCount: fresh.totalCount || cached.totalCount,
          stats: {
            ...cached.stats,
            competitors: fresh.stats.competitors,
            schenkelCount:
              fresh.stats.schenkelCount || cached.stats.schenkelCount,
          },
        };
      }
      return cached;
    }
  }

  await saveFundaCache(fresh);
  return fresh;
}
