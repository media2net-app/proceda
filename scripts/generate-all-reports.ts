/**
 * Generate all business reports one-by-one (top of rapportage list first).
 * Run: npx tsx scripts/generate-all-reports.ts
 */
import fs from "fs/promises";
import path from "path";
import { loadAllBusinesses } from "../src/lib/bedrijven/load-all-businesses";
import { generateBusinessReport } from "../src/lib/bedrijven/generate-business-report";

const PROGRESS_FILE = path.join(
  process.cwd(),
  "data",
  "business-reports",
  "_batch-progress.json",
);

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const all = await loadAllBusinesses();
  const queue = all
    .filter((b) => b.website?.trim())
    .sort((a, b) => a.name.localeCompare(b.name, "nl"));

  const startedAt = new Date().toISOString();
  const progress = {
    startedAt,
    total: queue.length,
    completed: 0,
    failed: 0,
    current: null as string | null,
    done: [] as string[],
    errors: {} as Record<string, string>,
  };

  console.log(`[batch] ${queue.length} businesses with website (A–Z)`);

  for (let i = 0; i < queue.length; i++) {
    const b = queue[i]!;
    progress.current = b.name;
    await fs.mkdir(path.dirname(PROGRESS_FILE), { recursive: true });
    await fs.writeFile(PROGRESS_FILE, JSON.stringify(progress, null, 2));

    const label = `[${i + 1}/${queue.length}]`;
    console.log(`${label} ${b.name} (${b.website})`);

    try {
      const report = await generateBusinessReport(b);
      progress.completed++;
      progress.done.push(b.id);
      console.log(
        `${label} OK — score ${report.overallScore} (${report.leadQuality}), screenshot ${report.screenshotPath ? "yes" : "no"}`,
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      progress.failed++;
      progress.errors[b.id] = msg;
      console.error(`${label} FAIL — ${msg}`);
    }

    progress.current = null;
    await fs.writeFile(PROGRESS_FILE, JSON.stringify(progress, null, 2));

    if (i < queue.length - 1) await sleep(1500);
  }

  progress.current = null;
  await fs.writeFile(PROGRESS_FILE, JSON.stringify(progress, null, 2));
  console.log(
    `[batch] Done. OK: ${progress.completed}, failed: ${progress.failed}`,
  );
}

main().catch((e) => {
  console.error("[batch] Fatal:", e);
  process.exit(1);
});
