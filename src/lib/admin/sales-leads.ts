import { HIEBAMI_BUSINESS_ID } from "@/lib/demo-app/hiebami-demo";
import { PROCEDA_PUBLIC_APP_URL } from "@/lib/mail/app-url";

/** Commerciële pipeline-status (sales, niet mail-outreach). */
export type SalesLeadStatus =
  | "demo_ready_present"
  | "hot"
  | "contacted"
  | "proposal"
  | "won"
  | "lost";

export type SalesLeadQuality = "hot" | "warm" | "cold";

export type SalesLead = {
  id: string;
  companyName: string;
  contactName?: string;
  email?: string;
  branchId: string;
  status: SalesLeadStatus;
  quality: SalesLeadQuality;
  dealValueEur: number;
  demoSlug: string;
  businessId: string;
  nextAction: string;
  notes?: string;
  updatedAt: string;
};

export const DEFAULT_DEAL_VALUE_EUR = 3000;

/** Handmatig bijgehouden sales-leads (platform). */
export const SALES_LEADS: SalesLead[] = [
  {
    id: "hiebami",
    companyName: "Hiebami",
    contactName: "Misaël Helmijr",
    email: "info@hiebami.nl",
    branchId: "recruitment",
    status: "demo_ready_present",
    quality: "hot",
    dealValueEur: DEFAULT_DEAL_VALUE_EUR,
    demoSlug: "hiebami",
    businessId: HIEBAMI_BUSINESS_ID,
    nextAction: "Demo presenteren — recruitmentportaal + AI-flow",
    notes:
      "Mailcontact actief. Demo-app klaar voor screen recording. Waarde €3.000 (hot lead).",
    updatedAt: new Date().toISOString(),
  },
];

export function getSalesLeads(): SalesLead[] {
  return [...SALES_LEADS].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export function getSalesLeadsPipelineValueEur(leads = SALES_LEADS): number {
  return leads
    .filter((l) => l.status !== "won" && l.status !== "lost")
    .reduce((sum, l) => sum + l.dealValueEur, 0);
}

/** Pad in de app (i18n-link). */
export function salesLeadDemoAppPath(locale: string, demoSlug: string): string {
  return `/demos/${demoSlug}/app`;
}

/**
 * Volledige URL om te delen met de klant (productie-domein, niet localhost).
 */
export function salesLeadDemoShareUrl(
  locale: string,
  demoSlug: string,
): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "") ||
    PROCEDA_PUBLIC_APP_URL;
  const loc = locale.startsWith("/") ? locale.slice(1) : locale;
  return `${base}/${loc}/demos/${demoSlug}/app`;
}
