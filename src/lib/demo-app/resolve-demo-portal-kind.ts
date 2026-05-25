import "server-only";

import { getDemoBrandEntry } from "@/lib/demo-homepage/demo-brand-registry";
import { HIEBAMI_DEMO_SLUGS } from "@/lib/demo-app/hiebami-demo";
import { prisma } from "@/lib/db/prisma";

export type DemoPortalKind = "makelaar" | "recruitment";

export { HIEBAMI_BUSINESS_ID, HIEBAMI_DEMO_SLUGS } from "@/lib/demo-app/hiebami-demo";

export async function resolveDemoPortalKind(
  demoSlug: string,
): Promise<DemoPortalKind> {
  if ((HIEBAMI_DEMO_SLUGS as readonly string[]).includes(demoSlug)) {
    return "recruitment";
  }

  const entry = getDemoBrandEntry(demoSlug);
  const businessId = entry?.businessId;
  if (businessId) {
    const biz = await prisma.business.findUnique({
      where: { id: businessId },
      select: { branchId: true },
    });
    if (biz?.branchId === "recruitment") return "recruitment";
  }

  return "makelaar";
}
