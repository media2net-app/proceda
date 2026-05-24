import { config } from "dotenv";

config();
config({ path: ".env.local" });

async function main() {
  const { prisma } = await import("../src/lib/db/prisma");

  const rows = await prisma.outreachAutopilot.findMany({
    select: {
      branchId: true,
      active: true,
      mode: true,
      tickInProgress: true,
      lastTickAt: true,
      scrapeProvinceId: true,
      ticksTotal: true,
      startedAt: true,
      activityLog: true,
    },
  });

  for (const r of rows) {
    const log = Array.isArray(r.activityLog) ? r.activityLog : [];
    const last = log.length > 0 ? log[log.length - 1] : null;
    console.log("---", r.branchId, "---");
    console.log("  active:", r.active);
    console.log("  mode:", r.mode);
    console.log("  tickInProgress:", r.tickInProgress);
    console.log("  province:", r.scrapeProvinceId);
    console.log("  ticksTotal:", r.ticksTotal);
    console.log("  lastTickAt:", r.lastTickAt?.toISOString() ?? null);
    if (last && typeof last === "object") {
      const line = last as { message?: string; detail?: string; at?: string };
      console.log("  lastLog:", line.message, line.detail ? `(${line.detail})` : "");
    }
  }

  if (rows.length === 0) console.log("Geen autopilot rijen in DB.");

  const branches = [
    "makelaardij",
    "installatie",
    "vastgoedbeheer",
    "accountants",
    "recruitment",
    "verzekering",
  ];
  console.log("\n=== Leads met e-mail (doel 2000) ===");
  for (const branchId of branches) {
    const n = await prisma.business.count({
      where: { branchId, email: { not: null }, NOT: { email: "" } },
    });
    const mark = n >= 2000 ? "✓ doel gehaald" : `nog ${2000 - n} te gaan`;
    console.log(`  ${branchId.padEnd(16)} ${n}  ${mark}`);
  }

  const active = rows.filter((r) => r.active);
  console.log(
    "\nAutopilot actief:",
    active.length
      ? active.map((r) => `${r.branchId} (${r.mode})`).join(", ")
      : "NEE — alle verticalen gestopt",
  );
}

main()
  .catch(console.error)
  .finally(async () => {
    const { prisma } = await import("../src/lib/db/prisma");
    await prisma.$disconnect();
  });
