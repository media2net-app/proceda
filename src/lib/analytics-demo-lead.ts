import { prisma } from "@/lib/db/prisma";

/** Token uit pad /demo/{token} (zonder locale-prefix). */
export function extractDemoTokenFromPath(path: string): string | null {
  const pathname = path.split("?")[0] ?? path;
  const match = pathname.match(/\/demo\/([^/]+)/i);
  return match?.[1]?.trim() || null;
}

export async function loadLeadNamesByDemoTokens(
  tokens: string[],
): Promise<Map<string, string>> {
  const unique = [...new Set(tokens.map((t) => t.trim()).filter(Boolean))];
  if (unique.length === 0) return new Map();

  const rows = await prisma.mailOutreach.findMany({
    where: { token: { in: unique } },
    select: {
      token: true,
      businessId: true,
      business: { select: { name: true } },
    },
  });

  const map = new Map<string, string>();
  for (const row of rows) {
    const name = row.business?.name?.trim();
    map.set(row.token, name || row.businessId);
  }
  return map;
}

export function resolveLeadNameForPath(
  path: string,
  leadByToken: Map<string, string>,
): string | null {
  const token = extractDemoTokenFromPath(path);
  if (!token) return null;
  return leadByToken.get(token) ?? null;
}

export function formatPageLabelWithLead(
  path: string,
  leadByToken: Map<string, string>,
): string {
  const pathname = path.split("?")[0] || "/";
  const lead = resolveLeadNameForPath(path, leadByToken);

  if (pathname === "/" || pathname === "") {
    return lead ? `Homepage` : "Home · /";
  }

  if (lead && /\/demo\//i.test(pathname)) {
    return `${lead} · demo-booking`;
  }

  if (pathname.startsWith("/demos/")) {
    const slug = pathname.split("/")[2];
    return slug ? `Makelaar demo · ${slug}` : "Makelaar demo";
  }

  if (lead) return `${lead} · ${pathname}`;
  if (pathname.length > 48) return `${pathname.slice(0, 46)}…`;
  return pathname;
}

export function formatFunnelLabelWithLead(
  funnelLabel: string | null,
  path: string,
  leadByToken: Map<string, string>,
): string {
  const lead = resolveLeadNameForPath(path, leadByToken);
  if (lead && funnelLabel === "Demo booking") {
    return `Demo booking — ${lead}`;
  }
  return funnelLabel ?? "—";
}
