import { prisma } from "@/lib/db/prisma";

const LOCALE_PREFIX = /^\/(?:nl|en|ro)(?=\/)/i;

/** Token uit pad /demo/{token} of /{locale}/demo/{token}. */
export function extractDemoTokenFromPath(path: string): string | null {
  const pathname = (path.split("?")[0] ?? path).replace(LOCALE_PREFIX, "");
  const match = pathname.match(/\/demo\/([^/]+)/i);
  return match?.[1]?.trim() || null;
}

const FULL_MAIL_TOKEN_LEN = 32;

export async function loadLeadNamesByDemoTokens(
  tokens: string[],
): Promise<Map<string, string>> {
  const unique = [...new Set(tokens.map((t) => t.trim()).filter(Boolean))];
  if (unique.length === 0) return new Map();

  const map = new Map<string, string>();

  const fullTokens = unique.filter((t) => t.length >= FULL_MAIL_TOKEN_LEN);
  if (fullTokens.length > 0) {
    const rows = await prisma.mailOutreach.findMany({
      where: { token: { in: fullTokens } },
      select: {
        token: true,
        businessId: true,
        business: { select: { name: true } },
      },
    });
    for (const row of rows) {
      const name = row.business?.name?.trim();
      map.set(row.token, name || row.businessId);
    }
  }

  const shortTokens = unique.filter(
    (t) => t.length >= 8 && t.length < FULL_MAIL_TOKEN_LEN,
  );
  for (const short of shortTokens) {
    if (map.has(short)) continue;
    const rows = await prisma.mailOutreach.findMany({
      where: { token: { startsWith: short } },
      select: {
        token: true,
        businessId: true,
        business: { select: { name: true } },
      },
      take: 2,
    });
    if (rows.length === 1) {
      const row = rows[0]!;
      const name = row.business?.name?.trim();
      map.set(short, name || row.businessId);
    }
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
