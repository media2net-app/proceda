/**
 * Vult secondary/accent/brandColors in bestaande demo-ready-audit.json (zonder volledige re-scan).
 * Gebruik: npx tsx scripts/enrich-demo-ready-palette.ts [--filter=demoReady|hasColors|allOk]
 */
import fs from "fs/promises";
import path from "path";
import { extractBrandFromHtml, pickBrandPalette } from "../src/lib/bedrijven/brand-extraction";
import {
  getDemoReadyAuditPath,
  type DemoReadyAuditFile,
  type DemoReadyAuditRow,
} from "../src/lib/bedrijven/demo-ready-audit";

async function fetchHtml(website: string): Promise<{ html: string; url: string } | null> {
  let url = website.trim();
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(18_000),
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; ProcedaBot/1.0; +https://proceda.nl)",
        Accept: "text/html",
      },
    });
    if (!res.ok) return null;
    const html = await res.text();
    if (html.length < 200) return null;
    return { html, url: res.url };
  } catch {
    return null;
  }
}

async function runPool<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;

  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]!, i);
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

async function enrichRow(row: DemoReadyAuditRow): Promise<DemoReadyAuditRow> {
  const fetched = await fetchHtml(row.website);
  if (!fetched) return row;

  const extracted = extractBrandFromHtml(fetched.html, fetched.url);
  const palette = pickBrandPalette(extracted.colors);
  const brandColors = [...new Set(extracted.colors)].slice(0, 8);

  return {
    ...row,
    primaryColor: palette.primaryColor,
    secondaryColor: palette.secondaryColor,
    accentColor: palette.accentColor,
    brandColors,
    logoUrl: extracted.logoUrl ?? row.logoUrl,
  };
}

async function main() {
  const filterArg =
    process.argv.find((a) => a.startsWith("--filter="))?.split("=")[1] ??
    "demoReady";
  const concArg = process.argv.find((a) => a.startsWith("--concurrency="));
  const concurrency = concArg ? parseInt(concArg.split("=")[1]!, 10) : 30;

  const auditPath = getDemoReadyAuditPath();
  const raw = await fs.readFile(auditPath, "utf-8");
  const audit = JSON.parse(raw) as DemoReadyAuditFile;

  let targets = audit.results.filter((r) => r.ok);
  if (filterArg === "demoReady") {
    targets = targets.filter((r) => r.demoReady);
  } else if (filterArg === "hasColors") {
    targets = targets.filter((r) => r.hasColors);
  }

  console.log(`Verrijken: ${targets.length} records (filter=${filterArg})`);

  const enriched = await runPool(targets, concurrency, enrichRow);
  const byId = new Map(enriched.map((r) => [r.businessId, r]));

  audit.results = audit.results.map((r) => byId.get(r.businessId) ?? r);
  audit.summary = {
    ...audit.summary,
    paletteEnrichedAt: new Date().toISOString(),
  } as DemoReadyAuditFile["summary"] & { paletteEnrichedAt?: string };

  await fs.writeFile(auditPath, JSON.stringify(audit, null, 2), "utf-8");
  console.log(`Opgeslagen: ${auditPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
