/** UTM-params voor outreach mail-links (koppelbaar aan analytics). */
export type OutreachUtmParams = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
};

export function buildOutreachUtmParams(input: {
  branchId: string;
  sendBatch?: string;
  subjectVariant?: string;
  mailKind?: "initial" | "followup" | "sequence";
}): OutreachUtmParams {
  const campaign =
    input.sendBatch?.trim() ||
    `${input.branchId}-outreach`;
  const content =
    input.mailKind === "followup"
      ? "followup"
      : input.mailKind === "sequence"
        ? "sequence"
        : input.subjectVariant?.trim() || "default";

  return {
    utm_source: "proceda_outreach",
    utm_medium: "email",
    utm_campaign: campaign,
    utm_content: content,
  };
}

export function parseUtmFromPath(path: string): OutreachUtmParams | null {
  const qIndex = path.indexOf("?");
  if (qIndex < 0) return null;
  try {
    const params = new URLSearchParams(path.slice(qIndex + 1));
    const utm_campaign = params.get("utm_campaign")?.trim();
    if (!utm_campaign) return null;
    return {
      utm_source: params.get("utm_source")?.trim() || undefined,
      utm_medium: params.get("utm_medium")?.trim() || undefined,
      utm_campaign,
      utm_content: params.get("utm_content")?.trim() || undefined,
    };
  } catch {
    return null;
  }
}

export function appendUtmToUrl(url: string, utm: OutreachUtmParams): string {
  const u = new URL(url);
  if (utm.utm_source) u.searchParams.set("utm_source", utm.utm_source);
  if (utm.utm_medium) u.searchParams.set("utm_medium", utm.utm_medium);
  if (utm.utm_campaign) u.searchParams.set("utm_campaign", utm.utm_campaign);
  if (utm.utm_content) u.searchParams.set("utm_content", utm.utm_content);
  return u.toString();
}
