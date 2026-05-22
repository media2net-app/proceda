import { config } from "dotenv";

config();
config({ path: ".env.local" });

async function main() {
  const { prisma } = await import("../src/lib/db/prisma");

  const business = await prisma.business.findFirst({
    where: { name: { contains: "Brunneke", mode: "insensitive" } },
    include: { mailOutreach: true },
  });

  if (!business) {
    console.error("Brunneke business not found");
    process.exit(1);
  }

  const mo = business.mailOutreach;
  if (!mo) {
    console.error("No MailOutreach row for Brunneke");
    process.exit(1);
  }

  const sentBatch = await prisma.mailOutreach.findMany({
    where: { status: "sent" },
    include: { business: { select: { name: true } } },
    orderBy: { sentAt: "asc" },
  });

  const inBatch = sentBatch.some((s) => s.businessId === business.id);
  console.log("Current:", {
    name: business.name,
    status: mo.status,
    sentAt: mo.sentAt,
    bookedAt: mo.bookedAt,
    recipientEmail: mo.recipientEmail,
    businessEmail: business.email,
  });
  console.log(`In sent batch (${sentBatch.length}):`, inBatch);

  if (inBatch) {
    console.error("Brunneke was in sent batch — not resetting to draft.");
    process.exit(1);
  }

  const recipient =
    business.email?.trim() || "t.brunneke@kpnplanet.nl";

  const updated = await prisma.mailOutreach.update({
    where: { businessId: business.id },
    data: {
      status: "draft",
      sentAt: null,
      bookedAt: null,
      appointmentId: null,
      recipientEmail: recipient,
    },
  });

  console.log("Reset to draft:", {
    status: updated.status,
    recipientEmail: updated.recipientEmail,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    const { prisma } = await import("../src/lib/db/prisma");
    await prisma.$disconnect();
  });
