import type { Bedrijf } from "@/lib/bedrijven/types";
import type { BusinessReport } from "@/lib/bedrijven/business-report-types";

/** Standaard outreach-mail voor makelaars met demo-dashboard (zonder AI-rapport). */
export function buildMakelaarDemoProposalDraft(businessName: string): string {
  return `Beste ${businessName},

Wij zijn Proceda. Wij bouwen maatwerk webapplicaties voor bedrijven en integreren AI om repetitieve bedrijfsprocessen te automatiseren — van leadopvolging en dossierbeheer tot communicatie met kopers en verkopers.

Concreet voor ${businessName}: we hebben een concept voorbereid in uw huisstijl — een makelaarsdashboard met uw logo en kleuren, met KPI's, woningaanbod en leads in één maatwerk portaal. Daarbij hoort een AI-medewerker die processen automatiseert, marktprognoses maakt, uw concurrentie analyseert en prognoses voor uw kantoor kan genereren.

In deze e-mail vindt u een visuele preview van dat dashboard. Tijdens een vrijblijvend gesprek van 30 minuten laten we alles live zien — zonder verplichtingen.

Met vriendelijke groet,
Proceda`;
}

export function buildMinimalReportForMail(params: {
  business: Bedrijf;
  proposalEmailDraft: string;
  demoAppUrl: string;
  demoHomepageUrl?: string | null;
}): BusinessReport {
  const { business, proposalEmailDraft, demoAppUrl, demoHomepageUrl } = params;
  const now = new Date().toISOString();

  return {
    businessId: business.id,
    businessName: business.name,
    website: business.website ?? "",
    generatedAt: now,
    screenshotPath: null,
    pageTitle: null,
    metaDescription: null,
    extractedSnippet: "",
    usesHttps: true,
    responseTimeMs: 0,
    seoScore: 0,
    modernityScore: 0,
    overallScore: 0,
    leadQuality: "warm",
    primaryAppType: "crm-dashboard",
    detectedServices: ["makelaardij", "woningaanbod"],
    servicesSummary: "Makelaardij en woningaanbod",
    extractedEmail: business.email,
    demoAppUrl,
    demoHomepageUrl: demoHomepageUrl ?? undefined,
    ai: {
      companySummary: `Maatwerk webapp-concept voor ${business.name} met AI voor procesautomatisering.`,
      servicesOffered: "Makelaardij",
      webApplicationIdeas: [
        "Maatwerk makelaarsportaal met dashboard, leads en woningaanbod.",
        "AI-automatisering voor leadopvolging, dossiers en communicatie.",
      ],
      automationOpportunities: [
        "Automatische opvolging van leads en bezichtigingen.",
        "AI-ondersteuning bij dossiers en klantcommunicatie.",
      ],
      processImprovements: [],
      proposalEmailDraft,
      generatedAt: now,
      model: "demo-outreach-template",
    },
  };
}
