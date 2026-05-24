import { config } from "dotenv";

config();
config({ path: ".env.local" });

async function main() {
  const { prisma } = await import("../src/lib/db/prisma");
  const { OUTREACH_BRANCH_IDS } = await import(
    "../src/lib/bedrijven/outreach-branches"
  );
  const { isLikelyGuessedEmail, normalizeEmail } = await import(
    "../src/lib/bedrijven/contact-utils"
  );

  console.log("MAIL_USER set:", !!process.env.MAIL_USER);
  console.log(
    "OUTREACH_DAILY_SEND_CAP:",
    process.env.OUTREACH_DAILY_SEND_CAP ?? "(not set → default 1000)",
  );

  const draftRows = await prisma.mailOutreach.findMany({
    where: { status: "draft" },
    select: {
      token: true,
      recipientEmail: true,
      doNotMail: true,
      business: { select: { email: true, website: true, branchId: true } },
    },
  });

  let sendReady = 0;
  let guessed = 0;
  let noEmail = 0;
  let suppressed = 0;
  let noToken = 0;
  const byBranch = Object.fromEntries(
    OUTREACH_BRANCH_IDS.map((b) => [b, { draft: 0, ready: 0 }]),
  );

  for (const r of draftRows) {
    const branch = r.business.branchId ?? "?";
    if (byBranch[branch]) byBranch[branch].draft++;
    if (r.doNotMail) {
      suppressed++;
      continue;
    }
    const email = normalizeEmail(
      r.recipientEmail ?? r.business.email ?? undefined,
    );
    if (!email) {
      noEmail++;
      continue;
    }
    if (!r.token) {
      noToken++;
      continue;
    }
    if (isLikelyGuessedEmail(email, r.business.website ?? undefined)) {
      guessed++;
      continue;
    }
    sendReady++;
    if (byBranch[branch]) byBranch[branch].ready++;
  }

  const [sent, bounces, suppressTotal] = await Promise.all([
    prisma.mailOutreach.count({
      where: { status: { in: ["sent", "booked"] } },
    }),
    prisma.mailBounce.count(),
    prisma.mailOutreach.count({ where: { doNotMail: true } }),
  ]);

  console.log("\nDraft records:", draftRows.length);
  console.log("Send-ready (verified e-mail + token):", sendReady);
  console.log("Blocked (geraden info@):", guessed);
  console.log("No e-mail:", noEmail, "| no token:", noToken);
  console.log("Suppressed in draft pool:", suppressed);
  console.log("Already sent:", sent, "| bounces:", bounces, "| suppress total:", suppressTotal);

  console.log("\nPer branch (draft | send-ready):");
  for (const b of OUTREACH_BRANCH_IDS) {
    const x = byBranch[b];
    if (x) console.log(`  ${b}: ${x.draft} | ${x.ready}`);
  }

  console.log("\nCode limits:");
  console.log("  Batch API max per call: 200");
  console.log("  Daily cap (env):", process.env.OUTREACH_DAILY_SEND_CAP ?? "1000");
}

main()
  .catch(console.error)
  .finally(async () => {
    const { prisma } = await import("../src/lib/db/prisma");
    await prisma.$disconnect();
  });
