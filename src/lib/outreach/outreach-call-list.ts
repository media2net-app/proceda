import "server-only";

import type { ScrapeBranchId } from "@/lib/bedrijven/branches";
import { loadAllBusinesses } from "@/lib/bedrijven/load-all-businesses";
import { listDemoOutreachTemplates } from "@/lib/mail/list-demo-outreach";

export type CallListEntry = {
  businessId: string;
  businessName: string;
  city: string;
  email?: string;
  phone?: string;
  leadQuality?: string;
  overallScore?: number;
  demoVisited: boolean;
  demoClickCount?: number;
  status: string;
  slug: string;
};

export type OutreachCallList = {
  branchId: ScrapeBranchId;
  updatedAt: string;
  entries: CallListEntry[];
};

export async function getOutreachCallList(
  branchId: ScrapeBranchId,
  locale = "nl",
): Promise<OutreachCallList> {
  const previews = await listDemoOutreachTemplates(locale, undefined, branchId);
  const businesses = await loadAllBusinesses(branchId);
  const byId = new Map(businesses.map((b) => [b.id, b]));

  const entries: CallListEntry[] = [];

  for (const p of previews) {
    if (p.status !== "sent" && p.status !== "booked") continue;
    if (!p.demoVisited) continue;

    const biz = byId.get(p.businessId);
    const phone = biz?.phone?.trim();
    if (!phone) continue;

    const quality = p.leadQuality ?? "cold";
    if (quality !== "hot" && quality !== "warm") continue;

    entries.push({
      businessId: p.businessId,
      businessName: p.businessName,
      city: p.city,
      email: p.email ?? biz?.email,
      phone,
      leadQuality: quality,
      overallScore: p.overallScore,
      demoVisited: true,
      demoClickCount: p.demoClickCount,
      status: p.status,
      slug: p.slug,
    });
  }

  entries.sort((a, b) => {
    const q =
      (a.leadQuality === "hot" ? 0 : 1) - (b.leadQuality === "hot" ? 0 : 1);
    if (q !== 0) return q;
    return (b.overallScore ?? 0) - (a.overallScore ?? 0);
  });

  return {
    branchId,
    updatedAt: new Date().toISOString(),
    entries,
  };
}
