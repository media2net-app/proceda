import type { Bedrijf } from "./types";
import type { BusinessReport } from "./business-report-types";
import { saveBusinessReport } from "./business-report-storage";
import { generateProcedaAnalysis } from "./ai-proposal";
import { computeLeadScoresForBusiness } from "./lead-score";
import { detectServicesForBusiness } from "./service-detection";
import { scanWebsite } from "./website-scan";

export async function generateBusinessReport(
  business: Bedrijf,
): Promise<BusinessReport> {
  if (!business.website?.trim()) {
    throw new Error("NO_WEBSITE");
  }

  const scan = await scanWebsite(business);
  const businessWithContact: Bedrijf = {
    ...business,
    email: business.email ?? scan.extractedEmail,
  };
  const services = detectServicesForBusiness(businessWithContact, scan);
  const ai = await generateProcedaAnalysis(businessWithContact, scan, services);
  const lead = computeLeadScoresForBusiness(businessWithContact, {
    seoScore: scan.seoScore,
    modernityScore: scan.modernityScore,
    usesHttps: scan.usesHttps,
    extractedSnippet: scan.extractedSnippet,
    fetchError: scan.fetchError,
    webApplicationIdeas: ai.webApplicationIdeas,
    serviceDetection: services,
  });

  const report: BusinessReport = {
    businessId: business.id,
    businessName: business.name,
    website: business.website,
    generatedAt: new Date().toISOString(),
    screenshotPath: scan.screenshotPath,
    pageTitle: scan.pageTitle,
    metaDescription: scan.metaDescription,
    extractedSnippet: scan.extractedSnippet,
    usesHttps: scan.usesHttps,
    responseTimeMs: scan.responseTimeMs,
    seoScore: scan.seoScore,
    modernityScore: scan.modernityScore,
    overallScore: lead.overallScore,
    leadQuality: lead.leadQuality,
    primaryAppType: lead.primaryAppType,
    detectedServices: services.labels,
    servicesSummary: services.servicesSummary,
    extractedEmail: scan.extractedEmail,
    ai,
    fetchError: scan.fetchError,
  };

  await saveBusinessReport(report);
  return report;
}
