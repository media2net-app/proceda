import { config } from "dotenv";

config();
config({ path: ".env.local" });

async function main() {
  const { prisma } = await import("../src/lib/db/prisma");
  const { extractDemoTokenFromPath } = await import(
    "../src/lib/analytics-demo-lead"
  );

  const outreach = await prisma.mailOutreach.findMany({
    where: { status: { in: ["sent", "booked"] } },
    select: {
      token: true,
      business: { select: { name: true } },
      sentAt: true,
    },
  });
  const tokenSet = new Set(outreach.map((o) => o.token));
  const prefixToFull = new Map(
    outreach.map((o) => [o.token.slice(0, 10), o.token]),
  );

  const sessions = await prisma.analyticsSession.findMany({
    where: { mailToken: { not: null } },
    select: { mailToken: true, leadName: true, lastSeenAt: true },
  });

  const matched = new Map<string, { name: string; via: string[] }>();
  for (const o of outreach) {
    matched.set(o.token, { name: o.business?.name ?? o.token, via: [] });
  }

  for (const s of sessions) {
    const t = s.mailToken?.trim();
    if (t && matched.has(t)) matched.get(t)!.via.push(`session:${s.leadName}`);
  }

  const views = await prisma.analyticsPageView.findMany({
    where: { path: { contains: "/demo/" } },
    select: { path: true, viewedAt: true },
  });

  for (const v of views) {
    const extracted = extractDemoTokenFromPath(v.path);
    if (!extracted) continue;
    let token = tokenSet.has(extracted)
      ? extracted
      : prefixToFull.get(extracted) ?? prefixToFull.get(extracted.slice(0, 10));
    if (token && matched.has(token)) {
      matched.get(token)!.via.push(`path:${v.path}`);
    }
  }

  const clicked = [...matched.entries()].filter(([, m]) => m.via.length > 0);
  console.log("Verstuurd in DB:", outreach.length);
  console.log("Met demo-activiteit:", clicked.length);
  for (const [tok, m] of clicked) {
    console.log(`\n${m.name}`);
    console.log(`  token: ${tok.slice(0, 12)}…`);
    console.log(`  signals: ${m.via.length}`);
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    const { prisma } = await import("../src/lib/db/prisma");
    await prisma.$disconnect();
  });
