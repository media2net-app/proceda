import { loadDemoReadyAudit } from "@/lib/bedrijven/demo-ready-audit";
import { DEFAULT_BRANCH } from "@/lib/bedrijven/branches";
import { normalizeEmail } from "@/lib/bedrijven/contact-utils";
import { loadAllBusinesses } from "@/lib/bedrijven/load-all-businesses";
import { demoAppPublicPath, demoHomepagePublicPath } from "@/lib/bedrijven/demo-slug";
import { businessIdToDemoSlug } from "@/lib/bedrijven/demo-slug";
import type { Bedrijf } from "@/lib/bedrijven/types";
import {
  buildMakelaarDemoProposalDraft,
  buildMinimalReportForMail,
} from "./demo-outreach-draft";
import { resolveAppBaseUrl } from "./mail-campaign";
import { buildDemoBookingUrl, buildMailHtml } from "./templates";
import {
  dashboardScreenshotExists,
  demoDashboardScreenshotAbsoluteUrl,
} from "@/lib/demo-app/dashboard-email-screenshot";
import { ensureMailRecord } from "./storage";
import type { BusinessReport } from "@/lib/bedrijven/business-report-types";
import type { MailOutreachRecord } from "./types";

export async function resolveOutreachMailForBusiness(
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
} | null> {
  const audit = await loadDemoReadyAudit();
  const auditRow = audit?.results.find(
    (r) => r.businessId === businessId && r.demoReady,
  );
  if (!auditRow) return null;

  const businesses = await loadAllBusinesses(DEFAULT_BRANCH);
  const stored = businesses.find((b) => b.id === businessId);
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
        branchId: DEFAULT_BRANCH,
      };

  const email =
    normalizeEmail(recipientOverride) ??
    normalizeEmail(stored?.email) ??
    normalizeEmail(business.email);
  if (!email) return null;
  business.email = email;

  const displayName = businessNameOverride?.trim() || business.name;
  business.name = displayName;

  const demoSlug = businessIdToDemoSlug(businessId);
  const draft = buildMakelaarDemoProposalDraft(displayName);
  const report = buildMinimalReportForMail({
    business,
    proposalEmailDraft: draft,
    demoAppUrl: demoAppPublicPath(demoSlug, locale),
    demoHomepageUrl: demoHomepagePublicPath(demoSlug, locale),
  });

  const record = await ensureMailRecord(businessId, email);
  const demoUrl = buildDemoBookingUrl(
    resolveAppBaseUrl(request),
    locale,
    record.token,
  );

  const base = resolveAppBaseUrl(request);
  const hasScreenshot = await dashboardScreenshotExists(demoSlug);
  const dashboardScreenshotUrl = hasScreenshot
    ? demoDashboardScreenshotAbsoluteUrl(base, demoSlug)
    : null;

  const { subject, plainBody, htmlBody } = buildMailHtml({
    business,
    report,
    demoUrl,
    locale,
    baseUrl: base,
    dashboardScreenshotUrl,
  });

  return { business, report, subject, plainBody, htmlBody, demoUrl, record };
}
