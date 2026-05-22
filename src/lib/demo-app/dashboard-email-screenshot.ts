import fs from "fs/promises";
import path from "path";
import type { Page } from "puppeteer";
import { demoAppPublicPath } from "@/lib/bedrijven/demo-slug";
import {
  launchPreviewBrowser,
  newPreviewPage,
} from "@/lib/bedrijven/capture-website-preview";

export const DEMO_EMAIL_SCREENSHOT_FILE = "email-dashboard.png";

export function demoDashboardScreenshotPublicPath(demoSlug: string): string {
  return `/demos/${demoSlug}/assets/${DEMO_EMAIL_SCREENSHOT_FILE}`;
}

export function demoDashboardScreenshotAbsoluteUrl(
  baseUrl: string,
  demoSlug: string,
): string {
  const base = baseUrl.replace(/\/$/, "");
  return `${base}${demoDashboardScreenshotPublicPath(demoSlug)}`;
}

export function demoDashboardScreenshotFilePath(demoSlug: string): string {
  return path.join(
    process.cwd(),
    "public",
    "demos",
    demoSlug,
    "assets",
    DEMO_EMAIL_SCREENSHOT_FILE,
  );
}

export async function dashboardScreenshotExists(
  demoSlug: string,
): Promise<boolean> {
  try {
    await fs.access(demoDashboardScreenshotFilePath(demoSlug));
    return true;
  } catch {
    return false;
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function captureDemoDashboardOnPage(
  page: Page,
  demoSlug: string,
  baseUrl: string,
  locale: string = "nl",
): Promise<Buffer | null> {
  const url = `${baseUrl.replace(/\/$/, "")}${demoAppPublicPath(demoSlug, locale)}`;

  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 35_000 });
  } catch {
    try {
      await page.goto(url, { waitUntil: "load", timeout: 25_000 });
    } catch {
      return null;
    }
  }

  try {
    await page.waitForFunction(
      () => document.querySelectorAll("canvas").length >= 2,
      { timeout: 12_000 },
    );
  } catch {
    /* dashboard zonder charts — doorgaan */
  }
  await sleep(1800);

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

export async function saveDemoDashboardScreenshot(
  demoSlug: string,
  buffer: Buffer,
): Promise<string> {
  const filePath = demoDashboardScreenshotFilePath(demoSlug);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, buffer);
  return demoDashboardScreenshotPublicPath(demoSlug);
}

export async function captureAndSaveDemoDashboardScreenshot(
  demoSlug: string,
  baseUrl: string,
  locale: string = "nl",
): Promise<string | null> {
  const browser = await launchPreviewBrowser();
  try {
    const page = await newPreviewPage(browser);
    await page.setViewport({ width: 1280, height: 900 });
    const buffer = await captureDemoDashboardOnPage(
      page,
      demoSlug,
      baseUrl,
      locale,
    );
    if (!buffer) return null;
    return saveDemoDashboardScreenshot(demoSlug, buffer);
  } finally {
    await browser.close();
  }
}
