import type { Browser, Page } from "puppeteer";
import { dismissCookieConsent } from "./cookie-consent";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export function normalizeWebsiteUrl(website: string): string | null {
  const raw = website.trim();
  if (!raw) return null;
  try {
    const withProto = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    const u = new URL(withProto);
    if (!u.hostname || u.hostname === "localhost") return null;
    return u.toString();
  } catch {
    return null;
  }
}

/** Snelle homepage-screenshot (geen rapport, geen e-mailscan). */
export async function capturePreviewOnPage(
  page: Page,
  url: string,
): Promise<Buffer | null> {
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 22000 });
  } catch {
    try {
      await page.goto(url, { waitUntil: "load", timeout: 18000 });
    } catch {
      return null;
    }
  }

  await dismissCookieConsent(page);
  await sleep(500);

  try {
    return (await page.screenshot({
      type: "png",
      fullPage: false,
      captureBeyondViewport: false,
    })) as Buffer;
  } catch {
    return null;
  }
}

export async function launchPreviewBrowser(): Promise<Browser> {
  const puppeteer = await import("puppeteer");
  return puppeteer.default.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
    ],
  });
}

export async function newPreviewPage(browser: Browser): Promise<Page> {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.setUserAgent(
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  );
  return page;
}
