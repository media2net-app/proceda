/**
 * Vult e-mailadressen aan via website (homepage, footer, /contact).
 *
 *   BRANCH=installatie npx tsx scripts/enrich-branch-emails.ts
 *   BRANCH=installatie npx tsx scripts/enrich-branch-emails.ts --browser
 *   BRANCH=installatie npx tsx scripts/enrich-branch-emails.ts --dry-run --limit=10
 *   BRANCH=installatie npx tsx scripts/enrich-branch-emails.ts --guess-only
 */
import fs from "fs/promises";
import path from "path";
import { resolveBranchId, type ScrapeBranchId } from "../src/lib/bedrijven/branches";
import { getCampaignDir, ensureCampaignDir } from "../src/lib/bedrijven/campaign-paths";
import { enrichBranchEmailsFromWebsites } from "../src/lib/bedrijven/enrich-emails-from-websites";

const BRANCH: ScrapeBranchId = resolveBranchId(
  process.env.BRANCH?.trim() ?? "installatie",
);

function argFlag(name: string): boolean {
  return process.argv.includes(name);
}

function argValue(name: string): number | undefined {
  const a = process.argv.find((x) => x.startsWith(`${name}=`));
  if (!a) return undefined;
  const n = parseInt(a.split("=")[1]!, 10);
  return Number.isFinite(n) ? n : undefined;
}

async function main() {
  const useBrowser = argFlag("--browser");
  const guessOnly = argFlag("--guess-only");
  const dryRun = argFlag("--dry-run");
  const limit = argValue("--limit");
  const concurrency =
    argValue("--concurrency") ?? (guessOnly ? 20 : useBrowser ? 3 : 10);

  console.log(
    `E-mail enrich · branch=${BRANCH} · browser=${useBrowser} · guessOnly=${guessOnly} · dryRun=${dryRun}`,
  );

  const summary = await enrichBranchEmailsFromWebsites(BRANCH, {
    limit,
    concurrency,
    useBrowser: guessOnly ? false : useBrowser,
    guessOnly,
    dryRun,
    onProgress: (done, total, name) => {
      process.stdout.write(`\r  ${done}/${total} ${name.slice(0, 40).padEnd(40)}`);
    },
  });

  console.log("\n");
  console.log("--- Resultaat ---");
  console.log(`Totaal bedrijven:     ${summary.total}`);
  console.log(`Met website:          ${summary.withWebsite}`);
  console.log(`Had al e-mail:        ${summary.alreadyHadEmail}`);
  console.log(`Geprobeerd:           ${summary.attempted}`);
  console.log(`Nieuw e-mail:         ${summary.found}`);
  console.log(`Nog niet gevonden:    ${summary.failed}`);

  const found = summary.results.filter(
    (r) => r.email && r.source !== "skipped",
  );
  if (found.length > 0) {
    console.log("\nNieuw gevonden:");
    for (const r of found.slice(0, 30)) {
      console.log(`  ${r.name} → ${r.email} (${r.source})`);
    }
    if (found.length > 30) {
      console.log(`  … en ${found.length - 30} meer`);
    }
  }

  await ensureCampaignDir(BRANCH);
  const outPath = path.join(
    getCampaignDir(BRANCH),
    "email-enrich-log.json",
  );
  await fs.writeFile(outPath, JSON.stringify(summary, null, 2), "utf-8");
  console.log(`\nLog: ${outPath}`);

  const newTotal = summary.alreadyHadEmail + (dryRun ? 0 : summary.found);
  console.log(`E-mail totaal (indicatie): ${newTotal} / ${summary.total}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
