import type { ScrapeBranchId } from "@/lib/bedrijven/branches";
import { demoAppPublicPath, demoHomepagePublicPath } from "@/lib/bedrijven/demo-slug";
import { businessIdToDemoSlug } from "@/lib/bedrijven/demo-slug";
import { businessIdToSlug } from "@/lib/bedrijven/slug";
import { isLikelyGuessedEmail } from "@/lib/bedrijven/contact-utils";
import type { Bedrijf } from "@/lib/bedrijven/types";
import { assessOutreachSendReadiness } from "@/lib/outreach/outreach-send-readiness";
import { buildMinimalReportForMail } from "./demo-outreach-draft";
import { buildFollowupMailPreviewForLead } from "./followup-mail-preview";
import {
  buildOutreachMailSubject,
  buildOutreachProposalDraft,
} from "./outreach-draft";
import { buildDemoBookingUrl, buildMailHtml } from "./templates";
import { buildOutreachUtmParams } from "./outreach-utm";
import { buildSendBatchId } from "./send-batch";
import type { MailOutreachRecord } from "./types";
import type { MailTemplatePreview } from "./types";
import { resolveAppBaseUrl } from "./app-url";

export async function buildDemoOutreachPreview(
  locale: string,
  request: Request | undefined,
  branchId: ScrapeBranchId,
  business: Bedrijf,
  email: string,
  record: MailOutreachRecord,
  options?: { includeFollowup?: boolean },
): Promise<MailTemplatePreview> {
  const baseUrl = resolveAppBaseUrl(request);
  const demoSlug = businessIdToDemoSlug(business.id);
  const demoAppPath = demoAppPublicPath(demoSlug, locale);
  const demoHomePath = demoHomepagePublicPath(demoSlug, locale);
  const draft = buildOutreachProposalDraft(branchId, business.name);

  const report = buildMinimalReportForMail({
    business,
    proposalEmailDraft: draft,
    demoAppUrl: demoAppPath,
    demoHomepageUrl: demoHomePath,
    branchId,
  });

  const sendBatchPreview = buildSendBatchId(branchId);
  const utm = buildOutreachUtmParams({
    branchId,
    sendBatch: sendBatchPreview,
    mailKind: "initial",
  });
  const demoUrl = buildDemoBookingUrl(baseUrl, locale, record.token, utm);

  const mailBuilt = buildMailHtml({
    business,
    report,
    demoUrl,
    locale,
    baseUrl,
    dashboardScreenshotUrl: null,
  });
  const subject = buildOutreachMailSubject(branchId, business.name);

  const readiness = await assessOutreachSendReadiness(
    business.id,
    branchId,
    "initial",
  );

  const preview: MailTemplatePreview = {
    businessId: business.id,
    slug: businessIdToSlug(business.id),
    businessName: business.name,
    city: business.city || "—",
    email,
    leadQuality: report.leadQuality,
    overallScore: report.overallScore,
    subject,
    plainBody: mailBuilt.plainBody,
    htmlBody: mailBuilt.htmlBody,
    demoUrl,
    demoAppUrl: demoAppPath,
    dashboardScreenshotUrl: null,
    logoPath: null,
    source: "outreach",
    token: record.token,
    status: record.status,
    sentAt: record.sentAt,
    followupSentAt: record.followupSentAt,
    sendBatch: record.sendBatch,
    pipelineStatus: record.pipelineStatus,
    emailGuessed: isLikelyGuessedEmail(email, business.website),
    sendReady: readiness.ready,
    sendBlockers: readiness.blockers,
  };

  if (
    options?.includeFollowup &&
    record.status === "sent" &&
    !record.followupSentAt
  ) {
    const followup = buildFollowupMailPreviewForLead({
      business,
      token: record.token,
      locale,
      baseUrl,
      dashboardScreenshotUrl: null,
    });
    preview.followupSubject = followup.subject;
    preview.followupPlainBody = followup.plainBody;
    preview.followupHtmlBody = followup.htmlBody;
    preview.mailVariant = "followup";
  }

  return preview;
}
