/**
 * Screenshot van elk demo-dashboard voor gebruik in outreach-mail.
 * Vereist draaiende app: npm run dev (of BASE_URL naar productie).
 *
 * npx tsx scripts/capture-demo-dashboard-screenshots.ts
 * npx tsx scripts/capture-demo-dashboard-screenshots.ts --force --concurrency=3
 * BASE_URL=http://localhost:3001 npx tsx scripts/capture-demo-dashboard-screenshots.ts --force
 */
import fs from "fs/promises";
import path from "path";
import { config } from "dotenv";

config();
config({ path: ".env.local" });

import { businessIdToDemoSlug } from "../src/lib/bedrijven/demo-slug";
import {
  captureDemoDashboardOnPage,
  dashboardScreenshotExists,
  saveDemoDashboardScreenshot,
} from "../src/lib/demo-app/dashboard-email-screenshot";
import {
  launchPreviewBrowser,
  newPreviewPage,
} from "../src/lib/bedrijven/capture-website-preview";

import { resolveAppBaseUrl } from "../src/lib/mail/mail-campaign";

const BASE_URL = process.env.BASE_URL?.trim() || resolveAppBaseUrl();

const PROGRESS_PATH = path.join(
  process.cwd(),
  "data",
  "demo-email-screenshots-progress.json",
);

type ProgressFile = {
  startedAt: string;
  updatedAt: string;
  baseUrl: string;
  total: number;
  ok: number;
  fail: number;
  failedSlugs: string[];
};

async function writeProgress(p: ProgressFile) {
  await fs.mkdir(path.dirname(PROGRESS_PATH), { recursive: true });
  await fs.writeFile(PROGRESS_PATH, JSON.stringify(p, null, 2), "utf-8");
}

async function runPool<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;

  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]!);
      if ((i + 1) % 25 === 0) {
        process.stdout.write(`\r  ${i + 1}/${items.length}…`);
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => worker()),
  );
  process.stdout.write("\n");
  return results;
}

async function main() {
  const { loadDemoReadyAudit } = await import(
    "../src/lib/bedrijven/demo-ready-audit"
  );

  const limitArg = process.argv.find((a) => a.startsWith("--limit="));
  const limit = limitArg ? parseInt(limitArg.split("=")[1]!, 10) : undefined;
  const concArg = process.argv.find((a) => a.startsWith("--concurrency="));
  const concurrency = concArg ? parseInt(concArg.split("=")[1]!, 10) : 3;
  const skipExisting = !process.argv.includes("--force");

  const audit = await loadDemoReadyAudit();
  if (!audit) {
    console.error("Geen demo-ready-audit.json");
    process.exit(1);
  }

  const allSlugs = audit.results
    .filter((r) => r.demoReady)
    .map((r) => businessIdToDemoSlug(r.businessId));

  let slugs = allSlugs;

  if (skipExisting) {
    const checks = await Promise.all(
      slugs.map(async (s) => ((await dashboardScreenshotExists(s)) ? null : s)),
    );
    slugs = checks.filter((s): s is string => !!s);
  }

  if (limit) slugs = slugs.slice(0, limit);

  const force = process.argv.includes("--force");
  console.log(`BASE_URL: ${BASE_URL}`);
  console.log(
    `Demo-klaar: ${allSlugs.length}, te verwerken: ${slugs.length}${force ? " (force: alles opnieuw)" : ""}`,
  );

  if (slugs.length === 0) {
    console.log("Niets te doen (alle aanwezig of geen demo-klaar).");
    return;
  }

  const progress: ProgressFile = {
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    total: slugs.length,
    ok: 0,
    fail: 0,
    failedSlugs: [],
  };
  await writeProgress(progress);

  const browser = await launchPreviewBrowser();
  let ok = 0;
  let fail = 0;
  const failedSlugs: string[] = [];

  try {
    await runPool(slugs, concurrency, async (demoSlug) => {
      const page = await newPreviewPage(browser);
      await page.setViewport({ width: 1280, height: 900 });
      try {
        const buffer = await captureDemoDashboardOnPage(
          page,
          demoSlug,
          BASE_URL,
        );
        if (!buffer) {
          fail++;
          failedSlugs.push(demoSlug);
        } else {
          await saveDemoDashboardScreenshot(demoSlug, buffer);
          ok++;
        }
      } catch {
        fail++;
        failedSlugs.push(demoSlug);
      } finally {
        await page.close();
        progress.ok = ok;
        progress.fail = fail;
        progress.failedSlugs = [...failedSlugs];
        progress.updatedAt = new Date().toISOString();
        if ((ok + fail) % 10 === 0) await writeProgress(progress);
      }
    });
  } finally {
    await browser.close();
  }

  progress.ok = ok;
  progress.fail = fail;
  progress.failedSlugs = failedSlugs;
  progress.updatedAt = new Date().toISOString();
  await writeProgress(progress);

  console.log(`\nKlaar: ${ok} opgeslagen, ${fail} mislukt`);
  console.log(`Pad: public/demos/{slug}/assets/email-dashboard.png`);
  console.log(`Voortgang: ${PROGRESS_PATH}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
