import { loadDemoReadyAudit } from "@/lib/bedrijven/demo-ready-audit";
import {
  DEFAULT_BRANCH,
  type ScrapeBranchId,
} from "@/lib/bedrijven/branches";
import { normalizeEmail } from "@/lib/bedrijven/contact-utils";
import {
  findBusinessById,
  loadAllBusinesses,
} from "@/lib/bedrijven/load-all-businesses";
import {
  businessIdToDemoSlug,
  demoAppPublicPath,
  demoHomepagePublicPath,
} from "@/lib/bedrijven/demo-slug";
import type { Bedrijf } from "@/lib/bedrijven/types";
import { buildFollowUpProposalDraft } from "./demo-outreach-followup-draft";
import { buildMinimalReportForMail } from "./demo-outreach-draft";
import { buildFollowupMailPreviewForLead } from "./followup-mail-preview";
import { resolveAppBaseUrl } from "./app-url";
import type { MailAttachment } from "./smtp-client";
import {
  dashboardScreenshotCidSrc,
  dashboardScreenshotExists,
  demoDashboardScreenshotAbsoluteUrl,
  readDashboardScreenshotAttachment,
} from "@/lib/demo-app/dashboard-email-screenshot";
import { getRecordByBusinessId } from "./storage";
import type { BusinessReport } from "@/lib/bedrijven/business-report-types";
import type { MailOutreachRecord } from "./types";

export async function resolveFollowupMailForBusiness(
  businessId: string,
  locale: string,
  request?: Request,
  recipientOverride?: string,
  businessNameOverride?: string,
): Promise<{
  business: Bedrijf;
  report: BusinessReport;
  subject: string;
  plainBody: string;
  htmlBody: string;
  demoUrl: string;
  record: MailOutreachRecord;
  attachments?: MailAttachment[];
} | null> {
  const record = await getRecordByBusinessId(businessId);
  if (!record || record.status !== "sent" || record.followupSentAt) {
    return null;
  }

  const storedFirst = await findBusinessById(businessId);
  const branchId: ScrapeBranchId =
    storedFirst?.branchId ?? DEFAULT_BRANCH;

  const audit = await loadDemoReadyAudit(branchId);
  const auditRow = audit?.results.find(
    (r) => r.businessId === businessId && r.demoReady,
  );
  if (!auditRow) return null;

  const businesses = await loadAllBusinesses(branchId);
  const stored = businesses.find((b) => b.id === businessId) ?? storedFirst;
  const business: Bedrijf = stored
    ? { ...stored, website: stored.website || auditRow.website }
    : {
        id: auditRow.businessId,
        name: auditRow.name,
        website: auditRow.website,
        email: recipientOverride,
        address: "",
        city: "",
        province: "",
        category: "services",
        subcategory: "real_estate_agency",
        placeId: auditRow.businessId,
        source: "google",
        branchId,
      };

  const email =
    normalizeEmail(recipientOverride) ??
    normalizeEmail(record.recipientEmail) ??
    normalizeEmail(stored?.email);
  if (!email) return null;
  business.email = email;

  const displayName = businessNameOverride?.trim() || business.name;
  business.name = displayName;

  const demoSlug = businessIdToDemoSlug(businessId);
  const base = resolveAppBaseUrl(request);
  const hasScreenshot = await dashboardScreenshotExists(demoSlug);
  const screenshotAttachment = hasScreenshot
    ? await readDashboardScreenshotAttachment(demoSlug)
    : null;
  const dashboardScreenshotUrl = screenshotAttachment
    ? dashboardScreenshotCidSrc()
    : hasScreenshot
      ? demoDashboardScreenshotAbsoluteUrl(base, demoSlug)
      : null;

  const draft = buildFollowUpProposalDraft(displayName);
  const report = buildMinimalReportForMail({
    business,
    proposalEmailDraft: draft,
    demoAppUrl: demoAppPublicPath(demoSlug, locale),
    demoHomepageUrl: demoHomepagePublicPath(demoSlug, locale),
  });

  const { subject, plainBody, htmlBody, demoUrl } =
    buildFollowupMailPreviewForLead({
      business,
      token: record.token,
      locale,
      baseUrl: base,
      dashboardScreenshotUrl,
    });

  return {
    business,
    report,
    subject,
    plainBody,
    htmlBody,
    demoUrl,
    record,
    attachments: screenshotAttachment ? [screenshotAttachment] : undefined,
  };
}
