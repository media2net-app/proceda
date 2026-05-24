import { config } from "dotenv";

config();
config({ path: ".env.local" });

async function main() {
  const { prisma } = await import("../src/lib/db/prisma");
  const { getMailConfig } = await import("../src/lib/mail/email-config");
  const { normalizeEmail, isLikelyGuessedEmail } = await import(
    "../src/lib/bedrijven/contact-utils"
  );

  const cfg = getMailConfig();
  console.log("From:", cfg?.from, "| SMTP:", cfg?.smtp.host);

  function isSuspiciousEmail(email: string): string | null {
    const e = email.toLowerCase();
    if (/%20|contactgegevens|facebook|\.js$|\.css$|\.png$|\.svg$/i.test(e))
      return "encoded_or_junk";
    const local = e.split("@")[0] ?? "";
    if (/^\d{3,}/.test(local)) return "phone_prefix";
    if (/^\d/.test(local) && local.length > 12) return "digits_glued";
    if (local.length > 40) return "local_too_long";
    if (!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(e)) return "invalid_format";
    if (/^(info|contact|mail)@[a-z0-9.-]+\.(nlhome|nlteam|nlfax)/.test(e))
      return "domain_suffix_glued";
    return null;
  }

  const bounceCount = await prisma.mailBounce.count();
  console.log("\nBounces in DB:", bounceCount);
  const bounces = await prisma.mailBounce.findMany({
    orderBy: { createdAt: "desc" },
    take: 15,
  });
  for (const b of bounces) {
    const flag = isSuspiciousEmail(b.email);
    console.log(" -", b.email, flag ? `[${flag}]` : "", "|", (b.reason ?? "").slice(0, 50));
  }

  const sent = await prisma.mailOutreach.findMany({
    where: { status: { in: ["sent", "booked"] } },
    select: { recipientEmail: true, business: { select: { website: true } } },
  });
  let ok = 0,
    guessed = 0,
    suspicious = 0,
    invalid = 0;
  const suspiciousSamples: string[] = [];
  for (const r of sent) {
    const email = r.recipientEmail ?? "";
    const norm = normalizeEmail(email);
    if (!norm) {
      invalid++;
      continue;
    }
    const flag = isSuspiciousEmail(norm);
    if (flag) {
      suspicious++;
      if (suspiciousSamples.length < 8) suspiciousSamples.push(`${norm} (${flag})`);
      continue;
    }
    if (isLikelyGuessedEmail(norm, r.business?.website)) {
      guessed++;
      continue;
    }
    ok++;
  }
  console.log("\n702 sent analysis:");
  console.log("  Plausible:", ok);
  console.log("  Suspicious (scrape junk):", suspicious, suspiciousSamples);
  console.log("  Guessed info@:", guessed);
  console.log("  Invalid after normalize:", invalid);

  const [draft, suppressed] = await Promise.all([
    prisma.mailOutreach.count({ where: { status: "draft" } }),
    prisma.mailOutreach.count({ where: { doNotMail: true } }),
  ]);
  console.log("\nDrafts:", draft, "| Suppressed:", suppressed);
}

main()
  .catch(console.error)
  .finally(async () => {
    const { prisma } = await import("../src/lib/db/prisma");
    await prisma.$disconnect();
  });
