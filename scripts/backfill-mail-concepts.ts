import { randomBytes } from "crypto";
import { config } from "dotenv";

config();
config({ path: ".env.local" });

/**
 * Zet voor elke outreach-verticale alle bedrijven met e-mail op mail-concept (draft).
 * Bestaande verstuurd/geboekt records blijven ongewijzigd.
 */
async function main() {
  const { OUTREACH_BRANCH_IDS } = await import(
    "../src/lib/bedrijven/outreach-branches"
  );
  const { loadAllBusinesses } = await import(
    "../src/lib/bedrijven/load-all-businesses"
  );
  const { normalizeEmail } = await import(
    "../src/lib/bedrijven/contact-utils"
  );
  const { prisma } = await import("../src/lib/db/prisma");

  const createToken = () => randomBytes(24).toString("base64url");

  const summary: {
    branchId: string;
    withEmail: number;
    created: number;
    draft: number;
    sent: number;
  }[] = [];

  for (const branchId of OUTREACH_BRANCH_IDS) {
    const businesses = await loadAllBusinesses(branchId);
    const withEmail = businesses
      .map((b) => ({ b, email: normalizeEmail(b.email) }))
      .filter((x): x is { b: (typeof businesses)[number]; email: string } =>
        Boolean(x.email),
      );

    const existing = await prisma.mailOutreach.findMany({
      where: { business: { branchId } },
      select: { businessId: true, status: true },
    });
    const existingIds = new Set(existing.map((r) => r.businessId));

    const missing = withEmail.filter((x) => !existingIds.has(x.b.id));
    let created = 0;
    for (const { b, email } of missing) {
      try {
        await prisma.mailOutreach.create({
          data: {
            businessId: b.id,
            token: createToken(),
            status: "draft",
            recipientEmail: email,
          },
        });
        created++;
      } catch {
        // race / duplicate
      }
    }

    const [withEmailDb, draft, sent] = await Promise.all([
      prisma.business.count({
        where: {
          branchId,
          email: { not: null },
          NOT: { email: "" },
        },
      }),
      prisma.mailOutreach.count({
        where: { business: { branchId }, status: "draft" },
      }),
      prisma.mailOutreach.count({
        where: {
          business: { branchId },
          status: { in: ["sent", "booked"] },
        },
      }),
    ]);

    summary.push({
      branchId,
      withEmail: withEmailDb,
      created,
      draft,
      sent,
    });
  }

  console.table(summary);
}

main()
  .catch(console.error)
  .finally(async () => {
    const { prisma } = await import("../src/lib/db/prisma");
    await prisma.$disconnect();
  });
