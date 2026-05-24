import "server-only";

import type { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/db/prisma";
import type { OutreachBranchId } from "@/lib/bedrijven/outreach-branches";
import type { ScrapeBatchLeadLog } from "@/lib/bedrijven/types";
import type { AutopilotTickSummary } from "@/lib/outreach/autopilot";

export type AutopilotLogLevel = "info" | "run" | "ok" | "warn" | "error" | "skip";

export type AutopilotLogLine = {
  at: string;
  level: AutopilotLogLevel;
  step: string;
  message: string;
  detail?: string;
};

const MAX_LOG_LINES = 800;

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

function websiteHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function createDemoProbeLogLine(row: {
  name: string;
  website: string;
  demoReady: boolean;
  error?: string | null;
}): AutopilotLogLine {
  if (row.demoReady) {
    return createLogLine("ok", "demo-probe", row.name, row.website);
  }
  return createLogLine(
    "skip",
    "demo-probe",
    row.name,
    row.error ?? "geen logo + huisstijlkleuren",
  );
}

export function createDemoGenerateLogLine(payload: {
  name: string;
  demoSlug: string;
  homepage: boolean;
}): AutopilotLogLine {
  return createLogLine(
    "ok",
    "demo-build",
    payload.name,
    `/demos/${payload.demoSlug}${payload.homepage ? "" : " · homepage mislukt"}`,
  );
}

export function createScrapeLeadLogLine(entry: ScrapeBatchLeadLog): AutopilotLogLine {
  const host = websiteHost(entry.website);
  if (entry.status === "added") {
    const name = entry.name?.trim() || host;
    const detailParts = [entry.website];
    if (entry.email) detailParts.push(entry.email);
    if (entry.detail) detailParts.push(entry.detail);
    return createLogLine("ok", "lead", `+1 lead · ${name}`, detailParts.join(" · "));
  }
  if (entry.status === "no_email") {
    const name = entry.name?.trim();
    return createLogLine(
      "skip",
      "lead",
      `+0 · ${name && name !== host ? name : host} · geen e-mail`,
      entry.website,
    );
  }
  return createLogLine("warn", "lead", `+0 · ${host} · niet bereikbaar`, entry.website);
}

export function createScrapeLeadScanLogLine(website: string): AutopilotLogLine {
  return createLogLine("run", "lead", `→ scan ${websiteHost(website)}`, website);
}

export function createScrapeStepLogLine(
  message: string,
  detail?: string,
): AutopilotLogLine {
  return createLogLine("run", "discover", message, detail);
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
  options?: { scrapeOnly?: boolean; demoPrep?: boolean },
): AutopilotLogLine[] {
  const scrapeOnly = options?.scrapeOnly === true;
  const demoPrep = options?.demoPrep === true;
  const lines: AutopilotLogLine[] = [
    createLogLine(
      "run",
      "tick",
      `── Tick #${tickNum} gestart ──`,
      scrapeOnly
        ? "scrape-only"
        : new Date(summary.at).toLocaleString("nl-NL"),
    ),
  ];

  const pipeline = summary.steps.pipeline as
    | {
        draftConcepts?: number;
        sendReady?: number;
        skipped?: boolean;
        reason?: string;
        advanced?: boolean;
        to?: string | null;
        completed?: boolean;
      }
    | undefined;
  if (pipeline?.advanced) {
    lines.push(
      createLogLine(
        "ok",
        "pipeline",
        pipeline.completed
          ? "Pipeline voltooid"
          : `Door naar ${pipeline.to ?? "volgende verticale"}`,
        pipeline.reason === "scrape_exhausted"
          ? "Geen nieuwe leads meer in deze verticale"
          : pipeline.reason === "email_goal"
            ? "E-maildoel bereikt"
            : undefined,
      ),
    );
  } else if (pipeline?.skipped && scrapeOnly) {
    lines.push(
      createLogLine("info", "pipeline", "Mail/follow-up overgeslagen (scrape-modus)"),
    );
  } else if (pipeline && !pipeline.skipped) {
    lines.push(
      createLogLine(
        "info",
        "pipeline",
        `Pipeline: ${pipeline.sendReady ?? 0} verzendklaar · ${pipeline.draftConcepts ?? 0} concepten`,
      ),
    );
  }

  if (demoPrep) {
    const probe = summary.steps.demoProbe as
      | { probed?: number; newlyDemoReady?: number; demoReadyTotal?: number }
      | undefined;
    const gen = summary.steps.demoGenerate as
      | { generated?: number; homepages?: number }
      | undefined;
    if (probe) {
      lines.push(
        createLogLine(
          "ok",
          "demo-probe",
          `Geanalyseerd: ${probe.probed ?? 0} · +${probe.newlyDemoReady ?? 0} nieuw demo-klaar`,
          `Totaal demo-klaar: ${probe.demoReadyTotal ?? 0}`,
        ),
      );
    }
    if (gen) {
      lines.push(
        createLogLine(
          "ok",
          "demo-build",
          `Demos gebouwd: ${gen.generated ?? 0} · homepages: ${gen.homepages ?? 0}`,
        ),
      );
    }
  } else if (scrapeOnly) {
    // Geen inbox/mail/sequence samenvatting in scrape-modus
  } else {
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
  } else if (scrape?.discoveryInProgress) {
    lines.push(
      createLogLine(
        "info",
        "discover",
        `Discovery ${scrape.province}: queries ${scrape.queriesDone ?? "?"}/${scrape.queriesTotal ?? "?"}`,
        `Queue ${scrape.queueSize ?? 0} · +${scrape.urlsAddedThisBatch ?? 0} URLs deze tick · volgende tick gaat door`,
      ),
    );
  } else if (scrape) {
    lines.push(
      createLogLine(
        scrape.batchAdded ? "ok" : "info",
        "scrape",
        `Browser scrape (${scrape.province}): +${scrape.batchAdded ?? 0} leads · ${scrape.remaining ?? 0} in queue`,
        scrape.done
          ? "Provincie afgerond"
          : `Queries ${scrape.queriesDone ?? "?"}/${scrape.queriesTotal ?? "?"} · queue ${scrape.queueSize ?? scrape.remaining ?? 0}`,
      ),
    );
  }

  for (const err of summary.errors) {
    if (String(err).startsWith("BROWSER_DISCOVERY_IN_PROGRESS")) continue;
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
