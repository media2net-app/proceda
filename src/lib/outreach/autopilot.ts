import "server-only";

import type { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/db/prisma";
import {
  DEFAULT_PROVINCE,
  PROVINCE_IDS,
  type ProvinceId,
} from "@/lib/bedrijven/provinces";
import {
  isOutreachBranchId,
  scrapeBranchFromOutreach,
  type OutreachBranchId,
} from "@/lib/bedrijven/outreach-branches";
import type { ScrapeBranchId } from "@/lib/bedrijven/branches";
import { scrapeBedrijvenBatch } from "@/lib/bedrijven/scraper";
import {
  isBranchBrowserScrapeExhausted,
  resetBranchBrowserScrapeProgress,
} from "@/lib/bedrijven/browser-lead-scraper";
import { firstPipelineBranchBelowGoal } from "@/lib/bedrijven/autopilot-pipeline-branches";
import { isMailConfigured } from "@/lib/mail/email-config";
import { fetchInboxMessages, verifyImapConnection } from "@/lib/mail/imap-client";
import { inboxStats, saveInboxCache } from "@/lib/mail/inbox-storage";
import { runBatchOutreachSend } from "@/lib/mail/batch-send-outreach";
import { listDemoOutreachTemplates } from "@/lib/mail/list-demo-outreach";
import { runDueOutreachSequences } from "@/lib/mail/outreach-sequence";
import { resolveFollowupMailForBusiness } from "@/lib/mail/resolve-followup-mail";
import { sendOutreachEmail } from "@/lib/mail/smtp-client";
import {
  assertMailFollowupEligible,
  markMailFollowupSent,
} from "@/lib/mail/storage";
import { getMailHealthReport } from "@/lib/mail/mail-health";
import { syncBouncesFromInbox } from "@/lib/mail/sync-bounces-from-inbox";
import { sendDueAppointmentReminders } from "@/lib/mail/send-booking-reminder";
import { getOutreachActionQueue } from "@/lib/outreach/outreach-action-queue";
import { logOutreachAudit } from "@/lib/outreach/outreach-audit";
import {
  assessOutreachSendReadiness,
  countSendReadyDrafts,
} from "@/lib/outreach/outreach-send-readiness";
import { ADMIN_VERTICAL_LEAD_TARGET } from "@/lib/admin/vertical-summary-types";
import {
  advanceAutopilotPipelineIfGoalMet,
  advanceAutopilotPipelineIfScrapeExhausted,
  countBranchLeadsWithEmail,
  countPipelineEmailTotals,
  resolvePipelineStartBranch,
} from "@/lib/outreach/autopilot-pipeline";
import {
  appendAutopilotLog,
  createLogLine,
  createScrapeLeadLogLine,
  createScrapeLeadScanLogLine,
  formatTickSummaryToLog,
  parseActivityLog,
} from "@/lib/outreach/autopilot-log";

export type { AutopilotLogLine, AutopilotLogLevel } from "@/lib/outreach/autopilot-log";

/** Alleen leads die het volledige outreach-proces doorlopen hebben tellen mee. */
const MIN_SEND_READY_BEFORE_SCRAPE = 8;
const BATCH_SEND_PER_TICK = 5;
const FOLLOWUPS_PER_TICK = 3;

export const AUTOPILOT_MODES = ["full", "scrape_only"] as const;
export type AutopilotMode = (typeof AUTOPILOT_MODES)[number];

export function parseAutopilotMode(raw: string | null | undefined): AutopilotMode {
  if (raw === "scrape_only" || raw === "demo_prep") return "scrape_only";
  return "full";
}

export type AutopilotPublicState = {
  branchId: OutreachBranchId;
  active: boolean;
  mode: AutopilotMode;
  startedAt: string | null;
  stoppedAt: string | null;
  lastTickAt: string | null;
  lastTickSummary: AutopilotTickSummary | null;
  scrapeProvinceId: string | null;
  ticksTotal: number;
  draftCount: number;
  mailConfigured: boolean;
  activityLog: import("@/lib/outreach/autopilot-log").AutopilotLogLine[];
  tickInProgress: boolean;
};

export type AutopilotTickSummary = {
  at: string;
  draftCount: number;
  steps: Record<string, unknown>;
  errors: string[];
};

function nextProvinceId(current: string | null | undefined): ProvinceId {
  if (!current) return DEFAULT_PROVINCE;
  const idx = PROVINCE_IDS.indexOf(current as ProvinceId);
  if (idx < 0) return DEFAULT_PROVINCE;
  return PROVINCE_IDS[(idx + 1) % PROVINCE_IDS.length]!;
}

async function ensureRow(branchId: OutreachBranchId) {
  return prisma.outreachAutopilot.upsert({
    where: { branchId },
    create: { branchId, active: false },
    update: {},
  });
}

const STALE_TICK_MS = 4 * 60_000;

const AUTOPILOT_ROW_SELECT = {
  active: true,
  mode: true,
  startedAt: true,
  stoppedAt: true,
  lastTickAt: true,
  scrapeProvinceId: true,
  ticksTotal: true,
  activityLog: true,
  tickInProgress: true,
} as const;

/** Na crash/timeout blijft tickInProgress soms hangen — dan starten clients geen nieuwe ticks. */
async function recoverStaleTickInProgress(branchId: OutreachBranchId) {
  const row = await prisma.outreachAutopilot.findUnique({ where: { branchId } });
  if (!row?.tickInProgress) return;
  const ref = row.lastTickAt ?? row.updatedAt;
  if (Date.now() - ref.getTime() < STALE_TICK_MS) return;
  await prisma.outreachAutopilot.update({
    where: { branchId },
    data: { tickInProgress: false },
  });
  await appendAutopilotLog(branchId, [
    createLogLine(
      "warn",
      "system",
      "Vastgelopen tick gereset",
      "tickInProgress stond nog aan na timeout — autopilot gaat verder",
    ),
  ]);
}

export async function getAutopilotState(
  branchId: OutreachBranchId,
  locale = "nl",
): Promise<AutopilotPublicState> {
  await recoverStaleTickInProgress(branchId);
  await ensureRow(branchId);
  const row = await prisma.outreachAutopilot.findUniqueOrThrow({
    where: { branchId },
    select: AUTOPILOT_ROW_SELECT,
  });
  const scrapeBranch = scrapeBranchFromOutreach(branchId);
  const mode = parseAutopilotMode(row.mode);
  const skipDraftListing = mode === "scrape_only";
  const draftCount = skipDraftListing
    ? 0
    : (
        await listDemoOutreachTemplates(locale, undefined, scrapeBranch)
      ).filter((p) => p.status === "draft" && p.email?.trim()).length;

  return {
    branchId,
    active: row.active,
    mode,
    startedAt: row.startedAt?.toISOString() ?? null,
    stoppedAt: row.stoppedAt?.toISOString() ?? null,
    lastTickAt: row.lastTickAt?.toISOString() ?? null,
    lastTickSummary: null,
    scrapeProvinceId: row.scrapeProvinceId,
    ticksTotal: row.ticksTotal,
    draftCount,
    mailConfigured: isMailConfigured(),
    activityLog: parseActivityLog(row.activityLog),
    tickInProgress: row.tickInProgress ?? false,
  };
}

export async function startAutopilot(
  branchId: OutreachBranchId,
  mode: AutopilotMode = "full",
  options?: { fresh?: boolean },
) {
  if (mode === "full" && !isMailConfigured()) {
    throw new Error("MAIL_NOT_CONFIGURED");
  }

  const fresh = options?.fresh ?? false;
  const targetBranch =
    mode === "scrape_only"
      ? await resolvePipelineStartBranch(branchId)
      : branchId;
  const now = new Date();
  const scrapeOnly = mode === "scrape_only";

  const actives = await listActiveAutopilotBranches();
  for (const activeId of actives) {
    if (activeId !== targetBranch) {
      await stopAutopilot(activeId, { quiet: true });
    }
  }

  const existing = await ensureRow(targetBranch);
  const startedAt = fresh ? now : (existing.startedAt ?? now);

  await prisma.outreachAutopilot.upsert({
    where: { branchId: targetBranch },
    create: {
      branchId: targetBranch,
      active: true,
      mode,
      startedAt: now,
      stoppedAt: null,
      scrapeProvinceId: DEFAULT_PROVINCE,
      activityLog: [],
      tickInProgress: false,
    },
    update: {
      active: true,
      mode,
      startedAt,
      stoppedAt: null,
      tickInProgress: false,
      ...(fresh
        ? {
            scrapeProvinceId: DEFAULT_PROVINCE,
            activityLog: [],
          }
        : {}),
    },
  });

  const pipelineNote =
    targetBranch !== branchId
      ? `Pipeline: gestart op ${targetBranch} (eerste verticale onder doel)`
      : undefined;

  await appendAutopilotLog(targetBranch, [
    createLogLine(
      "ok",
      "system",
      "Autopilot gestart",
      `Verticale: ${targetBranch} · ${now.toLocaleString("nl-NL")}`,
    ),
    createLogLine(
      "info",
      "system",
      scrapeOnly
        ? "Modus: scrape leads (bedrijfsnaam + e-mail) · turbo batch · parallel ×8"
        : "Modus: volledig (inbox, mail, follow-up + scrape)",
    ),
    ...(pipelineNote
      ? [createLogLine("info", "pipeline", pipelineNote)]
      : []),
  ]);
  void logOutreachAudit({
    action: "autopilot_start",
    branchId: targetBranch,
    metadata: { at: now.toISOString(), mode, requestedBranch: branchId },
  }).catch(() => {});
  return getAutopilotState(targetBranch);
}

/** Hervat scrape-pipeline op server (cron) zonder voortgang te wissen. */
export async function ensurePipelineAutopilotRunning(): Promise<{
  resumed: boolean;
  branchId?: OutreachBranchId;
  completed?: boolean;
}> {
  const actives = await listActiveAutopilotBranches();
  if (actives.length > 0) {
    return { resumed: false, branchId: actives[0] };
  }

  const counts = await countPipelineEmailTotals();
  const next = firstPipelineBranchBelowGoal(counts);
  if (!next) {
    return { resumed: false, completed: true };
  }

  await startAutopilot(next, "scrape_only");
  await appendAutopilotLog(next, [
    createLogLine(
      "ok",
      "system",
      "Autopilot hervat via server-cron",
      "Dashboard niet nodig · scrape gaat door tot e-maildoel",
    ),
  ]);
  return { resumed: true, branchId: next };
}

/** Wissel actieve autopilot naar geselecteerde verticale (behoud modus + log). */
export async function switchAutopilotBranch(
  branchId: OutreachBranchId,
  modeHint?: AutopilotMode,
  locale = "nl",
): Promise<AutopilotPublicState> {
  const actives = await listActiveAutopilotBranches();
  let mode = modeHint;
  if (!mode && actives.length > 0) {
    const current = await prisma.outreachAutopilot.findUnique({
      where: { branchId: actives[0]! },
      select: { mode: true },
    });
    mode = parseAutopilotMode(current?.mode);
  }
  mode = mode ?? "scrape_only";

  for (const activeId of actives) {
    if (activeId !== branchId) {
      await stopAutopilot(activeId, { quiet: true });
    }
  }

  const existing = await ensureRow(branchId);
  const now = new Date();
  const keepStartedAt = existing.active && existing.startedAt;

  await prisma.outreachAutopilot.update({
    where: { branchId },
    data: {
      active: true,
      mode,
      startedAt: keepStartedAt ? existing.startedAt : now,
      stoppedAt: null,
      tickInProgress: false,
    },
  });

  await appendAutopilotLog(branchId, [
    createLogLine(
      "info",
      "system",
      `Autopilot actief op ${branchId}`,
      `Modus: ${mode} · verticale geselecteerd in dashboard`,
    ),
  ]);

  void logOutreachAudit({
    action: "autopilot_switch",
    branchId,
    metadata: { at: now.toISOString(), mode },
  }).catch(() => {});

  return getAutopilotState(branchId, locale);
}

export async function stopAutopilot(
  branchId: OutreachBranchId,
  options?: { quiet?: boolean },
) {
  const now = new Date();
  if (!options?.quiet) {
    await appendAutopilotLog(branchId, [
      createLogLine("warn", "system", "Autopilot gestopt", now.toLocaleString("nl-NL")),
    ]);
  }
  await prisma.outreachAutopilot.update({
    where: { branchId },
    data: { active: false, stoppedAt: now, tickInProgress: false },
  });
  void logOutreachAudit({
    action: "autopilot_stop",
    branchId,
    metadata: { at: now.toISOString() },
  }).catch(() => {});
  return getAutopilotState(branchId);
}

export async function listActiveAutopilotBranches(): Promise<OutreachBranchId[]> {
  const rows = await prisma.outreachAutopilot.findMany({
    where: { active: true },
    select: { branchId: true },
  });
  return rows
    .map((r) => r.branchId)
    .filter((id): id is OutreachBranchId => isOutreachBranchId(id));
}

/** Eerste actieve autopilot (max. één tijdens pipeline). */
export async function getActiveAutopilotState(
  locale = "nl",
): Promise<AutopilotPublicState | null> {
  const active = await listActiveAutopilotBranches();
  if (active.length === 0) return null;
  return getAutopilotState(active[0]!, locale);
}

async function runInboxSync(): Promise<Record<string, unknown>> {
  if (!isMailConfigured()) {
    return { skipped: true, reason: "MAIL_NOT_CONFIGURED" };
  }
  await verifyImapConnection();
  const messages = await fetchInboxMessages(50);
  await saveInboxCache(messages, { accountOk: true, lastSyncError: null });
  const bounceSync = await syncBouncesFromInbox();
  return {
    synced: true,
    unread: inboxStats(messages).unread,
    bounceSync,
  };
}

async function runAutopilotFollowups(
  branchId: OutreachBranchId,
  locale: string,
  limit: number,
): Promise<{ sent: number; failed: number; items: { businessId: string; status: string }[] }> {
  if (!isMailConfigured()) {
    return { sent: 0, failed: 0, items: [] };
  }

  const queue = await getOutreachActionQueue(branchId, locale);
  const followups = queue.items.filter((i) => i.type === "followup").slice(0, limit);
  const items: { businessId: string; status: string }[] = [];
  let sent = 0;
  let failed = 0;

  for (const item of followups) {
    try {
      await assertMailFollowupEligible(item.businessId);
      const readiness = await assessOutreachSendReadiness(
        item.businessId,
        branchId,
        "followup",
      );
      if (!readiness.ready) {
        items.push({
          businessId: item.businessId,
          status: readiness.blockers[0] ?? "not_send_ready",
        });
        continue;
      }
      const resolved = await resolveFollowupMailForBusiness(
        item.businessId,
        locale,
        undefined,
        item.email,
        item.businessName,
      );
      if (!resolved) {
        items.push({ businessId: item.businessId, status: "skipped" });
        continue;
      }
      await sendOutreachEmail({
        to: resolved.business.email!.trim(),
        subject: resolved.subject,
        text: resolved.plainBody,
        html: resolved.htmlBody,
        attachments: resolved.attachments,
      });
      await markMailFollowupSent(item.businessId);
      sent++;
      items.push({ businessId: item.businessId, status: "sent" });
    } catch (e) {
      failed++;
      items.push({
        businessId: item.businessId,
        status: e instanceof Error ? e.message : "failed",
      });
    }
  }

  return { sent, failed, items };
}

export async function runAutopilotTick(
  branchId: OutreachBranchId,
  locale = "nl",
): Promise<AutopilotTickSummary> {
  await recoverStaleTickInProgress(branchId);
  const row = await ensureRow(branchId);
  if (!row.active) {
    throw new Error("AUTOPILOT_NOT_ACTIVE");
  }
  if (row.tickInProgress) {
    throw new Error("AUTOPILOT_TICK_IN_PROGRESS");
  }

  const scrapeBranch = scrapeBranchFromOutreach(branchId);
  const tickNum = row.ticksTotal + 1;
  const mode = parseAutopilotMode(row.mode);
  const scrapeOnly = mode === "scrape_only";

  await prisma.outreachAutopilot.update({
    where: { branchId },
    data: { tickInProgress: true },
  });

  const pipelineHandlers = {
    stop: stopAutopilot,
    start: startAutopilot,
  };

  try {
  const summary: AutopilotTickSummary = {
    at: new Date().toISOString(),
    draftCount: 0,
    steps: { mode },
    errors: [],
  };

  const emailCountAtStart = await countBranchLeadsWithEmail(branchId);
  summary.steps.leadEmailCount = emailCountAtStart;
  if (emailCountAtStart >= ADMIN_VERTICAL_LEAD_TARGET) {
    const advance = await advanceAutopilotPipelineIfGoalMet(
      branchId,
      mode,
      pipelineHandlers,
    );
    summary.steps.pipeline = advance;
    const tickLog = formatTickSummaryToLog(summary, tickNum, { scrapeOnly });
    await appendAutopilotLog(branchId, tickLog);
    await prisma.outreachAutopilot.update({
      where: { branchId },
      data: {
        lastTickAt: new Date(),
        lastTickSummary: summary as unknown as Prisma.InputJsonValue,
        ticksTotal: { increment: 1 },
      },
    });
    return summary;
  }

  let sendReadyCount = 0;
  let draftCount = 0;

  if (scrapeOnly) {
    summary.steps.pipeline = { skipped: true, reason: "SCRAPE_ONLY_MODE" };
  } else {
    const previews = await listDemoOutreachTemplates(locale, undefined, scrapeBranch);
    draftCount = previews.filter(
      (p) => p.status === "draft" && p.email?.trim(),
    ).length;
    sendReadyCount = await countSendReadyDrafts(scrapeBranch, locale);
    summary.draftCount = sendReadyCount;
    summary.steps.pipeline = {
      draftConcepts: draftCount,
      sendReady: sendReadyCount,
    };

    try {
      await appendAutopilotLog(branchId, [
        createLogLine("run", "inbox", "Inbox synchroniseren…"),
      ]);
      summary.steps.inbox = await runInboxSync();
    } catch (e) {
      summary.errors.push(e instanceof Error ? e.message : "inbox_sync_failed");
    }

    if (isMailConfigured()) {
      try {
        await appendAutopilotLog(branchId, [
          createLogLine("run", "reminders", "Boekingsherinneringen controleren…"),
        ]);
        summary.steps.reminders = await sendDueAppointmentReminders(false);
      } catch (e) {
        summary.errors.push(e instanceof Error ? e.message : "reminders_failed");
      }

      try {
        await appendAutopilotLog(branchId, [
          createLogLine("run", "sequences", "Due sequences uitvoeren…"),
        ]);
        summary.steps.sequences = await runDueOutreachSequences(scrapeBranch, locale, false);
      } catch (e) {
        summary.errors.push(e instanceof Error ? e.message : "sequences_failed");
      }

      try {
        await appendAutopilotLog(branchId, [
          createLogLine("run", "followup", "Follow-ups verwerken…"),
        ]);
        summary.steps.followups = await runAutopilotFollowups(
          branchId,
          locale,
          FOLLOWUPS_PER_TICK,
        );
      } catch (e) {
        summary.errors.push(e instanceof Error ? e.message : "followups_failed");
      }

      try {
        await appendAutopilotLog(branchId, [
          createLogLine("run", "mail", "Batch send (verzendklare concepten)…"),
        ]);
        const health = await getMailHealthReport(scrapeBranch);
        if (health.capRemaining > 0 && sendReadyCount > 0) {
          const limit = Math.min(BATCH_SEND_PER_TICK, health.capRemaining);
          summary.steps.batchSend = await runBatchOutreachSend({
            branchId: scrapeBranch,
            locale,
            limit,
            delayMs: 2500,
            maxPerDomain: 2,
            dryRun: false,
            abTest: true,
          });
        } else {
          summary.steps.batchSend = {
            skipped: true,
            reason:
              health.capRemaining <= 0 ? "DAILY_CAP" : "NO_DRAFTS",
          };
        }
      } catch (e) {
        summary.errors.push(e instanceof Error ? e.message : "batch_send_failed");
      }
    }
  }

  const shouldScrape =
    scrapeOnly ||
    (sendReadyCount < MIN_SEND_READY_BEFORE_SCRAPE &&
      emailCountAtStart < ADMIN_VERTICAL_LEAD_TARGET);

  if (shouldScrape) {
    const provinceId = row.scrapeProvinceId ?? DEFAULT_PROVINCE;
    try {
      await appendAutopilotLog(branchId, [
        createLogLine(
          "run",
          "scrape",
          `Browser lead scrape (${provinceId})…`,
          "DuckDuckGo + website e-mail",
        ),
      ]);
      const scrape = await scrapeBedrijvenBatch(scrapeBranch, provinceId as ProvinceId, {
        turbo: scrapeOnly,
        onLeadScan: async (website) => {
          await appendAutopilotLog(branchId, [createScrapeLeadScanLogLine(website)]);
        },
        onLead: async (entry) => {
          await appendAutopilotLog(branchId, [createScrapeLeadLogLine(entry)]);
        },
      });
      summary.steps.scrape = {
        provider: "browser",
        province: provinceId,
        batchAdded: scrape.batchAdded,
        remaining: scrape.remaining,
        done: scrape.done,
        leadLog: scrape.leadLog,
      };
      let nextProvince = provinceId;
      if (scrape.done && scrape.discoveryComplete) {
        nextProvince = nextProvinceId(provinceId);
      }
      await prisma.outreachAutopilot.update({
        where: { branchId },
        data: { scrapeProvinceId: nextProvince },
      });

      if (scrapeOnly) {
        const exhausted = await isBranchBrowserScrapeExhausted(scrapeBranch);
        if (exhausted) {
          const emailCount = await countBranchLeadsWithEmail(branchId);
          if (emailCount < ADMIN_VERTICAL_LEAD_TARGET) {
            const removed = await resetBranchBrowserScrapeProgress(scrapeBranch);
            await prisma.outreachAutopilot.update({
              where: { branchId },
              data: { scrapeProvinceId: DEFAULT_PROVINCE },
            });
            await appendAutopilotLog(branchId, [
              createLogLine(
                "warn",
                "pipeline",
                "Scrape-ronde voltooid — nog onder e-maildoel",
                `${emailCount}/${ADMIN_VERTICAL_LEAD_TARGET} · ${removed} provincie(s) opnieuw · scrape herstart`,
              ),
            ]);
            summary.steps.pipeline = {
              advanced: false,
              recycled: true,
              emailCount,
              provincesReset: removed,
            };
          } else {
            const advance = await advanceAutopilotPipelineIfScrapeExhausted(
              branchId,
              mode,
              pipelineHandlers,
            );
            summary.steps.pipeline = advance;
            const tickLog = formatTickSummaryToLog(summary, tickNum, { scrapeOnly });
            await appendAutopilotLog(branchId, tickLog);
            await prisma.outreachAutopilot.update({
              where: { branchId },
              data: {
                lastTickAt: new Date(),
                lastTickSummary: summary as unknown as Prisma.InputJsonValue,
                ticksTotal: { increment: 1 },
              },
            });
            return summary;
          }
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "scrape_failed";
      if (msg.startsWith("RATE_LIMIT_COOLDOWN")) {
        summary.steps.scrape = { skipped: true, reason: msg };
      } else {
        summary.errors.push(msg);
      }
    }
  } else {
    summary.steps.scrape = {
      skipped: true,
      reason: scrapeOnly
        ? "SCRAPE_DEFERRED"
        : emailCountAtStart >= ADMIN_VERTICAL_LEAD_TARGET
          ? "LEAD_EMAIL_GOAL_REACHED"
          : "ENOUGH_SEND_READY",
      sendReady: sendReadyCount,
      draftConcepts: draftCount,
      leadEmailCount: emailCountAtStart,
    };
  }

  const emailCountAfter = await countBranchLeadsWithEmail(branchId);
  if (emailCountAfter >= ADMIN_VERTICAL_LEAD_TARGET) {
    const advance = await advanceAutopilotPipelineIfGoalMet(
      branchId,
      mode,
      pipelineHandlers,
    );
    summary.steps.pipeline = advance;
  }

  const tickLog = formatTickSummaryToLog(summary, tickNum, { scrapeOnly });
  await appendAutopilotLog(branchId, tickLog);

  await prisma.outreachAutopilot.update({
    where: { branchId },
    data: {
      lastTickAt: new Date(),
      lastTickSummary: summary as unknown as Prisma.InputJsonValue,
      ticksTotal: { increment: 1 },
    },
  });

  void logOutreachAudit({
    action: "autopilot_tick",
    branchId,
    metadata: {
      mode,
      draftCount: summary.draftCount,
      errors: summary.errors,
      sent: (summary.steps.batchSend as { sent?: number })?.sent,
    },
  }).catch(() => {});

  return summary;
  } finally {
    await prisma.outreachAutopilot.update({
      where: { branchId },
      data: { tickInProgress: false },
    }).catch(() => {});
  }
}
