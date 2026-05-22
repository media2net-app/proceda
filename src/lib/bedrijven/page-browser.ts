import fs from "fs/promises";
import path from "path";
import {
  extractEmailFromHtml,
  findContactPageUrls,
} from "./contact-utils";
import { dismissCookieConsent } from "./cookie-consent";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export type PageBrowseResult = {
  html: string;
  finalUrl: string;
  screenshot: Buffer | null;
  cookiesDismissed: boolean;
  extractedEmail?: string;
  error?: string;
};


async function visitForEmail(
  page: import("puppeteer").Page,
  url: string,
): Promise<{ html: string; email?: string }> {
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 25000 });
    await dismissCookieConsent(page);
    await sleep(500);
    const html = await page.content();
    const email = extractEmailFromHtml(html);
    return { html, email };
  } catch {
    return { html: "" };
  }
}

/**
 * Load page in Puppeteer, accept cookies, screenshot + e-mail (footer/contact).
 */
export async function browsePageForReport(
  url: string,
): Promise<PageBrowseResult> {
  try {
    const puppeteer = await import("puppeteer");
    const browser = await puppeteer.default.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    );

    let html = "";
    let finalUrl = url;
    let extractedEmail: string | undefined;

    try {
      await page.goto(url, { waitUntil: "networkidle2", timeout: 45000 });
    } catch {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
    }

    const cookiesDismissed = await dismissCookieConsent(page);
    await sleep(800);

    html = await page.content();
    finalUrl = page.url();
    extractedEmail = extractEmailFromHtml(html);

    if (!extractedEmail) {
      const contactUrls = findContactPageUrls(html, finalUrl);
      for (const contactUrl of contactUrls.slice(0, 3)) {
        const visit = await visitForEmail(page, contactUrl);
        if (visit.email) {
          extractedEmail = visit.email;
          break;
        }
      }
    }

    // Screenshot na e-mailscan — homepage opnieuw laden voor schone preview
    try {
      await page.goto(finalUrl, {
        waitUntil: "domcontentloaded",
        timeout: 25000,
      });
      await dismissCookieConsent(page);
      await sleep(400);
    } catch {
      // keep last state
    }

    let screenshot: Buffer | null = null;
    try {
      screenshot = (await page.screenshot({
        type: "png",
        fullPage: false,
        captureBeyondViewport: false,
      })) as Buffer;
    } catch {
      screenshot = null;
    }

    await browser.close();

    if (extractedEmail) {
      console.log(`[report] email found for ${finalUrl}: ${extractedEmail}`);
    }

    return { html, finalUrl, screenshot, cookiesDismissed, extractedEmail };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Browse failed";
    return {
      html: "",
      finalUrl: url,
      screenshot: null,
      cookiesDismissed: false,
      error: message,
    };
  }
}

/** Alleen e-mail (homepage + contact), zonder screenshot — voor bulk-enrich. */
export async function browseWebsiteForEmail(url: string): Promise<string | undefined> {
  try {
    const puppeteer = await import("puppeteer");
    const browser = await puppeteer.default.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    );

    let html = "";
    let finalUrl = url.startsWith("http") ? url : `https://${url}`;

    try {
      await page.goto(finalUrl, { waitUntil: "domcontentloaded", timeout: 25000 });
    } catch {
      await browser.close();
      return undefined;
    }

    await dismissCookieConsent(page);
    await sleep(600);

    html = await page.content();
    finalUrl = page.url();
    let extractedEmail = extractEmailFromHtml(html);

    if (!extractedEmail) {
      const contactUrls = findContactPageUrls(html, finalUrl);
      for (const contactUrl of contactUrls.slice(0, 4)) {
        const visit = await visitForEmail(page, contactUrl);
        if (visit.email) {
          extractedEmail = visit.email;
          break;
        }
      }
    }

    await browser.close();
    return extractedEmail;
  } catch {
    return undefined;
  }
}

export async function saveScreenshotBuffer(
  buffer: Buffer,
  outPath: string,
): Promise<void> {
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, buffer);
}
