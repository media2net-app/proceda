/**
 * Genereert dashboard-demos (logo + huisstijl) voor alle demo-klaare makelaars uit de audit.
 * Geen deep scrape / woningaanbod — alleen brand + logo voor /demos/{slug}/app
 *
 * Run: npx tsx scripts/generate-demo-dashboard-batch.ts [--limit=50] [--concurrency=25]
 */
import fs from "fs/promises";
import path from "path";
import { businessIdToDemoSlug } from "../src/lib/bedrijven/demo-slug";
import { patchReportDemoUrls } from "../src/lib/bedrijven/patch-demo-urls";
import {
  getDemoReadyAuditPath,
  loadDemoReadyAudit,
  type DemoReadyAuditRow,
} from "../src/lib/bedrijven/demo-ready-audit";
import type { DemoBrandsFile, DemoBrandEntry } from "../src/lib/demo-homepage/demo-brand-registry";
import { clearDemoBrandRegistryCache } from "../src/lib/demo-homepage/demo-brand-registry";

const OUT_PATH = path.join(process.cwd(), "data", "demo-brands.json");
const SHARED_LISTINGS_SRC = path.join(
  process.cwd(),
  "public",
  "demos",
  "schenkel-makelaardij",
  "assets",
  "listings",
);
const SHARED_LISTINGS_DEST = path.join(
  process.cwd(),
  "public",
  "demos",
  "_shared",
  "listings",
);

async function ensureSharedListingThumbs(): Promise<void> {
  await fs.mkdir(SHARED_LISTINGS_DEST, { recursive: true });
  for (let i = 0; i < 6; i++) {
    const src = path.join(SHARED_LISTINGS_SRC, `${i}.webp`);
    const dest = path.join(SHARED_LISTINGS_DEST, `${i}.webp`);
    try {
      await fs.copyFile(src, dest);
    } catch {
      console.warn(`Waarschuwing: geen shared thumb ${i}.webp`);
    }
  }
}

function extFromUrl(url: string, contentType: string | null): string {
  const lower = url.toLowerCase();
  if (contentType?.includes("svg") || lower.endsWith(".svg")) return "svg";
  if (contentType?.includes("webp") || lower.endsWith(".webp")) return "webp";
  if (contentType?.includes("jpeg") || lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
    return "jpg";
  }
  if (contentType?.includes("png") || lower.endsWith(".png")) return "png";
  return "png";
}

async function downloadLogo(
  logoUrl: string,
  demoSlug: string,
  assetsDir: string,
): Promise<{ logoPath: string; ok: boolean }> {
  try {
    const res = await fetch(logoUrl, {
      signal: AbortSignal.timeout(20_000),
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; ProcedaBot/1.0; +https://proceda.nl)",
        Accept: "image/*,*/*",
      },
    });
    if (!res.ok) return { logoPath: "", ok: false };
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 80) return { logoPath: "", ok: false };
    const ext = extFromUrl(logoUrl, res.headers.get("content-type"));
    const filename = `logo.${ext}`;
    await fs.writeFile(path.join(assetsDir, filename), buf);
    return { logoPath: `/demos/${demoSlug}/assets/${filename}`, ok: true };
  } catch {
    return { logoPath: "", ok: false };
  }
}

async function processRow(row: DemoReadyAuditRow): Promise<{
  entry: DemoBrandEntry;
  reportPatched: boolean;
}> {
  const demoSlug = businessIdToDemoSlug(row.businessId);
  const assetsDir = path.join(process.cwd(), "public", "demos", demoSlug, "assets");
  await fs.mkdir(assetsDir, { recursive: true });

  let logoPath = `/demos/${demoSlug}/assets/logo.png`;
  let logoOk = false;

  if (row.logoUrl) {
    const dl = await downloadLogo(row.logoUrl, demoSlug, assetsDir);
    if (dl.ok && dl.logoPath) {
      logoPath = dl.logoPath;
      logoOk = true;
    }
  }

  const entry: DemoBrandEntry = {
    businessId: row.businessId,
    demoSlug,
    businessName: row.name,
    website: row.website,
    primaryColor: row.primaryColor ?? "#1e3a5f",
    secondaryColor: row.secondaryColor ?? "#2d5a87",
    accentColor: row.accentColor ?? "#c9a227",
    textColor: "#1F2937",
    logoPath: logoOk ? logoPath : row.logoUrl ? logoPath : `/demos/${demoSlug}/assets/logo.png`,
    logoOk,
  };

  const reportPatched = await patchReportDemoUrls(row.businessId);

  return { entry, reportPatched };
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
      if ((i + 1) % 50 === 0) {
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
  const limitArg = process.argv.find((a) => a.startsWith("--limit="));
  const limit = limitArg ? parseInt(limitArg.split("=")[1]!, 10) : undefined;
  const concArg = process.argv.find((a) => a.startsWith("--concurrency="));
  const concurrency = concArg ? parseInt(concArg.split("=")[1]!, 10) : 25;

  const audit = await loadDemoReadyAudit();
  if (!audit) {
    console.error(`Geen audit: ${getDemoReadyAuditPath()}`);
    process.exit(1);
  }

  await ensureSharedListingThumbs();

  let targets = audit.results.filter((r) => r.demoReady);
  if (limit) targets = targets.slice(0, limit);

  console.log(`Demo-klaar: ${audit.summary.demoReady}, te genereren: ${targets.length}`);

  const results = await runPool(targets, concurrency, processRow);

  const brands: Record<string, DemoBrandEntry> = {};
  let logoOkCount = 0;
  let reportsPatched = 0;

  for (const r of results) {
    brands[r.entry.demoSlug] = r.entry;
    if (r.entry.logoOk) logoOkCount++;
    if (r.reportPatched) reportsPatched++;
  }

  const existing = await fs.readFile(OUT_PATH, "utf-8").catch(() => null);
  let merged = brands;
  if (existing) {
    try {
      const prev = JSON.parse(existing) as DemoBrandsFile;
      merged = { ...prev.brands, ...brands };
    } catch {
      /* fresh write */
    }
  }

  const out: DemoBrandsFile = {
    generatedAt: new Date().toISOString(),
    demoReadyCount: Object.keys(merged).length,
    logoOkCount,
    brands: merged,
  };

  await fs.mkdir(path.dirname(OUT_PATH), { recursive: true });
  await fs.writeFile(OUT_PATH, JSON.stringify(out, null, 2), "utf-8");
  clearDemoBrandRegistryCache();

  console.log("\n--- Klaar ---");
  console.log(`Brands in registry: ${Object.keys(merged).length}`);
  console.log(`Logo gedownload: ${logoOkCount}/${targets.length}`);
  console.log(`Rapporten bijgewerkt met demo-URL: ${reportsPatched}`);
  console.log(`Voorbeeld: http://localhost:3000/nl/demos/${targets[0] ? businessIdToDemoSlug(targets[0]!.businessId) : "…"}/app`);
  console.log(`Opgeslagen: ${OUT_PATH}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
