import { config } from "dotenv";

config();
config({ path: ".env.local" });

async function main() {
  const { prisma } = await import("../src/lib/db/prisma");
  const {
    extractDemoTokenFromPath,
    loadLeadNamesByDemoTokens,
  } = await import("../src/lib/analytics-demo-lead");

  const paths = await prisma.analyticsPageView.findMany({
    where: { path: { contains: "/demo/" } },
    select: { path: true },
    orderBy: { viewedAt: "desc" },
    take: 50,
    distinct: ["path"],
  });

  const tokenLens = new Map<number, number>();
  for (const p of paths) {
    const t = extractDemoTokenFromPath(p.path);
    if (t) tokenLens.set(t.length, (tokenLens.get(t.length) ?? 0) + 1);
  }
  console.log("Token length distribution:", Object.fromEntries(tokenLens));

  const tokens = paths
    .map((p) => extractDemoTokenFromPath(p.path))
    .filter((t): t is string => !!t);

  console.log("Recent demo paths:");
  for (const p of paths) console.log(" ", p.path);

  const map = await loadLeadNamesByDemoTokens(tokens);
  console.log("\nToken resolution:");
  for (const t of tokens) {
    console.log(`  ${t} (${t.length} chars) -> ${map.get(t) ?? "NOT FOUND"}`);
  }

  const sent = await prisma.mailOutreach.findMany({
    where: { status: "sent" },
    select: { token: true, business: { select: { name: true } } },
    take: 3,
  });
  console.log("\nSample sent mail tokens:");
  for (const s of sent) {
    console.log(`  ${s.token} (${s.token.length}) -> ${s.business?.name}`);
    console.log(`    first10=${s.token.slice(0, 10)}`);
  }

  const prefix = tokens[0];
  if (prefix) {
    const byPrefix = await prisma.mailOutreach.findMany({
      where: { token: { startsWith: prefix } },
      select: {
        token: true,
        business: { select: { name: true } },
      },
      take: 3,
    });
    console.log(`\nMail rows where token startsWith "${prefix}":`, byPrefix.length);
    for (const r of byPrefix) console.log(" ", r.token, r.business?.name);
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    const { prisma } = await import("../src/lib/db/prisma");
    await prisma.$disconnect();
  });
