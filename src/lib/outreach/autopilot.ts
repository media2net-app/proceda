import "server-only";

import type { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/db/prisma";
import {
  DEFAULT_PROVINCE,
  PROVINCE_IDS,
  type ProvinceId,
} from "@/lib/bedrijven/provinces";
import {
  scrapeBranchFromOutreach,
  type OutreachBranchId,
} from "@/lib/bedrijven/outreach-branches";
import type { ScrapeBranchId } from "@/lib/bedrijven/branches";
import { scrapeBedrijvenBatch } from "@/lib/bedrijven/scraper";
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
import {
  appendAutopilotLog,
  createLogLine,
  formatTickSummaryToLog,
  parseActivityLog,
} from "@/lib/outreach/autopilot-log";

export type { AutopilotLogLine, AutopilotLogLevel } from "@/lib/outreach/autopilot-log";

/** Alleen leads die het volledige outreach-proces doorlopen hebben tellen mee. */
const MIN_SEND_READY_BEFORE_SCRAPE = 8;
const BATCH_SEND_PER_TICK = 5;
const FOLLOWUPS_PER_TICK = 3;

export type AutopilotPublicState = {
  branchId: OutreachBranchId;
  active: boolean;
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

export async function getAutopilotState(
  branchId: OutreachBranchId,
  locale = "nl",
): Promise<AutopilotPublicState> {
  const row = await ensureRow(branchId);
  const scrapeBranch = scrapeBranchFromOutreach(branchId);
  const previews = await listDemoOutreachTemplates(locale, undefined, scrapeBranch);
  const draftCount = previews.filter(
    (p) => p.status === "draft" && p.email?.trim(),
  ).length;

  return {
    branchId,
    active: row.active,
    startedAt: row.startedAt?.toISOString() ?? null,
    stoppedAt: row.stoppedAt?.toISOString() ?? null,
    lastTickAt: row.lastTickAt?.toISOString() ?? null,
    lastTickSummary: (row.lastTickSummary as AutopilotTickSummary | null) ?? null,
    scrapeProvinceId: row.scrapeProvinceId,
    ticksTotal: row.ticksTotal,
    draftCount,
    mailConfigured: isMailConfigured(),
    activityLog: parseActivityLog(row.activityLog),
    tickInProgress: row.tickInProgress ?? false,
  };
}

export async function startAutopilot(branchId: OutreachBranchId) {
  const now = new Date();
  await prisma.outreachAutopilot.upsert({
    where: { branchId },
    create: {
      branchId,
      active: true,
      startedAt: now,
      stoppedAt: null,
      scrapeProvinceId: DEFAULT_PROVINCE,
      activityLog: [],
      tickInProgress: false,
    },
    update: {
      active: true,
      startedAt: now,
      stoppedAt: null,
      scrapeProvinceId: DEFAULT_PROVINCE,
      activityLog: [],
      tickInProgress: false,
    },
  });
  await appendAutopilotLog(branchId, [
    createLogLine(
      "ok",
      "system",
      "Autopilot gestart",
      `Verticale: ${branchId} · ${now.toLocaleString("nl-NL")}`,
    ),
    createLogLine(
      "info",
      "system",
      "Modus: browser-scrape (geen Google API) · send-readiness verplicht",
    ),
  ]);
  void logOutreachAudit({
    action: "autopilot_start",
    branchId,
    metadata: { at: now.toISOString() },
  }).catch(() => {});
  return getAutopilotState(branchId);
}

export async function stopAutopilot(branchId: OutreachBranchId) {
  const now = new Date();
  await appendAutopilotLog(branchId, [
    createLogLine("warn", "system", "Autopilot gestopt", now.toLocaleString("nl-NL")),
  ]);
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
    .filter((id): id is OutreachBranchId => id === "makelaardij" || id === "installatie");
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
  branchId: ScrapeBranchId,
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
  const row = await ensureRow(branchId);
  if (!row.active) {
    throw new Error("AUTOPILOT_NOT_ACTIVE");
  }

  const scrapeBranch = scrapeBranchFromOutreach(branchId);
  const tickNum = row.ticksTotal + 1;

  await prisma.outreachAutopilot.update({
    where: { branchId },
    data: { tickInProgress: true },
  });

  try {
  const summary: AutopilotTickSummary = {
    at: new Date().toISOString(),
    draftCount: 0,
    steps: {},
    errors: [],
  };

  const previews = await listDemoOutreachTemplates(locale, undefined, scrapeBranch);
  const draftCount = previews.filter(
    (p) => p.status === "draft" && p.email?.trim(),
  ).length;
  const sendReadyCount = await countSendReadyDrafts(scrapeBranch, locale);
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
        scrapeBranch,
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

  if (sendReadyCount < MIN_SEND_READY_BEFORE_SCRAPE) {
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
      const scrape = await scrapeBedrijvenBatch(scrapeBranch, provinceId as ProvinceId);
      summary.steps.scrape = {
        provider: "browser",
        province: provinceId,
        batchAdded: scrape.batchAdded,
        remaining: scrape.remaining,
        done: scrape.done,
      };
      let nextProvince = provinceId;
      if (scrape.done && scrape.discoveryComplete) {
        nextProvince = nextProvinceId(provinceId);
      }
      await prisma.outreachAutopilot.update({
        where: { branchId },
        data: { scrapeProvinceId: nextProvince },
      });
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
      reason: "ENOUGH_SEND_READY",
      sendReady: sendReadyCount,
      draftConcepts: draftCount,
    };
  }

  const tickLog = formatTickSummaryToLog(summary, tickNum);
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
