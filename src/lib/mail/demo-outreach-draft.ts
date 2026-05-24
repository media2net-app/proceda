import type { ScrapeBranchId } from "@/lib/bedrijven/branches";
import { DEFAULT_BRANCH } from "@/lib/bedrijven/branches";
import type { Bedrijf } from "@/lib/bedrijven/types";
import type { BusinessReport } from "@/lib/bedrijven/business-report-types";
import { branchReportMeta } from "./branch-outreach-copy";
import { makelaardijOutreachBody } from "./branch-outreach-bodies";
import { composeOutreachDraft } from "./proceda-outreach-shared";

/** Standaard outreach-mail voor makelaars met demo-dashboard (zonder AI-rapport). */
export function buildMakelaarDemoProposalDraft(businessName: string): string {
  return composeOutreachDraft(businessName, makelaardijOutreachBody(businessName));
}

export function buildMinimalReportForMail(params: {
  business: Bedrijf;
  proposalEmailDraft: string;
  demoAppUrl: string;
  demoHomepageUrl?: string | null;
  branchId?: ScrapeBranchId;
}): BusinessReport {
  const { business, proposalEmailDraft, demoAppUrl, demoHomepageUrl } = params;
  const branchId = params.branchId ?? business.branchId ?? DEFAULT_BRANCH;
  const meta = branchReportMeta(branchId);
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
    primaryAppType: meta.primaryAppType,
    detectedServices: meta.detectedServices,
    servicesSummary: meta.servicesSummary,
    extractedEmail: business.email,
    demoAppUrl,
    demoHomepageUrl: demoHomepageUrl ?? undefined,
    ai: {
      companySummary: `Maatwerk webapp-concept voor ${business.name} met AI voor procesautomatisering.`,
      servicesOffered: meta.servicesOffered,
      webApplicationIdeas: [
        `Maatwerk portaal voor ${meta.servicesOffered} met dashboard en AI.`,
        "AI-automatisering voor opvolging, dossiers en communicatie.",
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
