import { demoAppPublicPath, demoHomepagePublicPath } from "@/lib/bedrijven/demo-slug";
import { businessIdToDemoSlug } from "@/lib/bedrijven/demo-slug";
import { normalizeEmail } from "@/lib/bedrijven/contact-utils";
import {
  findBusinessById,
  loadAllBusinesses,
} from "@/lib/bedrijven/load-all-businesses";
import {
  DEFAULT_BRANCH,
  type ScrapeBranchId as BranchId,
} from "@/lib/bedrijven/branches";
import type { Bedrijf } from "@/lib/bedrijven/types";
import { buildMinimalReportForMail } from "./demo-outreach-draft";
import {
  buildOutreachMailSubject,
  buildOutreachProposalDraft,
  defaultOutreachSubcategory,
} from "./outreach-draft";
import { resolveAppBaseUrl } from "./app-url";
import { buildDemoBookingUrl, buildMailHtml } from "./templates";
import { buildOutreachUtmParams } from "./outreach-utm";
import { buildSendBatchId } from "./send-batch";
import type { MailAttachment } from "./smtp-client";
import { ensureMailRecord } from "./storage";
import type { BusinessReport } from "@/lib/bedrijven/business-report-types";
import type { MailOutreachRecord } from "./types";
import type { OutreachSubjectAb } from "./subject-variants";

export async function resolveOutreachMailForBusiness(
  businessId: string,
  locale: string,
  request?: Request,
  recipientOverride?: string,
  businessNameOverride?: string,
  options?: { subjectAb?: OutreachSubjectAb },
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
  const storedFirst = await findBusinessById(businessId);
  const branchId: BranchId = storedFirst?.branchId ?? DEFAULT_BRANCH;

  const businesses = await loadAllBusinesses(branchId);
  const stored = businesses.find((b) => b.id === businessId) ?? storedFirst;
  if (!stored && !recipientOverride) return null;

  const business: Bedrijf = stored
    ? { ...stored, branchId: stored.branchId ?? branchId }
    : {
        id: businessId,
        name: businessNameOverride?.trim() || businessId,
        website: "",
        email: recipientOverride,
        address: "",
        city: "",
        province: "",
        category: "services",
        subcategory: defaultOutreachSubcategory(branchId),
        placeId: businessId,
        source: "google",
        branchId,
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
  const report = buildMinimalReportForMail({
    business,
    proposalEmailDraft: buildOutreachProposalDraft(branchId, displayName),
    demoAppUrl: demoAppPublicPath(demoSlug, locale),
    demoHomepageUrl: demoHomepagePublicPath(demoSlug, locale),
    branchId,
  });

  const record = await ensureMailRecord(businessId, email);
  if (record.status !== "draft") return null;

  const sendBatch = buildSendBatchId(branchId);
  const subjectAb = options?.subjectAb;
  const utm = buildOutreachUtmParams({
    branchId,
    sendBatch,
    subjectVariant: subjectAb ? (subjectAb === "b" ? "B" : "A") : "default",
    mailKind: "initial",
  });
  const demoUrl = buildDemoBookingUrl(
    resolveAppBaseUrl(request),
    locale,
    record.token,
    utm,
  );

  const base = resolveAppBaseUrl(request);

  const mailBuilt = buildMailHtml({
    business,
    report,
    demoUrl,
    locale,
    baseUrl: base,
    dashboardScreenshotUrl: null,
  });
  const subject = buildOutreachMailSubject(
    branchId,
    displayName,
    "initial",
    options?.subjectAb,
  );
  const { plainBody, htmlBody } = mailBuilt;

  return {
    business,
    report,
    subject,
    plainBody,
    htmlBody,
    demoUrl,
    record,
  };
}
