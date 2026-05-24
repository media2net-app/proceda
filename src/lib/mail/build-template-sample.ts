import type { ScrapeBranchId } from "@/lib/bedrijven/branches";
import { defaultOutreachSubcategory } from "./outreach-draft";
import type { Bedrijf } from "@/lib/bedrijven/types";
import { buildMinimalReportForMail } from "./demo-outreach-draft";
import {
  buildBranchFollowUpDraft,
  buildBranchFollowUpSubject,
  buildBranchMailSubject,
  buildBranchProposalDraft,
  OUTREACH_TEMPLATE_SAMPLE_NAME,
} from "./branch-outreach-copy";
import { buildDemoBookingUrl, buildMailHtml } from "./templates";
import { resolveAppBaseUrl } from "./app-url";

export type MailTemplateSampleKind = "initial" | "followup";

export type MailTemplateSample = {
  branchId: ScrapeBranchId;
  kind: MailTemplateSampleKind;
  businessName: string;
  subject: string;
  plainBody: string;
  htmlBody: string;
  proposalDraft: string;
  demoUrl: string;
};

const SAMPLE_BUSINESS_ID = "template-sample-preview";
const SAMPLE_TOKEN = "00000000-0000-4000-8000-000000000001";

function sampleBusiness(branchId: ScrapeBranchId): Bedrijf {
  return {
    id: SAMPLE_BUSINESS_ID,
    name: OUTREACH_TEMPLATE_SAMPLE_NAME,
    website: "https://voorbeeld.nl",
    address: "Voorbeeldstraat 1",
    city: "Amsterdam",
    province: "Noord-Holland",
    category: "services",
    subcategory: defaultOutreachSubcategory(branchId),
    placeId: SAMPLE_BUSINESS_ID,
    source: "template-sample",
    branchId,
    email: "info@voorbeeld.nl",
  };
}

export function buildOutreachTemplateSample(
  branchId: ScrapeBranchId,
  locale: string,
  kind: MailTemplateSampleKind,
  request?: Request,
): MailTemplateSample {
  const business = sampleBusiness(branchId);
  const baseUrl = resolveAppBaseUrl(request);
  const demoUrl = buildDemoBookingUrl(baseUrl, locale, SAMPLE_TOKEN);

  const proposalDraft =
    kind === "followup"
      ? buildBranchFollowUpDraft(branchId, business.name)
      : buildBranchProposalDraft(branchId, business.name);

  const report = buildMinimalReportForMail({
    business,
    proposalEmailDraft: proposalDraft,
    demoAppUrl: `/${locale}/demo/${SAMPLE_TOKEN}`,
    demoHomepageUrl: null,
    branchId,
  });

  const subject =
    kind === "followup"
      ? buildBranchFollowUpSubject(branchId, business.name)
      : buildBranchMailSubject(branchId, business.name);

  const { plainBody, htmlBody } = buildMailHtml({
    business,
    report,
    demoUrl,
    locale,
    baseUrl,
    dashboardScreenshotUrl: null,
    variant: kind,
  });

  return {
    branchId,
    kind,
    businessName: business.name,
    subject,
    plainBody,
    htmlBody,
    proposalDraft,
    demoUrl,
  };
}
