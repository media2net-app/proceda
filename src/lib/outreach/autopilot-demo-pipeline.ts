import "server-only";

import { ADMIN_VERTICAL_LEAD_TARGET } from "@/lib/admin/vertical-summary-types";
import {
  AUTOPILOT_PIPELINE_BRANCH_IDS,
  getNextPipelineBranch,
  type AutopilotPipelineBranchId,
} from "@/lib/bedrijven/autopilot-pipeline-branches";
import { countBranchDemoReady } from "@/lib/bedrijven/demo-ready-probe";
import type { OutreachBranchId } from "@/lib/bedrijven/outreach-branches";
import type { AutopilotMode } from "@/lib/outreach/autopilot";
import {
  appendAutopilotLog,
  createLogLine,
} from "@/lib/outreach/autopilot-log";

export type DemoPipelineAdvanceResult = {
  advanced: boolean;
  completed?: boolean;
  from?: OutreachBranchId;
  to?: OutreachBranchId | null;
  demoReadyCount?: number;
};

export async function resolveDemoPipelineStartBranch(
  requested: OutreachBranchId,
): Promise<OutreachBranchId> {
  for (const id of AUTOPILOT_PIPELINE_BRANCH_IDS) {
    const count = await countBranchDemoReady(id);
    if (count < ADMIN_VERTICAL_LEAD_TARGET) return id;
  }
  return requested;
}

export type DemoPipelineAdvanceHandlers = {
  stop: (branchId: OutreachBranchId, opts?: { quiet?: boolean }) => Promise<unknown>;
  start: (
    branchId: OutreachBranchId,
    mode: AutopilotMode,
  ) => Promise<unknown>;
};

export async function advanceDemoPipelineIfGoalMet(
  branchId: OutreachBranchId,
  mode: AutopilotMode,
  handlers: DemoPipelineAdvanceHandlers,
): Promise<DemoPipelineAdvanceResult> {
  const demoReadyCount = await countBranchDemoReady(branchId);
  if (demoReadyCount < ADMIN_VERTICAL_LEAD_TARGET) {
    return { advanced: false, demoReadyCount };
  }

  const next = getNextPipelineBranch(branchId as AutopilotPipelineBranchId);

  await appendAutopilotLog(branchId, [
    createLogLine(
      "ok",
      "demo-pipeline",
      `Demo-doel bereikt: ${demoReadyCount} demo-klaar`,
      `Doel ${ADMIN_VERTICAL_LEAD_TARGET} · door naar volgende verticale`,
    ),
  ]);

  await handlers.stop(branchId, { quiet: true });

  if (!next) {
    await appendAutopilotLog(branchId, [
      createLogLine(
        "ok",
        "demo-pipeline",
        "Demo-pipeline voltooid",
        "Alle verticalen hebben ≥200 demo-klaar leads",
      ),
    ]);
    return {
      advanced: true,
      completed: true,
      from: branchId,
      to: null,
      demoReadyCount,
    };
  }

  await handlers.start(next, mode);
  await appendAutopilotLog(next, [
    createLogLine(
      "ok",
      "demo-pipeline",
      `Demo-prep gestart: ${next}`,
      `Vorige: ${branchId} (${demoReadyCount} demo-klaar)`,
    ),
  ]);

  return {
    advanced: true,
    completed: false,
    from: branchId,
    to: next,
    demoReadyCount,
  };
}
