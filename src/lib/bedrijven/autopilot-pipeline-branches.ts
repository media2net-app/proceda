import { ADMIN_VERTICAL_LEAD_TARGET } from "@/lib/admin/vertical-summary-types";

/** Volgorde voor autopilot scrape-pipeline (NL outreach). */
export const AUTOPILOT_PIPELINE_BRANCH_IDS = [
  "makelaardij",
  "installatie",
  "vastgoedbeheer",
  "accountants",
  "recruitment",
  "verzekering",
] as const;

export type AutopilotPipelineBranchId =
  (typeof AUTOPILOT_PIPELINE_BRANCH_IDS)[number];

export { ADMIN_VERTICAL_LEAD_TARGET as AUTOPILOT_LEAD_EMAIL_TARGET };

export function isAutopilotPipelineBranchId(
  id: string,
): id is AutopilotPipelineBranchId {
  return AUTOPILOT_PIPELINE_BRANCH_IDS.includes(id as AutopilotPipelineBranchId);
}

export function getNextPipelineBranch(
  current: AutopilotPipelineBranchId,
): AutopilotPipelineBranchId | null {
  const idx = AUTOPILOT_PIPELINE_BRANCH_IDS.indexOf(current);
  if (idx < 0 || idx >= AUTOPILOT_PIPELINE_BRANCH_IDS.length - 1) return null;
  return AUTOPILOT_PIPELINE_BRANCH_IDS[idx + 1]!;
}

/** Eerste verticale in de pipeline die nog onder het e-maildoel zit. */
export function firstPipelineBranchBelowGoal(
  counts: Record<string, number>,
): AutopilotPipelineBranchId | null {
  for (const id of AUTOPILOT_PIPELINE_BRANCH_IDS) {
    if ((counts[id] ?? 0) < ADMIN_VERTICAL_LEAD_TARGET) return id;
  }
  return null;
}
