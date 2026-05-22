import { config } from "dotenv";

config();
config({ path: ".env.local" });

async function main() {
  const { prisma } = await import("../src/lib/db/prisma");
  const { getMailKpiStats, listMailTemplates } = await import(
    "../src/lib/mail/mail-campaign"
  );

  const previews = await listMailTemplates("nl");
  const stats = await getMailKpiStats("nl");

  const draft = previews.filter((p) => p.status === "draft").length;
  const clicked = previews.filter(
    (p) =>
      (p.status === "sent" || p.status === "booked") && p.demoVisited,
  );

  console.log("API stats:", stats);
  console.log("Previews:", previews.length, "draft:", draft);
  console.log("\nDemo geklikt (UI):", clicked.length);
  for (const p of clicked) {
    console.log(
      `  · ${p.businessName} (${p.status}) views=${p.demoClickCount} last=${p.demoLastClickAt}`,
    );
  }

  const [dbDraft, dbSent] = await Promise.all([
    prisma.mailOutreach.count({ where: { status: "draft" } }),
    prisma.mailOutreach.count({ where: { status: "sent" } }),
  ]);
  console.log("\nDB:", { dbDraft, dbSent });
}

main()
  .catch(console.error)
  .finally(async () => {
    const { prisma } = await import("../src/lib/db/prisma");
    await prisma.$disconnect();
  });
