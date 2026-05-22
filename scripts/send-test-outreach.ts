/**
 * Verstuur één test-outreach (demo-booking link) naar een vast testadres.
 *
 *   npx tsx scripts/send-test-outreach.ts
 *   npx tsx scripts/send-test-outreach.ts --slug=schenkel-makelaardij
 */
import { config } from "dotenv";

config();
config({ path: ".env.local" });

const TEST_EMAIL = "info@media2net.nl";
const TEST_COMPANY = "Test company";
/** Demo-ready makelaar (@Work) — slug = encodeURIComponent(businessId) */
const DEFAULT_BUSINESS_ID = "google/ChIJIVntJGwzxEcRum-EcjnY9p4";

async function main() {
  const { businessIdToSlug, slugToBusinessId } = await import(
    "../src/lib/bedrijven/slug"
  );
  const { isMailConfigured } = await import("../src/lib/mail/email-config");
  const { resolveOutreachMailForBusiness } = await import(
    "../src/lib/mail/resolve-outreach-mail"
  );
  const { sendOutreachEmail } = await import("../src/lib/mail/smtp-client");
  const { markMailSent } = await import("../src/lib/mail/storage");

  if (!isMailConfigured()) {
    console.error("MAIL_USER / MAIL_PASSWORD ontbreken in .env of .env.local");
    process.exit(1);
  }

  if (!process.env.DATABASE_URL?.trim()) {
    console.error("DATABASE_URL ontbreekt in .env");
    process.exit(1);
  }

  const slugArg = process.argv.find((a) => a.startsWith("--slug="));
  const idArg = process.argv.find((a) => a.startsWith("--business-id="));
  const businessId = idArg
    ? decodeURIComponent(idArg.split("=")[1]?.trim() ?? "")
    : slugArg
      ? slugToBusinessId(slugArg.split("=")[1]?.trim() ?? "")
      : DEFAULT_BUSINESS_ID;
  const slug = businessIdToSlug(businessId);

  const resolved = await resolveOutreachMailForBusiness(
    businessId,
    "nl",
    undefined,
    TEST_EMAIL,
    TEST_COMPANY,
  );

  if (!resolved) {
    console.error(
      `Geen demo-ready mail voor ${slug}. Kies een demo-ready makelaar (--business-id=...).`,
    );
    process.exit(1);
  }

  const { subject, plainBody, htmlBody, demoUrl } = resolved;

  console.log("Versturen test-outreach…");
  console.log(`  Naar:      ${TEST_EMAIL}`);
  console.log(`  Bedrijf:   ${TEST_COMPANY}`);
  console.log(`  Slug:      ${slug} (${businessIdToSlug(businessId)})`);
  console.log(`  Onderwerp: ${subject}`);
  console.log(`  Booking:   ${demoUrl}`);

  const sent = await sendOutreachEmail({
    to: TEST_EMAIL,
    subject,
    text: plainBody,
    html: htmlBody,
  });

  await markMailSent(businessId, TEST_EMAIL);

  console.log(`\n✓ Verzonden (messageId: ${sent.messageId})`);
  console.log("Open de booking-URL in de mail om afspraak-flow te testen.");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
