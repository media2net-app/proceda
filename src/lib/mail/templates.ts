import type { Bedrijf } from "@/lib/bedrijven/types";
import type { BusinessReport } from "@/lib/bedrijven/business-report-types";
import { buildFollowUpMailSubject } from "./demo-outreach-followup-draft";
import { appendUtmToUrl, type OutreachUtmParams } from "./outreach-utm";

/** Pad naar Proceda-logo (o.a. website / previews). */
export const PROCEDA_MAIL_LOGO_PATH = "/proceda-logo.svg";

/** Vaste Proceda-huisstijl voor outreach-CTA (niet klantkleur). */
export const PROCEDA_MAIL_CTA_COLOR = "#7F56D9";

const PROCEDA_MAIL_PURPLE_TEXT = "#FFFFFF";
const PROCEDA_MAIL_PURPLE_MUTED = "#E9D7FE";
const PROCEDA_MAIL_BODY_TEXT = "#344054";
const PROCEDA_MAIL_BODY_STRONG = "#101828";
const PROCEDA_MAIL_PAGE_BG = "#F9FAFB";
const PROCEDA_MAIL_BORDER = "#EAECF0";

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

  const draftText = report.ai.proposalEmailDraft.trim();
  const plainDraft = stripBoldMarkers(
    draftText.replace(/\n\n---\n\n/g, "\n\n"),
  );
  const plainBody = `${plainDraft}\n\n${CTA_LABEL}: ${demoUrl}`;

  const sections = splitOutreachDraftSections(draftText);
  const signatureSection =
    sections.length > 1 &&
    sections[sections.length - 1].startsWith("Met vriendelijke groet")
      ? sections.pop()
      : null;
  const contentSections = sections;

  const sectionRows = contentSections
    .map((section, index) =>
      buildEmailSectionRow(section, index, { prependLogo: index === 0 }),
    )
    .join("");

  const ctaRow = buildEmailCtaRow(demoUrl);
  const signatureRow = signatureSection
    ? buildEmailSignatureRow(signatureSection)
    : "";

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
<body style="margin:0;padding:0;background:${PROCEDA_MAIL_PAGE_BG};font-family:Inter,Segoe UI,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PROCEDA_MAIL_PAGE_BG};padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;border:1px solid ${PROCEDA_MAIL_BORDER};overflow:hidden;">
        ${sectionRows}
        ${screenshotBlock ? `<tr><td style="padding:0 28px 8px;background:#ffffff;">${screenshotBlock}</td></tr>` : ""}
        ${ctaRow}
        ${signatureRow}
        <tr><td style="padding:16px 28px;background:${PROCEDA_MAIL_PAGE_BG};border-top:1px solid ${PROCEDA_MAIL_BORDER};">
          <p style="margin:0;font-size:12px;color:#98A2B3;text-align:center;">Proceda · maatwerk webapplicaties &amp; AI-automatisering</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return { subject, plainBody, htmlBody };
}

