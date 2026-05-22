import { config } from "dotenv";

config();
config({ path: ".env.local" });

async function main() {
  const { prisma } = await import("../src/lib/db/prisma");
  const { extractDemoTokenFromPath } = await import(
    "../src/lib/analytics-demo-lead"
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [sessionsTotal, sessionsToday, pageViewsDemo, outreachTokens] =
    await Promise.all([
      prisma.analyticsSession.count(),
      prisma.analyticsSession.count({
        where: { firstSeenAt: { gte: today } },
      }),
      prisma.analyticsPageView.findMany({
        where: { path: { contains: "/demo/" } },
        select: { path: true, sessionId: true, viewedAt: true },
      }),
      prisma.mailOutreach.findMany({
        where: { status: { in: ["sent", "booked"] } },
        select: { token: true, business: { select: { name: true } } },
      }),
    ]);

  const tokenSet = new Set(outreachTokens.map((o) => o.token));
  const prefixToFull = new Map(
    outreachTokens.map((o) => [o.token.slice(0, 10), o.token]),
  );

  const pathTokens = new Map<string, number>();
  const sessionIds = new Set<string>();
  let matchedFull = 0;
  let matchedPrefix = 0;
  let unmatched = 0;
  const unmatchedSamples: string[] = [];

  for (const v of pageViewsDemo) {
    sessionIds.add(v.sessionId);
    const t = extractDemoTokenFromPath(v.path);
    if (!t) continue;
    pathTokens.set(t, (pathTokens.get(t) ?? 0) + 1);

    if (tokenSet.has(t)) {
      matchedFull++;
    } else if (prefixToFull.has(t) || prefixToFull.has(t.slice(0, 10))) {
      matchedPrefix++;
    } else {
      unmatched++;
      if (unmatchedSamples.length < 8) unmatchedSamples.push(t);
    }
  }

  const uniquePathTokens = pathTokens.size;
  const tokenLengths = new Map<number, number>();
  for (const t of pathTokens.keys()) {
    tokenLengths.set(t.length, (tokenLengths.get(t.length) ?? 0) + 1);
  }

  const withMailToken = await prisma.analyticsSession.count({
    where: { mailToken: { not: null } },
  });

  const activeDemoSessions = await prisma.analyticsSession.count({
    where: {
      OR: [
        { currentPath: { contains: "/demo/" } },
        { mailToken: { not: null } },
      ],
    },
  });

  console.log("=== Analytics vs Mail ===\n");
  console.log({
    analyticsSessionsTotal: sessionsTotal,
    analyticsSessionsToday: sessionsToday,
    demoPageViews: pageViewsDemo.length,
    uniqueSessionsOnDemoPaths: sessionIds.size,
    uniqueTokensInPaths: uniquePathTokens,
    outreachSentBooked: outreachTokens.length,
  });
  console.log("\nToken length in /demo/ paths:", Object.fromEntries(tokenLengths));
  console.log("\nPage views gekoppeld aan echte mail-token:");
  console.log({
    exact32CharMatch: matchedFull,
    prefix10CharMatch: matchedPrefix,
    noMailMatch: unmatched,
  });
  console.log("\nSessies met mailToken (demo-pagina geladen):", withMailToken);
  console.log("\nVoorbeeld onbekende path-tokens:", unmatchedSamples);

  const mailClicked = outreachTokens.filter((o) => {
    const t = o.token;
    return (
      pathTokens.has(t) ||
      pathTokens.has(t.slice(0, 10)) ||
      [...pathTokens.keys()].some((p) => t.startsWith(p) && p.length >= 8)
    );
  });
  console.log("\nUnieke verstuurde leads met demo-pad-hit:", mailClicked.length);
  for (const o of mailClicked.slice(0, 10)) {
    console.log(" ·", o.business?.name);
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    const { prisma } = await import("../src/lib/db/prisma");
    await prisma.$disconnect();
  });
