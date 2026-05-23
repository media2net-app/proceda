import "server-only";

import type { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/db/prisma";
import type { OutreachBranchId } from "@/lib/bedrijven/outreach-branches";
import type { AutopilotTickSummary } from "@/lib/outreach/autopilot";

export type AutopilotLogLevel = "info" | "run" | "ok" | "warn" | "error" | "skip";

export type AutopilotLogLine = {
  at: string;
  level: AutopilotLogLevel;
  step: string;
  message: string;
  detail?: string;
};

const MAX_LOG_LINES = 400;

export function createLogLine(
  level: AutopilotLogLevel,
  step: string,
  message: string,
  detail?: string,
): AutopilotLogLine {
  return {
    at: new Date().toISOString(),
    level,
    step,
    message,
    detail,
  };
}

export function parseActivityLog(raw: unknown): AutopilotLogLine[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (line): line is AutopilotLogLine =>
      typeof line === "object" &&
      line !== null &&
      typeof (line as AutopilotLogLine).message === "string",
  );
}

export async function clearAutopilotLog(branchId: OutreachBranchId) {
  await prisma.outreachAutopilot.update({
    where: { branchId },
    data: { activityLog: [] as unknown as Prisma.InputJsonValue },
  });
}

export async function appendAutopilotLog(
  branchId: OutreachBranchId,
  lines: AutopilotLogLine[],
) {
  if (lines.length === 0) return;
  const row = await prisma.outreachAutopilot.findUnique({
    where: { branchId },
    select: { activityLog: true },
  });
  const existing = parseActivityLog(row?.activityLog);
  const merged = [...existing, ...lines].slice(-MAX_LOG_LINES);
  await prisma.outreachAutopilot.update({
    where: { branchId },
    data: { activityLog: merged as unknown as Prisma.InputJsonValue },
  });
}

export function formatTickSummaryToLog(
  summary: AutopilotTickSummary,
  tickNum: number,
): AutopilotLogLine[] {
  const lines: AutopilotLogLine[] = [
    createLogLine(
      "run",
      "tick",
      `── Tick #${tickNum} gestart ──`,
      new Date(summary.at).toLocaleString("nl-NL"),
    ),
  ];

  const pipeline = summary.steps.pipeline as
    | { draftConcepts?: number; sendReady?: number }
    | undefined;
  if (pipeline) {
    lines.push(
      createLogLine(
        "info",
        "pipeline",
        `Pipeline: ${pipeline.sendReady ?? 0} verzendklaar · ${pipeline.draftConcepts ?? 0} concepten`,
      ),
    );
  }

  const inbox = summary.steps.inbox as Record<string, unknown> | undefined;
  if (inbox?.skipped) {
    lines.push(
      createLogLine("skip", "inbox", "Inbox sync overgeslagen", String(inbox.reason)),
    );
  } else if (inbox?.synced) {
    const bounce = inbox.bounceSync as { newBounces?: number } | undefined;
    lines.push(
      createLogLine(
        "ok",
        "inbox",
        `Inbox gesynchroniseerd · ${inbox.unread ?? 0} ongelezen`,
        bounce?.newBounces
          ? `${bounce.newBounces} nieuwe bounce(s)`
          : undefined,
      ),
    );
  }

  const reminders = summary.steps.reminders as { sent?: number } | undefined;
  if (reminders) {
    lines.push(
      createLogLine(
        "ok",
        "reminders",
        `Boekingsherinneringen: ${reminders.sent ?? 0} verstuurd`,
      ),
    );
  }

  const sequences = summary.steps.sequences as
    | { sent?: number; skipped?: number; failed?: number }
    | undefined;
  if (sequences) {
    lines.push(
      createLogLine(
        sequences.failed ? "warn" : "ok",
        "sequences",
        `Sequences: ${sequences.sent ?? 0} verstuurd · ${sequences.skipped ?? 0} overgeslagen · ${sequences.failed ?? 0} mislukt`,
      ),
    );
  }

  const followups = summary.steps.followups as
    | { sent?: number; failed?: number; items?: { businessId: string; status: string }[] }
    | undefined;
  if (followups) {
    lines.push(
      createLogLine(
        followups.failed ? "warn" : "ok",
        "followup",
        `Follow-ups: ${followups.sent ?? 0} verstuurd · ${followups.failed ?? 0} mislukt`,
      ),
    );
    for (const item of followups.items ?? []) {
      if (item.status === "sent") {
        lines.push(
          createLogLine("ok", "followup", `Follow-up verstuurd`, item.businessId.slice(0, 12)),
        );
      } else if (item.status !== "sent") {
        lines.push(
          createLogLine("skip", "followup", `Follow-up overgeslagen`, item.status),
        );
      }
    }
  }

  const batch = summary.steps.batchSend as
    | {
        skipped?: boolean;
        reason?: string;
        sent?: number;
        failed?: number;
      }
    | undefined;
  if (batch && "skipped" in batch && batch.skipped) {
    lines.push(
      createLogLine("skip", "mail", "Batch send overgeslagen", batch.reason),
    );
  } else if (batch && "sent" in batch) {
    lines.push(
      createLogLine(
        (batch.failed ?? 0) > 0 ? "warn" : "ok",
        "mail",
        `Eerste mails: ${batch.sent ?? 0} verstuurd · ${batch.failed ?? 0} mislukt`,
      ),
    );
  }

  const scrape = summary.steps.scrape as Record<string, unknown> | undefined;
  if (scrape?.skipped) {
    lines.push(
      createLogLine(
        "skip",
        "scrape",
        "Lead scrape overgeslagen",
        String(scrape.reason ?? ""),
      ),
    );
  } else if (scrape) {
    lines.push(
      createLogLine(
        "ok",
        "scrape",
        `Browser scrape (${scrape.province}): +${scrape.batchAdded ?? 0} leads · ${scrape.remaining ?? 0} in queue`,
        scrape.done ? "Provincie afgerond" : "Nog bezig",
      ),
    );
  }

  for (const err of summary.errors) {
    lines.push(createLogLine("error", "tick", err));
  }

  lines.push(
    createLogLine(
      summary.errors.length ? "warn" : "ok",
      "tick",
      `── Tick #${tickNum} afgerond ──`,
    ),
  );

  return lines;
}
