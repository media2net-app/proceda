import "server-only";

import {
  ADMIN_VERTICAL_ALL,
  type AdminVerticalScope,
  outreachBranchesForScope,
} from "@/lib/bedrijven/outreach-branches";
import { loadAllBusinesses } from "@/lib/bedrijven/load-all-businesses";
import { loadOutreachPipelineBusinesses } from "@/lib/bedrijven/load-all-businesses";
import { listDemoOutreachTemplates } from "@/lib/mail/list-demo-outreach";
import type { MailTemplatePreview } from "@/lib/mail/types";

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
  branchId: AdminVerticalScope;
  updatedAt: string;
  entries: CallListEntry[];
};

async function loadPreviewsForScope(
  scope: AdminVerticalScope,
  locale: string,
): Promise<MailTemplatePreview[]> {
  const branches = outreachBranchesForScope(scope);
  const batches = await Promise.all(
    branches.map((b) => listDemoOutreachTemplates(locale, undefined, b)),
  );
  if (scope === ADMIN_VERTICAL_ALL) {
    const byBusiness = new Map<string, MailTemplatePreview>();
    for (const batch of batches) {
      for (const p of batch) byBusiness.set(p.businessId, p);
    }
    return [...byBusiness.values()];
  }
  return batches[0] ?? [];
}

export async function getOutreachCallList(
  scope: AdminVerticalScope,
  locale = "nl",
): Promise<OutreachCallList> {
  const previews = await loadPreviewsForScope(scope, locale);
  const businesses =
    scope === ADMIN_VERTICAL_ALL
      ? await loadOutreachPipelineBusinesses()
      : await loadAllBusinesses(scope);
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
    branchId: scope,
    updatedAt: new Date().toISOString(),
    entries,
  };
}
