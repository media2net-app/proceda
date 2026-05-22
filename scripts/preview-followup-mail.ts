/**
 * Preview follow-up mail (HTML) voor één lead of de eerste kandidaat.
 *
 *   npx tsx scripts/preview-followup-mail.ts
 *   npx tsx scripts/preview-followup-mail.ts --slug=work-makelaardij
 */
import { config } from "dotenv";
import fs from "fs/promises";
import path from "path";

config();
config({ path: ".env.local" });

async function main() {
  const slugArg = process.argv.find((a) => a.startsWith("--slug="));
  const slug = slugArg?.split("=")[1];

  const { slugToBusinessId, businessIdToSlug } = await import(
    "../src/lib/bedrijven/slug"
  );
  const { listFollowupCandidates } = await import("../src/lib/mail/storage");
  const { resolveFollowupMailForBusiness } = await import(
    "../src/lib/mail/resolve-followup-mail"
  );

  let businessId: string;
  if (slug) {
    businessId = slugToBusinessId(slug);
  } else {
    const candidates = await listFollowupCandidates({ minDaysSinceSent: 0 });
    if (candidates.length === 0) {
      console.error("Geen follow-up kandidaten");
      process.exit(1);
    }
    businessId = candidates[0]!.businessId;
    console.log("Eerste kandidaat:", businessIdToSlug(businessId));
  }

  const resolved = await resolveFollowupMailForBusiness(
    businessId,
    "nl",
    undefined,
  );
  if (!resolved) {
    console.error("Kon follow-up niet opbouwen");
    process.exit(1);
  }

  const outDir = path.join(process.cwd(), "data");
  const htmlPath = path.join(outDir, "followup-mail-preview.html");
  const txtPath = path.join(outDir, "followup-mail-preview.txt");

  await fs.writeFile(htmlPath, resolved.htmlBody, "utf8");
  await fs.writeFile(
    txtPath,
    `Subject: ${resolved.subject}\n\n${resolved.plainBody}`,
    "utf8",
  );

  console.log("Subject:", resolved.subject);
  console.log("Demo URL:", resolved.demoUrl);
  console.log("Geschreven:", htmlPath, txtPath);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
