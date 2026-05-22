import { simpleParser } from "mailparser";
import * as cheerio from "cheerio";

export function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, dec) => {
      const code = parseInt(dec, 10);
      return code >= 0 && code <= 0x10ffff ? String.fromCodePoint(code) : "";
    })
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => {
      const code = parseInt(hex, 16);
      return code >= 0 && code <= 0x10ffff ? String.fromCodePoint(code) : "";
    })
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'");
}

export function htmlToPlainText(html: string | null | undefined): string {
  if (!html?.trim()) return "";
  const $ = cheerio.load(html);
  $("script, style, noscript").remove();
  return decodeHtmlEntities($("body").text().replace(/\s+/g, " ").trim());
}

export function cleanPreviewText(text: string, maxLen = 280): string {
  const cleaned = decodeHtmlEntities(text)
    .replace(/\u200b|\u200c|\u200d|\ufeff/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.slice(0, maxLen);
}

export async function parseEmailSource(
  source: Buffer | string,
): Promise<{
  preview: string;
  bodyText: string;
  bodyHtml: string | null;
}> {
  const parsed = await simpleParser(source);
  const bodyText =
    typeof parsed.text === "string" ? parsed.text.trim() : "";
  const bodyHtml =
    typeof parsed.html === "string" ? parsed.html.trim() || null : null;
  const plainFromHtml = htmlToPlainText(bodyHtml);
  const previewSource = bodyText || plainFromHtml;
  const preview = cleanPreviewText(previewSource);

  return {
    preview,
    bodyText: bodyText || plainFromHtml,
    bodyHtml,
  };
}
