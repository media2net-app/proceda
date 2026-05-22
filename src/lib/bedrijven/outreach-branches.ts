import type { ScrapeBranchId } from "./branches";
import { isValidBranchId, resolveBranchId } from "./branches";

/** Verticale met eigen mail/huisstijl/KPI-hub (NL outreach). */
export const OUTREACH_BRANCH_IDS = ["makelaardij", "installatie"] as const;

export type OutreachBranchId = (typeof OUTREACH_BRANCH_IDS)[number];

/** Geplande verticalen (sidebar-preview, nog niet actief). */
export const PLANNED_OUTREACH_VERTICALS = [
  { id: "vastgoedbeheer", name: "Vastgoedbeheer" },
  { id: "accountants", name: "Accountants & boekhouding" },
  { id: "recruitment", name: "Recruitment & detachering" },
  { id: "verzekering", name: "Verzekeringsadvies" },
] as const;

export type PlannedOutreachVerticalId =
  (typeof PLANNED_OUTREACH_VERTICALS)[number]["id"];

export function isOutreachBranchId(id: string): id is OutreachBranchId {
  return OUTREACH_BRANCH_IDS.includes(id as OutreachBranchId);
}

export function resolveOutreachBranchId(
  value: string | null,
): OutreachBranchId {
  if (value && isOutreachBranchId(value)) return value;
  return "makelaardij";
}

/** Sidebar + admin context: makelaardij & installatie; overige via Bedrijven-dropdown. */
export function isAdminVerticalBranch(id: ScrapeBranchId): boolean {
  return isOutreachBranchId(id);
}

export function scrapeBranchFromOutreach(
  id: OutreachBranchId,
): ScrapeBranchId {
  return id;
}

export function resolveAdminVerticalBranch(
  value: string | null,
): OutreachBranchId {
  const resolved = resolveBranchId(value);
  if (isOutreachBranchId(resolved)) return resolved;
  return "makelaardij";
}
