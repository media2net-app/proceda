import { config } from "dotenv";

config();
config({ path: ".env.local" });

async function main() {
  const { prisma } = await import("../src/lib/db/prisma");
  const { extractDemoTokenFromPath } = await import(
    "../src/lib/analytics-demo-lead"
  );

  const paths = await prisma.analyticsPageView.findMany({
    where: { path: { contains: "/demo/" } },
    select: { path: true },
    distinct: ["path"],
  });

  const shortTokens = new Set<string>();
  for (const p of paths) {
    const t = extractDemoTokenFromPath(p.path);
    if (t && t.length <= 12) shortTokens.add(t);
  }

  const allMail = await prisma.mailOutreach.findMany({
    select: { token: true, business: { select: { name: true } } },
  });

  const byPrefix = new Map<string, string>();
  for (const row of allMail) {
    byPrefix.set(row.token.slice(0, 10), row.business?.name ?? row.token);
  }

  console.log(`Short analytics tokens: ${shortTokens.size}`);
  let matched = 0;
  for (const st of shortTokens) {
    const name = byPrefix.get(st);
    if (name) {
      matched++;
      console.log(`  MATCH ${st} -> ${name}`);
    }
  }
  console.log(`Matched by first-10-chars prefix: ${matched}/${shortTokens.size}`);

  if (matched === 0 && shortTokens.size > 0) {
    const sample = [...shortTokens][0]!;
    console.log("\nTry base64 decode then lookup:");
    const decoded = Buffer.from(
      sample.replace(/-/g, "+").replace(/_/g, "/"),
      "base64",
    ).toString("utf8");
    console.log(" sample decode:", decoded);
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    const { prisma } = await import("../src/lib/db/prisma");
    await prisma.$disconnect();
  });
