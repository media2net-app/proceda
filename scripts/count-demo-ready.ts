/**
 * Telt hoeveel makelaars met e-mail een demo kunnen krijgen (logo + huisstijlkleuren van website).
 * Gebruik: npx tsx scripts/count-demo-ready.ts [--limit=500] [--concurrency=20]
 */
import fs from "fs/promises";
import path from "path";
import { extractBrandFromHtml, pickBrandPalette } from "../src/lib/bedrijven/brand-extraction";
import { assessBrandFromHtml, canAttemptDemoProbe, isDemoBrandReady } from "../src/lib/bedrijven/demo-ready";
import { DEFAULT_BRANCH } from "../src/lib/bedrijven/branches";
import { hasAutoMailerContact } from "../src/lib/bedrijven/contact-utils";
import { loadAllBusinesses } from "../src/lib/bedrijven/load-all-businesses";
import type { Bedrijf } from "../src/lib/bedrijven/types";

const OUT_PATH = path.join(process.cwd(), "data", "demo-ready-audit.json");

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

async function probeOne(b: Bedrijf) {
  const website = b.website!.trim();
  const fetched = await fetchHtml(website);
  if (!fetched) {
    return {
      businessId: b.id,
      name: b.name,
      website,
      ok: false,
      demoReady: false,
      hasLogo: false,
      hasColors: false,
      error: "fetch_failed",
    };
  }

  const extracted = extractBrandFromHtml(fetched.html, fetched.url);
  const palette = pickBrandPalette(extracted.colors);
  const q = assessBrandFromHtml(fetched.html, fetched.url);
  const brandColors = [...new Set(extracted.colors)].slice(0, 8);

  return {
    businessId: b.id,
    name: b.name,
    website,
    ok: true,
    demoReady: isDemoBrandReady(q),
    hasLogo: q.hasLogo,
    hasColors: q.hasExtractedColors,
    colorCount: q.colorCount,
    primaryColor: palette.primaryColor,
    secondaryColor: palette.secondaryColor,
    accentColor: palette.accentColor,
    brandColors,
    logoUrl: extracted.logoUrl,
    error: null as string | null,
  };
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
      if ((i + 1) % 100 === 0) {
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

  const all = await loadAllBusinesses(DEFAULT_BRANCH);
  const withEmail = all.filter((b) => hasAutoMailerContact(b));
  const toProbe = withEmail
    .filter((b) => canAttemptDemoProbe(b))
    .slice(0, limit ?? withEmail.length);

  console.log(`Makelaars met e-mail: ${withEmail.length}`);
  console.log(`Te analyseren (website + e-mail): ${toProbe.length}`);

  const results = await runPool(toProbe, concurrency, probeOne);

  const demoReady = results.filter((r) => r.demoReady);
  const hasLogoOnly = results.filter((r) => r.hasLogo && !r.hasColors);
  const hasColorsOnly = results.filter((r) => !r.hasLogo && r.hasColors);
  const fetchFailed = results.filter((r) => !r.ok);

  const summary = {
    scannedAt: new Date().toISOString(),
    totalWithEmail: withEmail.length,
    probed: toProbe.length,
    demoReady: demoReady.length,
    demoReadyPct:
      toProbe.length > 0
        ? Math.round((demoReady.length / toProbe.length) * 1000) / 10
        : 0,
    projectedDemoReady:
      limit && toProbe.length < withEmail.length
        ? Math.round((demoReady.length / toProbe.length) * withEmail.length)
        : demoReady.length,
    hasLogoNotColors: hasLogoOnly.length,
    hasColorsNotLogo: hasColorsOnly.length,
    fetchFailed: fetchFailed.length,
    sampleReady: demoReady.slice(0, 15).map((r) => ({
      name: r.name,
      website: r.website,
      primaryColor: r.primaryColor,
    })),
  };

  await fs.mkdir(path.dirname(OUT_PATH), { recursive: true });
  await fs.writeFile(
    OUT_PATH,
    JSON.stringify({ summary, results }, null, 2),
    "utf-8",
  );

  console.log("\n--- Resultaat ---");
  console.log(`Demo-klaar (logo + ≥2 kleuren uit site): ${summary.demoReady} / ${summary.probed}`);
  if (limit) {
    console.log(`Geschat voor alle ${withEmail.length} e-mails: ~${summary.projectedDemoReady}`);
  }
  console.log(`Alleen logo, geen kleuren: ${summary.hasLogoNotColors}`);
  console.log(`Kleuren zonder logo: ${summary.hasColorsNotLogo}`);
  console.log(`Website niet bereikbaar: ${summary.fetchFailed}`);
  console.log(`Opgeslagen: ${OUT_PATH}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
