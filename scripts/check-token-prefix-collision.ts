import { config } from "dotenv";

config();
config({ path: ".env.local" });

async function main() {
  const { prisma } = await import("../src/lib/db/prisma");
  const rows = await prisma.mailOutreach.findMany({
    select: { token: true },
  });
  const prefixes = new Map<string, number>();
  for (const r of rows) {
    const p = r.token.slice(0, 10);
    prefixes.set(p, (prefixes.get(p) ?? 0) + 1);
  }
  const collisions = [...prefixes.entries()].filter(([, n]) => n > 1);
  console.log("Total tokens:", rows.length);
  console.log("Unique 10-char prefixes:", prefixes.size);
  console.log("Prefix collisions:", collisions.length);
  if (collisions[0]) {
    console.log("Example collision:", collisions[0]);
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    const { prisma } = await import("../src/lib/db/prisma");
    await prisma.$disconnect();
  });
