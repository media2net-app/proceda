import { loadDemoReadyAudit } from "@/lib/bedrijven/demo-ready-audit";
import { normalizeEmail, isLikelyGuessedEmail } from "@/lib/bedrijven/contact-utils";
import { loadAllBusinesses } from "@/lib/bedrijven/load-all-businesses";
import {
  DEFAULT_BRANCH,
  type ScrapeBranchId,
} from "@/lib/bedrijven/branches";
import { businessIdToSlug } from "@/lib/bedrijven/slug";
import {
  businessIdToDemoSlug,
  demoAppPublicPath,
  demoHomepagePublicPath,
} from "@/lib/bedrijven/demo-slug";
import {
  getDemoBrandEntry,
  refreshDemoBrandCache,
} from "@/lib/demo-homepage/demo-brand-registry";
import {
  dashboardScreenshotExists,
  demoDashboardScreenshotAbsoluteUrl,
} from "@/lib/demo-app/dashboard-email-screenshot";
import type { Bedrijf } from "@/lib/bedrijven/types";
import type { DemoReadyAuditRow } from "@/lib/bedrijven/demo-ready-audit";
import { buildMinimalReportForMail } from "./demo-outreach-draft";
import { buildFollowupMailPreviewForLead } from "./followup-mail-preview";
import {
  buildOutreachMailSubject,
  buildOutreachProposalDraft,
  defaultOutreachSubcategory,
} from "./outreach-draft";
import { buildDemoBookingUrl, buildMailHtml } from "./templates";
import { buildOutreachUtmParams } from "./outreach-utm";
import { buildSendBatchId } from "./send-batch";
import { loadDemoClickStatsByTokens } from "./demo-click-stats";
import { ensureMailRecordsBatch, listMailRecords } from "./storage";
import type { MailTemplatePreview } from "./types";
import { resolveAppBaseUrl } from "./app-url";

function businessFromAuditRow(
  row: DemoReadyAuditRow,
  branchId: ScrapeBranchId,
): Bedrijf {
  return {
    id: row.businessId,
    name: row.name,
    website: row.website,
    address: "",
    city: "",
    province: "",
    category: "services",
    subcategory: defaultOutreachSubcategory(branchId),
    placeId: row.businessId,
    source: "google",
    branchId,
  };
}

export async function listDemoOutreachTemplates(
  locale: string,
  request?: Request,
  branchId: ScrapeBranchId = DEFAULT_BRANCH,
): Promise<MailTemplatePreview[]> {
  const audit = await loadDemoReadyAudit(branchId);
  if (!audit) return [];

  await refreshDemoBrandCache(branchId);

  const businesses = await loadAllBusinesses(branchId);
  const byId = new Map(businesses.map((b) => [b.id, b]));
  const records = await listMailRecords();
  const recordByBiz = new Map(records.map((r) => [r.businessId, r]));
  const baseUrl = resolveAppBaseUrl(request);

  const targets = audit.results.filter((r) => r.demoReady);
  const prepared: {
    row: DemoReadyAuditRow;
    business: Bedrijf;
    email: string;
  }[] = [];

  for (const row of targets) {
    const stored = byId.get(row.businessId);
    const business: Bedrijf = stored
      ? { ...stored, website: stored.website || row.website }
      : businessFromAuditRow(row, branchId);

    const email = normalizeEmail(stored?.email);
    if (!email) continue;
    business.email = email;
    prepared.push({ row, business, email });
  }

  const missingRecords = prepared.filter(
    (p) => !recordByBiz.has(p.business.id),
  );
  if (missingRecords.length > 0) {
    const batch = await ensureMailRecordsBatch(
      missingRecords.map((p) => ({
        businessId: p.business.id,
        recipientEmail: p.email,
      })),
    );
    for (const [id, rec] of batch) recordByBiz.set(id, rec);
  }

  const out: MailTemplatePreview[] = [];

  for (const { row, business, email } of prepared) {
    const demoSlug = businessIdToDemoSlug(row.businessId);
    const brand = getDemoBrandEntry(demoSlug);
    const demoAppPath = demoAppPublicPath(demoSlug, locale);
    const demoHomePath = demoHomepagePublicPath(demoSlug, locale);
    const draft = buildOutreachProposalDraft(branchId, business.name);

    const report = buildMinimalReportForMail({
      business,
      proposalEmailDraft: draft,
      demoAppUrl: demoAppPath,
      demoHomepageUrl: demoHomePath,
    });

    const record = recordByBiz.get(business.id)!;
    const sendBatchPreview = buildSendBatchId(branchId);
    const utm = buildOutreachUtmParams({
      branchId,
      sendBatch: sendBatchPreview,
      mailKind: "initial",
    });
    const demoUrl = buildDemoBookingUrl(baseUrl, locale, record.token, utm);
    const hasScreenshot = await dashboardScreenshotExists(demoSlug);
    const dashboardScreenshotUrl = hasScreenshot
      ? demoDashboardScreenshotAbsoluteUrl(baseUrl, demoSlug)
      : null;

    const mailBuilt = buildMailHtml({
      business,
      report,
      demoUrl,
      locale,
      baseUrl,
      dashboardScreenshotUrl,
    });
    const subject = buildOutreachMailSubject(branchId, business.name);
    const { plainBody, htmlBody } = mailBuilt;

    out.push({
      businessId: business.id,
      slug: businessIdToSlug(business.id),
      businessName: business.name,
      city: business.city || "—",
      email,
      leadQuality: report.leadQuality,
      overallScore: report.overallScore,
      subject,
      plainBody,
      htmlBody,
      demoUrl,
      demoAppUrl: demoAppPath,
      dashboardScreenshotUrl,
      logoPath: brand?.logoPath ?? null,
      source: "demo",
      token: record.token,
      status: record.status,
      sentAt: record.sentAt,
      followupSentAt: record.followupSentAt,
      sendBatch: record.sendBatch,
      pipelineStatus: record.pipelineStatus,
      emailGuessed: isLikelyGuessedEmail(email, business.website),
    });
  }

  out.sort((a, b) => a.businessName.localeCompare(b.businessName, "nl"));

  const clickByToken = await loadDemoClickStatsByTokens(
    out.map((row) => row.token),
  );
  for (const row of out) {
    const clicks = clickByToken.get(row.token);
    if (!clicks) continue;
    row.demoVisited = true;
    row.demoClickCount = clicks.clickCount;
    row.demoSessionCount = clicks.sessionCount;
    row.demoFirstClickAt = clicks.firstClickedAt ?? undefined;
    row.demoLastClickAt = clicks.lastClickedAt ?? undefined;
  }

  for (const row of out) {
    if (row.status !== "sent" || row.followupSentAt || !row.demoVisited) continue;
    const prep = prepared.find((p) => p.business.id === row.businessId);
    if (!prep) continue;
    const record = recordByBiz.get(row.businessId)!;
    const demoSlug = businessIdToDemoSlug(row.businessId);
    const hasScreenshot = await dashboardScreenshotExists(demoSlug);
    const dashboardScreenshotUrl = hasScreenshot
      ? demoDashboardScreenshotAbsoluteUrl(baseUrl, demoSlug)
      : null;
    const followup = buildFollowupMailPreviewForLead({
      business: prep.business,
      token: record.token,
      locale,
      baseUrl,
      dashboardScreenshotUrl,
    });
    row.followupSubject = followup.subject;
    row.followupPlainBody = followup.plainBody;
    row.followupHtmlBody = followup.htmlBody;
    row.mailVariant = "followup";
  }

  return out;
}
