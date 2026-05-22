/**
 * Follow-up mail naar leads die de eerste outreach al ontvingen (status sent).
 * Zelfde demo-link (token). Geen follow-up bij geboekt of al follow-up verstuurd.
 *
 *   npx tsx scripts/send-batch-followup-outreach.ts --dry-run
 *   npx tsx scripts/send-batch-followup-outreach.ts --dry-run --min-days=3
 *   npx tsx scripts/send-batch-followup-outreach.ts --limit=50 --min-days=3 --delay-ms=3000
 */
import { config } from "dotenv";

config();
config({ path: ".env.local" });

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const limitArg = process.argv.find((a) => a.startsWith("--limit="));
  const delayArg = process.argv.find((a) => a.startsWith("--delay-ms="));
  const minDaysArg = process.argv.find((a) => a.startsWith("--min-days="));
  const limit = limitArg
    ? Math.max(1, Number.parseInt(limitArg.split("=")[1] ?? "100", 10))
    : 10_000;
  const delayMs = delayArg
    ? Math.max(500, Number.parseInt(delayArg.split("=")[1] ?? "3000", 10))
    : 3000;
  const minDaysSinceSent = minDaysArg
    ? Math.max(0, Number.parseInt(minDaysArg.split("=")[1] ?? "3", 10))
    : 3;

  const { isMailConfigured } = await import("../src/lib/mail/email-config");
  const { loadAllBusinesses } = await import("../src/lib/bedrijven/load-all-businesses");
  const { resolveFollowupMailForBusiness } = await import(
    "../src/lib/mail/resolve-followup-mail"
  );
  const { sendOutreachEmail } = await import("../src/lib/mail/smtp-client");
  const {
    assertMailFollowupEligible,
    listFollowupCandidates,
    markMailFollowupSent,
  } = await import("../src/lib/mail/storage");

  if (!isMailConfigured()) {
    console.error("MAIL_USER / MAIL_PASSWORD ontbreken");
    process.exit(1);
  }
  if (!process.env.DATABASE_URL?.trim()) {
    console.error("DATABASE_URL ontbreekt");
    process.exit(1);
  }

  const locale = "nl";
  const candidates = await listFollowupCandidates({ minDaysSinceSent });
  const businesses = await loadAllBusinesses();
  const nameById = new Map(businesses.map((b) => [b.id, b.name]));
  const emailById = new Map(businesses.map((b) => [b.id, b.email]));

  type Row = {
    businessId: string;
    businessName: string;
    email: string;
    sentAt: string;
  };

  const rows: Row[] = [];
  const seenEmails = new Set<string>();

  for (const rec of candidates) {
    const email = (rec.recipientEmail ?? emailById.get(rec.businessId) ?? "")
      .trim()
      .toLowerCase();
    if (!email) continue;
    if (seenEmails.has(email)) continue;
    seenEmails.add(email);
    rows.push({
      businessId: rec.businessId,
      businessName: nameById.get(rec.businessId) ?? rec.businessId,
      email,
      sentAt: rec.sentAt ?? "",
    });
    if (rows.length >= limit) break;
  }

  rows.sort((a, b) => a.businessName.localeCompare(b.businessName, "nl"));

  console.log(`Follow-up kandidaten (sent ≥ ${minDaysSinceSent} dagen geleden): ${candidates.length}`);
  console.log(`Te versturen (max ${limit}, uniek e-mail): ${rows.length}`);

  if (rows.length === 0) {
    console.log("Geen follow-up klaar. Wacht tot min-days verstreken is of alles is al follow-up.");
    return;
  }

  console.log("\nEerste 15 in batch:");
  for (const r of rows.slice(0, 15)) {
    console.log(`  · ${r.businessName} <${r.email}> (1e mail: ${r.sentAt.slice(0, 10)})`);
  }
  if (rows.length > 15) console.log(`  … en ${rows.length - 15} meer`);

  if (dryRun) {
    console.log("\n--dry-run: geen follow-up mails verstuurd.");
    return;
  }

  console.log(`\nVersturen (${delayMs}ms pauze)…\n`);

  let ok = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < rows.length; i++) {
    const item = rows[i]!;
    const label = `[${i + 1}/${rows.length}] ${item.businessName}`;

    try {
      await assertMailFollowupEligible(item.businessId);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (
        msg === "FOLLOWUP_ALREADY_SENT" ||
        msg === "ALREADY_BOOKED" ||
        msg === "FOLLOWUP_REQUIRES_SENT"
      ) {
        console.log(`${label} — overgeslagen (${msg})`);
        skipped++;
        continue;
      }
      throw e;
    }

    const resolved = await resolveFollowupMailForBusiness(
      item.businessId,
      locale,
      undefined,
      item.email,
      item.businessName,
    );
    if (!resolved) {
      console.log(`${label} — mislukt (geen follow-up mail)`);
      failed++;
      continue;
    }

    try {
      const sent = await sendOutreachEmail({
        to: item.email,
        subject: resolved.subject,
        text: resolved.plainBody,
        html: resolved.htmlBody,
        attachments: resolved.attachments,
      });
      await markMailFollowupSent(item.businessId);
      console.log(`${label} — ✓ ${item.email} (${sent.messageId})`);
      ok++;
    } catch (e) {
      console.log(
        `${label} — ✗ ${e instanceof Error ? e.message : String(e)}`,
      );
      failed++;
    }

    if (i < rows.length - 1) await sleep(delayMs);
  }

  console.log(`\nKlaar: ${ok} follow-up verstuurd, ${skipped} overgeslagen, ${failed} mislukt.`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
