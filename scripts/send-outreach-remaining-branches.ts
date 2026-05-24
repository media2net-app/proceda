/**
 * Verstuur outreach per verticale (excl. makelaardij): standaard 200 per branch.
 *
 *   npx tsx scripts/send-outreach-remaining-branches.ts --dry-run
 *   npx tsx scripts/send-outreach-remaining-branches.ts --limit=200 --delay-ms=3000
 *   npx tsx scripts/send-outreach-remaining-branches.ts --branch=installatie --limit=50
 */
import { config } from "dotenv";

config();
config({ path: ".env.local" });

const REMAINING_BRANCHES = [
  "installatie",
  "vastgoedbeheer",
  "accountants",
  "recruitment",
  "verzekering",
] as const;

function argFlag(name: string): boolean {
  return process.argv.includes(name);
}

function argValue(name: string, fallback: number): number {
  const hit = process.argv.find((a) => a.startsWith(`${name}=`));
  if (!hit) return fallback;
  const n = Number.parseInt(hit.split("=")[1] ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function argBranch(): string | undefined {
  const hit = process.argv.find((a) => a.startsWith("--branch="));
  return hit ? hit.split("=")[1]?.trim() : undefined;
}

async function main() {
  const dryRun = argFlag("--dry-run");
  const limit = Math.min(argValue("--limit", 200), 200);
  const delayMs = argValue("--delay-ms", 3000);
  const maxPerDomain = argValue("--max-per-domain", 2);
  const onlyBranch = argBranch();

  const { isMailConfigured } = await import("../src/lib/mail/email-config");
  const { runBatchOutreachSend } = await import(
    "../src/lib/mail/batch-send-outreach"
  );
  const { getMailHealthReport } = await import("../src/lib/mail/mail-health");

  if (!dryRun && !isMailConfigured()) {
    console.error("MAIL_USER / MAIL_PASSWORD ontbreken");
    process.exit(1);
  }

  const branches = onlyBranch
    ? REMAINING_BRANCHES.filter((b) => b === onlyBranch)
    : [...REMAINING_BRANCHES];

  if (onlyBranch && branches.length === 0) {
    console.error(
      `Ongeldige branch "${onlyBranch}". Kies: ${REMAINING_BRANCHES.join(", ")}`,
    );
    process.exit(1);
  }

  const health = await getMailHealthReport("all");
  console.log("Daglimiet:", health.dailyCap, "| vandaag verstuurd:", health.sentToday);
  console.log(
    "Nog te versturen vandaag (max):",
    health.capRemaining,
    dryRun ? "(dry-run)" : "",
  );
  console.log(
    "Plan:",
    branches.map((b) => `${b} × ${limit}`).join(" → "),
    `= max ${branches.length * limit} mails\n`,
  );

  if (!dryRun && health.capRemaining < branches.length * limit) {
    console.warn(
      "⚠ Daglimiet dekt deze run niet volledig — verlaag --limit of verhoog OUTREACH_DAILY_SEND_CAP.",
    );
  }

  const totals = { sent: 0, skipped: 0, failed: 0 };

  for (const branchId of branches) {
    console.log(`\n=== ${branchId} (${limit} max, ${delayMs}ms delay) ===`);

    const result = await runBatchOutreachSend({
      branchId,
      locale: "nl",
      limit,
      delayMs,
      maxPerDomain,
      dryRun,
      abTest: true,
    });

    console.log(
      `  queued=${result.queued} sent=${result.sent} skipped=${result.skipped} failed=${result.failed}`,
    );
    totals.sent += result.sent;
    totals.skipped += result.skipped;
    totals.failed += result.failed;

    if (!dryRun && result.failed > 0) {
      for (const item of result.items.filter((i) => i.status === "failed")) {
        console.log(`  ✗ ${item.businessName}: ${item.reason ?? "failed"}`);
      }
    }
  }

  console.log(
    `\nTotaal: ${totals.sent} verstuurd, ${totals.skipped} overgeslagen, ${totals.failed} mislukt`,
  );
  if (dryRun) console.log("(dry-run — geen mails verstuurd)");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
