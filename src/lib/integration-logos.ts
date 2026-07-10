export type IntegrationLogo = {
  name: string;
  slug: string;
  /** Local fallback when Simple Icons no longer hosts the brand (e.g. Slack/Salesforce). */
  src?: string;
};

/** Simple Icons removed Salesforce-owned brands (Slack, etc.) — CDN returns 404. */
const LOGO_OVERRIDES: Record<string, string> = {
  slack: "/logos/slack.svg",
};

export const INTEGRATION_LOGOS: IntegrationLogo[] = [
  { name: "Gmail", slug: "gmail" },
  { name: "Slack", slug: "slack", src: "/logos/slack.svg" },
  { name: "Notion", slug: "notion" },
  { name: "HubSpot", slug: "hubspot" },
  { name: "PostgreSQL", slug: "postgresql" },
  { name: "GitHub", slug: "github" },
  { name: "Linear", slug: "linear" },
  { name: "Google Drive", slug: "googledrive" },
];

export function integrationLogoUrl(slug: string): string {
  const override = LOGO_OVERRIDES[slug];
  if (override) return override;
  return `https://cdn.simpleicons.org/${slug}/8B8B8B`;
}
