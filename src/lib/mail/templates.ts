import type { Bedrijf } from "@/lib/bedrijven/types";
import type { BusinessReport } from "@/lib/bedrijven/business-report-types";
import { buildFollowUpMailSubject } from "./demo-outreach-followup-draft";
import { appendUtmToUrl, type OutreachUtmParams } from "./outreach-utm";

/** Vaste Proceda-huisstijl voor outreach-CTA (niet klantkleur). */
export const PROCEDA_MAIL_CTA_COLOR = "#7F56D9";

const CTA_LABEL = "Plan een vrijblijvende demo (30 min)";

export type MailTemplateVariant = "initial" | "followup";

export function buildMailSubject(
  businessName: string,
  variant: MailTemplateVariant = "initial",
): string {
  if (variant === "followup") {
    return buildFollowUpMailSubject(businessName);
  }
  return `Maatwerk webapp + AI-automatisering — ${businessName}`;
}

export function buildDemoBookingUrl(
  baseUrl: string,
  locale: string,
  token: string,
  utm?: OutreachUtmParams,
): string {
  const base = baseUrl.replace(/\/$/, "");
  const url = `${base}/${locale}/demo/${token}`;
  if (!utm) return url;
  return appendUtmToUrl(url, utm);
}

function buildDashboardScreenshotHtml(
  imageUrl: string,
  businessName: string,
): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 22px;border:1px solid #EAECF0;border-radius:12px;overflow:hidden;">
    <tr><td style="padding:0;background:#F9FAFB;">
      <img src="${escapeAttr(imageUrl)}" alt="Preview dashboard ${escapeAttr(businessName)}" width="504" style="display:block;width:100%;max-width:504px;height:auto;border:0;" />
    </td></tr>
    <tr><td style="padding:12px 16px 14px;background:#ffffff;border-top:1px solid #EAECF0;">
      <p style="margin:0;font-size:13px;line-height:1.5;color:#667085;">Visuele preview van uw maatwerk dashboard in uw huisstijl — tijdens het gesprek laten we het live zien.</p>
    </td></tr>
  </table>`;
}

export function buildMailHtml(params: {
  business: Bedrijf;
  report: BusinessReport;
  demoUrl: string;
  locale?: string;
  baseUrl?: string;
  dashboardScreenshotUrl?: string | null;
  variant?: MailTemplateVariant;
}): { subject: string; plainBody: string; htmlBody: string } {
  const { business, report, demoUrl } = params;
  const variant = params.variant ?? "initial";

  const subject = buildMailSubject(business.name, variant);

  const plainBody = `${report.ai.proposalEmailDraft.trim()}\n\n${CTA_LABEL}: ${demoUrl}`;

  const paragraphs = report.ai.proposalEmailDraft
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map(
      (p) =>
        `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#344054;">${escapeHtml(p).replace(/\n/g, "<br/>")}</p>`,
    )
    .join("");

  const screenshotBlock =
    params.dashboardScreenshotUrl?.trim()
      ? buildDashboardScreenshotHtml(
          params.dashboardScreenshotUrl,
          business.name,
        )
      : "";

  const htmlBody = `<!DOCTYPE html>
<html lang="nl">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width"/></head>
<body style="margin:0;padding:0;background:#F9FAFB;font-family:Inter,Segoe UI,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:12px;border:1px solid #EAECF0;overflow:hidden;">
        <tr><td style="padding:28px 28px 24px;">
          ${paragraphs}
          ${screenshotBlock}
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 8px;">
            <tr><td>
              <a href="${escapeAttr(demoUrl)}" style="display:inline-block;background:${PROCEDA_MAIL_CTA_COLOR};color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 24px;border-radius:8px;box-shadow:0 1px 2px rgba(16,24,40,0.05);">
                ${escapeHtml(CTA_LABEL)}
              </a>
            </td></tr>
          </table>
          <p style="margin:16px 0 0;font-size:12px;line-height:1.5;color:#667085;">
            Kies een moment dat u uitkomt — maandag t/m vrijdag, 08:00–20:00.
          </p>
        </td></tr>
        <tr><td style="padding:16px 28px;background:#F9FAFB;border-top:1px solid #EAECF0;">
          <p style="margin:0;font-size:12px;color:#98A2B3;">Proceda · maatwerk webapplicaties &amp; AI-automatisering</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return { subject, plainBody, htmlBody };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(s: string): string {
  return escapeHtml(s).replace(/'/g, "&#39;");
}
