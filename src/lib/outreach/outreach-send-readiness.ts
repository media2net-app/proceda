import "server-only";

import fs from "fs/promises";
import path from "path";
import { prisma } from "@/lib/db/prisma";
import type { ScrapeBranchId } from "@/lib/bedrijven/branches";
import { loadDemoReadyAudit } from "@/lib/bedrijven/demo-ready-audit";
import { loadBusinessReport } from "@/lib/bedrijven/business-report-storage";
import { findBusinessById } from "@/lib/bedrijven/load-all-businesses";
import {
  isLikelyGuessedEmail,
  normalizeEmail,
} from "@/lib/bedrijven/contact-utils";
import { businessIdToDemoSlug } from "@/lib/bedrijven/demo-slug";
import type { ProcedaAiAnalysis } from "@/lib/bedrijven/business-report-types";
import { refreshDemoBrandCache, getDemoBrandEntry } from "@/lib/demo-homepage/demo-brand-registry";
import { dashboardScreenshotExists } from "@/lib/demo-app/dashboard-email-screenshot";

export type OutreachMailKind = "initial" | "followup" | "sequence_nudge";

export type ReadinessCheck = {
  id: string;
  ok: boolean;
  label: string;
};

export type OutreachSendReadiness = {
  ready: boolean;
  businessId: string;
  branchId: ScrapeBranchId;
  kind: OutreachMailKind;
  checks: ReadinessCheck[];
  blockers: string[];
};

const MIN_PROPOSAL_CHARS = 120;

async function logoAssetExists(logoPath: string | null | undefined): Promise<boolean> {
  if (!logoPath?.trim()) return false;
  if (logoPath.startsWith("http://") || logoPath.startsWith("https://")) {
    return true;
  }
  const rel = logoPath.startsWith("/") ? logoPath.slice(1) : logoPath;
  try {
    await fs.access(path.join(process.cwd(), "public", rel));
    return true;
  } catch {
    return false;
  }
}

function proposalFromReport(ai: unknown): string | null {
  if (!ai || typeof ai !== "object") return null;
  const draft = (ai as ProcedaAiAnalysis).proposalEmailDraft;
  return typeof draft === "string" && draft.trim().length >= MIN_PROPOSAL_CHARS
    ? draft.trim()
    : null;
}

export async function assessOutreachSendReadiness(
  businessId: string,
  branchId: ScrapeBranchId,
  kind: OutreachMailKind = "initial",
): Promise<OutreachSendReadiness> {
  await refreshDemoBrandCache(branchId);

  const checks: ReadinessCheck[] = [];
  const blockers: string[] = [];

  const push = (id: string, ok: boolean, label: string, blocker?: string) => {
    checks.push({ id, ok, label });
    if (!ok && blocker) blockers.push(blocker);
  };

  const [business, mailRow, report, audit] = await Promise.all([
    findBusinessById(businessId),
    prisma.mailOutreach.findUnique({ where: { businessId } }),
    loadBusinessReport(businessId),
    loadDemoReadyAudit(branchId),
  ]);

  const auditRow = audit?.results.find((r) => r.businessId === businessId);
  const demoSlug = businessIdToDemoSlug(businessId);
  const brand = getDemoBrandEntry(demoSlug);

  const email =
    normalizeEmail(mailRow?.recipientEmail ?? undefined) ??
    normalizeEmail(business?.email ?? undefined) ??
    undefined;

  if (kind === "initial" || kind === "followup") {
    push(
      "audit_demo_ready",
      !!auditRow?.demoReady,
      "Demo-ready audit",
      "AUDIT_NOT_DEMO_READY",
    );
    push(
      "audit_brand",
      !!(auditRow?.hasLogo && auditRow?.hasColors),
      "Logo + huisstijlkleuren (audit)",
      "AUDIT_BRAND_INCOMPLETE",
    );
    push(
      "demo_brand_logo",
      !!(brand?.logoOk && (await logoAssetExists(brand.logoPath))),
      "Logo in demo-brand registry",
      "LOGO_MISSING",
    );
    push(
      "branch",
      business?.branchId === branchId,
      `Juiste verticale (${branchId})`,
      "WRONG_BRANCH",
    );
    push(
      "email",
      !!email && !isLikelyGuessedEmail(email, business?.website),
      "Geverifieerd e-mailadres (geen geraden info@)",
      "EMAIL_NOT_VERIFIED",
    );
    push(
      "report",
      !!report,
      "Persoonlijk rapport opgeslagen",
      "REPORT_MISSING",
    );
    push(
      "proposal",
      !!report && !!proposalFromReport(report.ai),
      "Persoonlijk voorstel (AI-tekst in rapport)",
      "PROPOSAL_MISSING",
    );
    push(
      "demo_urls",
      !!(report?.demoAppUrl?.trim()),
      "Demo-app URL in rapport",
      "DEMO_APP_MISSING",
    );
    push(
      "dashboard_screenshot",
      await dashboardScreenshotExists(demoSlug),
      "Dashboard-screenshot voor in mail",
      "DASHBOARD_SCREENSHOT_MISSING",
    );
  }

  if (mailRow) {
    push(
      "not_suppressed",
      !mailRow.doNotMail,
      "Niet op suppressielijst",
      "DO_NOT_MAIL",
    );
  }

  if (kind === "initial") {
    push(
      "mail_draft",
      mailRow?.status === "draft",
      "Mailstatus = concept",
      mailRow ? "ALREADY_SENT" : "MAIL_RECORD_NOT_FOUND",
    );
  }

  if (kind === "followup") {
    push(
      "mail_sent",
      mailRow?.status === "sent" && !!mailRow.sentAt,
      "Eerste mail verstuurd",
      "FOLLOWUP_REQUIRES_SENT",
    );
    push(
      "no_followup_yet",
      !mailRow?.followupSentAt,
      "Nog geen follow-up verstuurd",
      "FOLLOWUP_ALREADY_SENT",
    );
    push(
      "not_booked",
      mailRow?.status !== "booked",
      "Nog niet geboekt",
      "ALREADY_BOOKED",
    );
  }

  if (kind === "sequence_nudge") {
    push(
      "mail_sent",
      mailRow?.status === "sent" && !!mailRow.sentAt,
      "Eerste mail verstuurd",
      "SEQUENCE_REQUIRES_SENT",
    );
    push(
      "not_booked",
      mailRow?.status !== "booked",
      "Nog niet geboekt",
      "ALREADY_BOOKED",
    );
  }

  return {
    ready: blockers.length === 0,
    businessId,
    branchId,
    kind,
    checks,
    blockers,
  };
}

export async function assertOutreachSendReady(
  businessId: string,
  branchId: ScrapeBranchId,
  kind: OutreachMailKind = "initial",
): Promise<OutreachSendReadiness> {
  const result = await assessOutreachSendReadiness(businessId, branchId, kind);
  if (!result.ready) {
    throw new Error(result.blockers[0] ?? "OUTREACH_NOT_READY");
  }
  return result;
}

export async function countSendReadyDrafts(
  branchId: ScrapeBranchId,
  locale: string,
): Promise<number> {
  const { listDemoOutreachTemplates } = await import("@/lib/mail/list-demo-outreach");
  const previews = await listDemoOutreachTemplates(locale, undefined, branchId);
  let n = 0;
  for (const p of previews) {
    if (p.status !== "draft" || !p.email?.trim()) continue;
    const r = await assessOutreachSendReadiness(p.businessId, branchId, "initial");
    if (r.ready) n++;
  }
  return n;
}
