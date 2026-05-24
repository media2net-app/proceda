import type { ScrapeBranchId } from "./branches";
import { isValidBranchId, resolveBranchId } from "./branches";
import {
  AUTOPILOT_PIPELINE_BRANCH_IDS,
  isAutopilotPipelineBranchId,
  type AutopilotPipelineBranchId,
} from "./autopilot-pipeline-branches";

/** Verticalen in admin + autopilot (zelfde volgorde als pipeline). */
export const OUTREACH_BRANCH_IDS = AUTOPILOT_PIPELINE_BRANCH_IDS;

export type OutreachBranchId = AutopilotPipelineBranchId;

/** Admin-sidebar: alle outreach-verticalen tegelijk (KPI’s geaggregeerd). */
export const ADMIN_VERTICAL_ALL = "all" as const;

export type AdminVerticalScope = OutreachBranchId | typeof ADMIN_VERTICAL_ALL;

export function isAdminVerticalAll(
  scope: AdminVerticalScope,
): scope is typeof ADMIN_VERTICAL_ALL {
  return scope === ADMIN_VERTICAL_ALL;
}

export function parseAdminVerticalScope(
  value: string | null | undefined,
): AdminVerticalScope {
  if (!value || value === ADMIN_VERTICAL_ALL) return ADMIN_VERTICAL_ALL;
  if (isOutreachBranchId(value)) return value;
  return ADMIN_VERTICAL_ALL;
}

export type PlannedOutreachVertical = { id: string; name: string };

/** Optioneel: verticalen buiten de autopilot-pipeline (nu leeg). */
export const PLANNED_OUTREACH_VERTICALS: readonly PlannedOutreachVertical[] = [];

export type PlannedOutreachVerticalId = PlannedOutreachVertical["id"];

export function isOutreachBranchId(id: string): id is OutreachBranchId {
  return isAutopilotPipelineBranchId(id);
}

export function resolveOutreachBranchId(
  value: string | null,
): OutreachBranchId {
  const scope = parseAdminVerticalScope(value);
  if (scope === ADMIN_VERTICAL_ALL) return "makelaardij";
  return scope;
}

/** Branches voor admin-scope (één verticale of alle outreach-verticalen). */
export function outreachBranchesForScope(
  scope: AdminVerticalScope,
): readonly OutreachBranchId[] {
  return scope === ADMIN_VERTICAL_ALL ? OUTREACH_BRANCH_IDS : [scope];
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