function splitOutreachDraftSections(draft: string): string[] {
  if (draft.includes("---")) {
    return draft
      .split(/\n\n---\n\n/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [draft.trim()].filter(Boolean);
}

function buildEmailLogoBlock(): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
    <tr>
      <td align="center" valign="middle" style="width:36px;height:36px;border-radius:18px;background:${PROCEDA_MAIL_CTA_COLOR};color:#FFFFFF;font-family:Inter,Segoe UI,Helvetica,Arial,sans-serif;font-size:14px;font-weight:700;line-height:36px;text-align:center;">P</td>
      <td style="padding-left:10px;font-family:Inter,Segoe UI,Helvetica,Arial,sans-serif;font-size:20px;font-weight:700;line-height:1;color:${PROCEDA_MAIL_BODY_STRONG};">Proceda</td>
    </tr>
  </table>`;
}

function sectionStyle(index: number): {
  background: string;
  color: string;
  strongColor: string;
} {
  const isPurple = index % 2 === 1;
  return isPurple
    ? {
        background: PROCEDA_MAIL_CTA_COLOR,
        color: PROCEDA_MAIL_PURPLE_TEXT,
        strongColor: PROCEDA_MAIL_PURPLE_TEXT,
      }
    : {
        background: "#FFFFFF",
        color: PROCEDA_MAIL_BODY_TEXT,
        strongColor: PROCEDA_MAIL_BODY_STRONG,
      };
}

function buildEmailSectionRow(
  sectionText: string,
  index: number,
  options?: { prependLogo?: boolean },
): string {
  const { background, color, strongColor } = sectionStyle(index);
  const paragraphs = sectionText
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p, i, arr) => {
      const marginBottom = i < arr.length - 1 ? "16px" : "0";
      const inner = formatEmailInlineMarkdown(p, { strongColor }).replace(
        /\n/g,
        "<br/>",
      );
      return `<p style="margin:0 0 ${marginBottom};font-size:15px;line-height:1.65;color:${color};">${inner}</p>`;
    })
    .join("");

  const logoBlock = options?.prependLogo ? buildEmailLogoBlock() : "";

  return `<tr><td style="padding:24px 28px;background:${background};${
    index > 0 ? `border-top:1px solid ${index % 2 === 0 ? PROCEDA_MAIL_BORDER : "rgba(255,255,255,0.15)"};` : ""
  }">${logoBlock}${paragraphs}</td></tr>`;
}

function buildEmailCtaRow(demoUrl: string): string {
  return `<tr><td align="center" style="padding:28px;background:${PROCEDA_MAIL_CTA_COLOR};border-top:1px solid rgba(255,255,255,0.15);">
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
      <tr><td align="center">
        <a href="${escapeAttr(demoUrl)}" style="display:inline-block;background:#FFFFFF;color:${PROCEDA_MAIL_CTA_COLOR};font-size:15px;font-weight:600;text-decoration:none;padding:14px 28px;border-radius:8px;box-shadow:0 1px 2px rgba(16,24,40,0.05);">
          ${escapeHtml(CTA_LABEL)}
        </a>
      </td></tr>
    </table>
    <p style="margin:16px 0 0;font-size:12px;line-height:1.5;color:${PROCEDA_MAIL_PURPLE_MUTED};text-align:center;">
      Kies een moment dat je uitkomt — videogesprek via Google Meet, maandag t/m vrijdag, 08:00–20:00.
    </p>
  </td></tr>`;
}

function buildEmailSignatureRow(sectionText: string): string {
  const inner = sectionText
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p, i, arr) => {
      const marginBottom = i < arr.length - 1 ? "8px" : "0";
      const innerHtml = formatEmailInlineMarkdown(p).replace(/\n/g, "<br/>");
      return `<p style="margin:0 0 ${marginBottom};font-size:15px;line-height:1.6;color:${PROCEDA_MAIL_BODY_TEXT};">${innerHtml}</p>`;
    })
    .join("");

  return `<tr><td style="padding:20px 28px 24px;background:#FFFFFF;border-top:1px solid ${PROCEDA_MAIL_BORDER};">${inner}</td></tr>`;
}

/** **vet** in outreach-copy → <strong> in HTML-mail. */
function formatEmailInlineMarkdown(
  text: string,
  opts?: { strongColor?: string },
): string {
  const strongColor = opts?.strongColor ?? PROCEDA_MAIL_BODY_STRONG;
  const parts = text.split(/\*\*(.+?)\*\*/g);
  if (parts.length === 1) return escapeHtml(text);

  let html = "";
  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 1) {
      html += `<strong style="font-weight:600;color:${strongColor};">${escapeHtml(parts[i])}</strong>`;
    } else {
      html += escapeHtml(parts[i]);
    }
  }
  return html;
}

function stripBoldMarkers(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, "$1");
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
