/**
 * Verstuur outreach-mail naar de eerste N concept-leads (status draft).
 *
 *   npx tsx scripts/send-batch-outreach.ts --dry-run
 *   npx tsx scripts/send-batch-outreach.ts --limit=10
 *   npx tsx scripts/send-batch-outreach.ts --limit=10 --delay-ms=3000
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
  const limit = limitArg ? Math.max(1, Number.parseInt(limitArg.split("=")[1] ?? "10", 10)) : 10;
  const delayMs = delayArg
    ? Math.max(500, Number.parseInt(delayArg.split("=")[1] ?? "2000", 10))
    : 2500;

  const { isMailConfigured } = await import("../src/lib/mail/email-config");
  const { listDemoOutreachTemplates } = await import(
    "../src/lib/mail/list-demo-outreach"
  );
  const { resolveOutreachMailForBusiness } = await import(
    "../src/lib/mail/resolve-outreach-mail"
  );
  const { sendOutreachEmail } = await import("../src/lib/mail/smtp-client");
  const {
    assertMailOutreachDraft,
    markMailSent,
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
  const all = await listDemoOutreachTemplates(locale);
  const drafts = all
    .filter((t) => t.status === "draft" && t.email?.trim())
    .sort((a, b) => a.businessName.localeCompare(b.businessName, "nl"));

  const seenEmails = new Set<string>();
  const batch: typeof drafts = [];
  for (const item of drafts) {
    const key = item.email!.trim().toLowerCase();
    if (seenEmails.has(key)) continue;
    seenEmails.add(key);
    batch.push(item);
    if (batch.length >= limit) break;
  }

  console.log(`Concept (draft) in lijst: ${drafts.length}`);
  console.log(`Te versturen (max ${limit}): ${batch.length}`);
  if (batch.length === 0) {
    console.log("Geen concept-leads om te versturen.");
    return;
  }

  console.log("\nVolgorde (alfabetisch, alleen draft):");
  for (const item of batch) {
    console.log(`  · ${item.businessName} <${item.email}>`);
  }

  if (dryRun) {
    console.log("\n--dry-run: geen mails verstuurd.");
    return;
  }

  console.log(`\nVersturen (${delayMs}ms pauze tussen mails)…\n`);

  let ok = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < batch.length; i++) {
    const item = batch[i]!;
    const label = `[${i + 1}/${batch.length}] ${item.businessName}`;

    try {
      await assertMailOutreachDraft(item.businessId);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (msg === "ALREADY_SENT") {
        console.log(`${label} — overgeslagen (al verstuurd)`);
        skipped++;
        continue;
      }
      throw e;
    }

    const resolved = await resolveOutreachMailForBusiness(
      item.businessId,
      locale,
      undefined,
      item.email,
      item.businessName,
    );
    if (!resolved) {
      console.log(`${label} — mislukt (geen demo-ready mail)`);
      failed++;
      continue;
    }

    try {
      const sent = await sendOutreachEmail({
        to: item.email!,
        subject: resolved.subject,
        text: resolved.plainBody,
        html: resolved.htmlBody,
        attachments: resolved.attachments,
      });
      await markMailSent(item.businessId, item.email!);
      console.log(`${label} — ✓ ${item.email} (${sent.messageId})`);
      ok++;
    } catch (e) {
      console.log(
        `${label} — ✗ ${e instanceof Error ? e.message : String(e)}`,
      );
      failed++;
    }

    if (i < batch.length - 1) await sleep(delayMs);
  }

  console.log(`\nKlaar: ${ok} verstuurd, ${skipped} overgeslagen, ${failed} mislukt.`);
  console.log(
    "In admin → Mail: filter Concept = leeg voor deze leads; filter Verstuurd = zichtbaar.",
  );
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
