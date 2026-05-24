import type { Bedrijf } from "@/lib/bedrijven/types";
import {
  businessIdToDemoSlug,
  demoAppPublicPath,
  demoHomepagePublicPath,
} from "@/lib/bedrijven/demo-slug";
import { buildMinimalReportForMail } from "./demo-outreach-draft";
import { buildOutreachFollowUpDraft } from "./outreach-draft";
import { buildOutreachMailSubject } from "./outreach-draft";
import { resolveOutreachBranchId } from "@/lib/bedrijven/outreach-branches";
import { buildDemoBookingUrl, buildMailHtml } from "./templates";
import { buildOutreachUtmParams } from "./outreach-utm";

/** Admin-preview en batch follow-up (zelfde copy als verzonden mail). */
export function buildFollowupMailPreviewForLead(params: {
  business: Bedrijf;
  token: string;
  locale: string;
  baseUrl: string;
  dashboardScreenshotUrl?: string | null;
}): { subject: string; plainBody: string; htmlBody: string; demoUrl: string } {
  const { business, token, locale, baseUrl } = params;
  const branchId = resolveOutreachBranchId(business.branchId ?? null);
  const demoSlug = businessIdToDemoSlug(business.id);
  const draft = buildOutreachFollowUpDraft(branchId, business.name);
  const report = buildMinimalReportForMail({
    business,
    proposalEmailDraft: draft,
    demoAppUrl: demoAppPublicPath(demoSlug, locale),
    demoHomepageUrl: demoHomepagePublicPath(demoSlug, locale),
    branchId,
  });
  const utm = buildOutreachUtmParams({
    branchId: business.branchId ?? "makelaardij",
    sendBatch: undefined,
    mailKind: "followup",
  });
  const demoUrl = buildDemoBookingUrl(baseUrl, locale, token, utm);
  const built = buildMailHtml({
    business,
    report,
    demoUrl,
    locale,
    baseUrl,
    dashboardScreenshotUrl: params.dashboardScreenshotUrl ?? null,
    variant: "followup",
  });
  const subject = buildOutreachMailSubject(branchId, business.name, "followup");
  return { subject, plainBody: built.plainBody, htmlBody: built.htmlBody, demoUrl };
}
