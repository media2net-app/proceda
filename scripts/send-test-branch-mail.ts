/**
 * Verstuur één test-outreach voor een verticale naar een opgegeven adres.
 *
 *   npx tsx scripts/send-test-branch-mail.ts --branch=verzekering --to=info@media2net.nl
 */
import { config } from "dotenv";

config();
config({ path: ".env.local" });

import type { ScrapeBranchId } from "../src/lib/bedrijven/branches";
import { buildBranchMailSubject, buildBranchProposalDraft } from "../src/lib/mail/branch-outreach-copy";
import { buildMinimalReportForMail } from "../src/lib/mail/demo-outreach-draft";
import { isMailConfigured } from "../src/lib/mail/email-config";
import { defaultOutreachSubcategory } from "../src/lib/mail/outreach-draft";
import { resolveAppBaseUrl } from "../src/lib/mail/app-url";
import { buildDemoBookingUrl, buildMailHtml } from "../src/lib/mail/templates";
import { sendOutreachEmail } from "../src/lib/mail/smtp-client";

const SAMPLE_TOKEN = "00000000-0000-4000-8000-000000000001";

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? decodeURIComponent(hit.split("=").slice(1).join("=")).trim() : undefined;
}

async function main() {
  const branchId = (arg("branch") ?? "verzekering") as ScrapeBranchId;
  const to = arg("to") ?? "info@media2net.nl";
  const businessName = arg("name") ?? "Voorbeeld Verzekeringsadvies BV";
  const locale = arg("locale") ?? "nl";

  if (!isMailConfigured()) {
    console.error("MAIL_USER / MAIL_PASSWORD ontbreken in .env of .env.local");
    process.exit(1);
  }

  const business = {
    id: `test-${branchId}-send`,
    name: businessName,
    website: "https://voorbeeld.nl",
    address: "Teststraat 1",
    city: "Amsterdam",
    province: "Noord-Holland",
    category: "services" as const,
    subcategory: defaultOutreachSubcategory(branchId),
    placeId: `test-${branchId}-send`,
    source: "google" as const,
    branchId,
    email: to,
  };

  const draft = buildBranchProposalDraft(branchId, businessName);
  const baseUrl = resolveAppBaseUrl();
  const demoUrl = buildDemoBookingUrl(baseUrl, locale, SAMPLE_TOKEN);
  const report = buildMinimalReportForMail({
    business,
    proposalEmailDraft: draft,
    demoAppUrl: `/${locale}/demo/${SAMPLE_TOKEN}`,
    branchId,
  });
  const subject = buildBranchMailSubject(branchId, businessName);
  const { plainBody, htmlBody } = buildMailHtml({
    business,
    report,
    demoUrl,
    locale,
    baseUrl,
    dashboardScreenshotUrl: null,
  });

  console.log("Versturen test-outreach…");
  console.log(`  Branch:    ${branchId}`);
  console.log(`  Naar:      ${to}`);
  console.log(`  Bedrijf:   ${businessName}`);
  console.log(`  Onderwerp: ${subject}`);

  const sent = await sendOutreachEmail({
    to,
    subject,
    text: plainBody,
    html: htmlBody,
  });

  console.log(`\n✓ Verzonden (messageId: ${sent.messageId})`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
