import "server-only";

import { prisma } from "@/lib/db/prisma";
import { ADMIN_VERTICAL_LEAD_TARGET } from "@/lib/admin/vertical-summary-types";
import {
  AUTOPILOT_PIPELINE_BRANCH_IDS,
  getNextPipelineBranch,
  type AutopilotPipelineBranchId,
} from "@/lib/bedrijven/autopilot-pipeline-branches";
import type { OutreachBranchId } from "@/lib/bedrijven/outreach-branches";
import {
  appendAutopilotLog,
  createLogLine,
} from "@/lib/outreach/autopilot-log";
import type { AutopilotMode } from "@/lib/outreach/autopilot";

export type AutopilotPipelineAdvanceResult = {
  advanced: boolean;
  completed?: boolean;
  from?: OutreachBranchId;
  to?: OutreachBranchId | null;
  emailCount?: number;
  reason?: "email_goal" | "scrape_exhausted";
};

export async function countBranchLeadsWithEmail(
  branchId: string,
): Promise<number> {
  return prisma.business.count({
    where: {
      branchId,
      email: { not: null },
      NOT: { email: "" },
    },
  });
}

export async function countPipelineEmailTotals(): Promise<
  Record<AutopilotPipelineBranchId, number>
> {
  const entries = await Promise.all(
    AUTOPILOT_PIPELINE_BRANCH_IDS.map(async (id) => [
      id,
      await countBranchLeadsWithEmail(id),
    ] as const),
  );
  return Object.fromEntries(entries) as Record<
    AutopilotPipelineBranchId,
    number
  >;
}

/** Start op eerste verticale die nog onder het doel zit (anders laatste). */
export async function resolvePipelineStartBranch(
  requested: OutreachBranchId,
): Promise<OutreachBranchId> {
  const counts = await countPipelineEmailTotals();
  for (const id of AUTOPILOT_PIPELINE_BRANCH_IDS) {
    if ((counts[id] ?? 0) < ADMIN_VERTICAL_LEAD_TARGET) return id;
  }
  return requested;
}

export type PipelineAdvanceHandlers = {
  stop: (branchId: OutreachBranchId, opts?: { quiet?: boolean }) => Promise<unknown>;
  start: (
    branchId: OutreachBranchId,
    mode: AutopilotMode,
  ) => Promise<unknown>;
};

/**
 * Bij ≥ e-maildoel: scrape stoppen en volgende verticale starten (zelfde modus).
 */
export async function advanceAutopilotPipelineIfGoalMet(
  branchId: OutreachBranchId,
  mode: AutopilotMode,
  handlers: PipelineAdvanceHandlers,
): Promise<AutopilotPipelineAdvanceResult> {
  const emailCount = await countBranchLeadsWithEmail(branchId);
  if (emailCount < ADMIN_VERTICAL_LEAD_TARGET) {
    return { advanced: false, emailCount };
  }

  const next = getNextPipelineBranch(branchId);

  await appendAutopilotLog(branchId, [
    createLogLine(
      "ok",
      "pipeline",
      `Doel bereikt: ${emailCount} leads met e-mail`,
      `Doel ${ADMIN_VERTICAL_LEAD_TARGET} · scrape gestopt`,
    ),
  ]);

  await handlers.stop(branchId, { quiet: true });

  if (!next) {
    await appendAutopilotLog(branchId, [
      createLogLine(
        "ok",
        "pipeline",
        "Pipeline voltooid",
        "Alle verticalen hebben het e-maildoel bereikt",
      ),
    ]);
    return {
      advanced: true,
      completed: true,
      from: branchId,
      to: null,
      emailCount,
      reason: "email_goal",
    };
  }

  await handlers.start(next, mode);
  await appendAutopilotLog(next, [
    createLogLine(
      "ok",
      "pipeline",
      `Volgende verticale gestart: ${next}`,
      `Vorige: ${branchId} (${emailCount} met e-mail)`,
    ),
  ]);

  return {
    advanced: true,
    completed: false,
    from: branchId,
    to: next,
    emailCount,
    reason: "email_goal",
  };
}

/**
 * Alle provincies uitgeput én e-maildoel bereikt → volgende verticale (zelfde modus).
 * Onder het doel: niet door schakelen (caller kan scrape herstarten).
 */
export async function advanceAutopilotPipelineIfScrapeExhausted(
  branchId: OutreachBranchId,
  mode: AutopilotMode,
  handlers: PipelineAdvanceHandlers,
): Promise<AutopilotPipelineAdvanceResult> {
  const emailCount = await countBranchLeadsWithEmail(branchId);
  if (emailCount < ADMIN_VERTICAL_LEAD_TARGET) {
    return { advanced: false, emailCount, reason: "scrape_exhausted" };
  }

  const next = getNextPipelineBranch(branchId as AutopilotPipelineBranchId);

  await appendAutopilotLog(branchId, [
    createLogLine(
      "ok",
      "pipeline",
      "Scrape uitgeput voor deze verticale",
      `Geen nieuwe leads meer (alle provincies) · ${emailCount} met e-mail · door naar volgende`,
    ),
  ]);

  await handlers.stop(branchId, { quiet: true });

  if (!next) {
    await appendAutopilotLog(branchId, [
      createLogLine(
        "ok",
        "pipeline",
        "Scrape-pipeline voltooid",
        "Alle verticalen volledig gescraped",
      ),
    ]);
    return {
      advanced: true,
      completed: true,
      from: branchId,
      to: null,
      emailCount,
      reason: "scrape_exhausted",
    };
  }

  await handlers.start(next, mode);
  await appendAutopilotLog(next, [
    createLogLine(
      "ok",
      "pipeline",
      `Volgende verticale gestart: ${next}`,
      `Vorige: ${branchId} uitgeput · scrape gaat door`,
    ),
  ]);

  return {
    advanced: true,
    completed: false,
    from: branchId,
    to: next,
    emailCount,
    reason: "scrape_exhausted",
  };
}
