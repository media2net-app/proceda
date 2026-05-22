import type { Bedrijf } from "@/lib/bedrijven/types";
import {
  businessIdToDemoSlug,
  demoAppPublicPath,
  demoHomepagePublicPath,
} from "@/lib/bedrijven/demo-slug";
import { buildFollowUpProposalDraft } from "./demo-outreach-followup-draft";
import { buildMinimalReportForMail } from "./demo-outreach-draft";
import { buildDemoBookingUrl, buildMailHtml } from "./templates";

/** Admin-preview en batch follow-up (zelfde copy als verzonden mail). */
export function buildFollowupMailPreviewForLead(params: {
  business: Bedrijf;
  token: string;
  locale: string;
  baseUrl: string;
  dashboardScreenshotUrl?: string | null;
}): { subject: string; plainBody: string; htmlBody: string; demoUrl: string } {
  const { business, token, locale, baseUrl } = params;
  const demoSlug = businessIdToDemoSlug(business.id);
  const draft = buildFollowUpProposalDraft(business.name);
  const report = buildMinimalReportForMail({
    business,
    proposalEmailDraft: draft,
    demoAppUrl: demoAppPublicPath(demoSlug, locale),
    demoHomepageUrl: demoHomepagePublicPath(demoSlug, locale),
  });
  const demoUrl = buildDemoBookingUrl(baseUrl, locale, token);
  const { subject, plainBody, htmlBody } = buildMailHtml({
    business,
    report,
    demoUrl,
    locale,
    baseUrl,
    dashboardScreenshotUrl: params.dashboardScreenshotUrl ?? null,
    variant: "followup",
  });
  return { subject, plainBody, htmlBody, demoUrl };
}
