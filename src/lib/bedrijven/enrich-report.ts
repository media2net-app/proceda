import type { Bedrijf } from "./types";
import type { BusinessReport } from "./business-report-types";
import { computeLeadScoresForBusiness } from "./lead-score";
import { detectServicesForBusiness } from "./service-detection";

/** Backfill / refresh lead scores and app type from website content. */
export function enrichBusinessReport(
  report: BusinessReport,
  business: Bedrijf,
): BusinessReport {
  const services = detectServicesForBusiness(business, {
    pageTitle: report.pageTitle,
    metaDescription: report.metaDescription,
    extractedSnippet: report.extractedSnippet,
    navTexts: [],
  });

  const lead = computeLeadScoresForBusiness(business, {
    seoScore: report.seoScore,
    modernityScore: report.modernityScore,
    usesHttps: report.usesHttps,
    extractedSnippet: report.extractedSnippet,
    fetchError: report.fetchError,
    webApplicationIdeas: report.ai.webApplicationIdeas,
    serviceDetection: services,
  });

  return {
    ...report,
    detectedServices: services.labels,
    servicesSummary: services.servicesSummary,
    overallScore: lead.overallScore,
    leadQuality: lead.leadQuality,
    primaryAppType: lead.primaryAppType,
  };
}
