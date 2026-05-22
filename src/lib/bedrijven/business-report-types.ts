export type ProcedaAiAnalysis = {
  companySummary: string;
  servicesOffered: string;
  webApplicationIdeas: string[];
  automationOpportunities: string[];
  processImprovements: string[];
  proposalEmailDraft: string;
  generatedAt: string;
  model: string;
};

import type { AppTypeKey, LeadQuality } from "./lead-score";

export type BusinessReport = {
  businessId: string;
  businessName: string;
  website: string;
  generatedAt: string;
  screenshotPath: string | null;
  pageTitle: string | null;
  metaDescription: string | null;
  extractedSnippet: string;
  usesHttps: boolean;
  responseTimeMs: number;
  seoScore: number;
  modernityScore: number;
  overallScore: number;
  leadQuality: LeadQuality;
  primaryAppType: AppTypeKey;
  detectedServices: string[];
  servicesSummary: string;
  extractedEmail?: string;
  /** Gegenereerd concept in huisstijl van de klant */
  demoHomepageUrl?: string;
  /** Concept webapp / dashboard in huisstijl */
  demoAppUrl?: string;
  deepScrape?: {
    scrapedAt: string;
    pagesScraped: number;
    brandColors: string[];
    tagline: string | null;
    services: string[];
    logoUrl: string | null;
  };
  ai: ProcedaAiAnalysis;
  fetchError?: string;
};

export type BusinessReportSummary = {
  businessId: string;
  generatedAt: string;
  seoScore: number;
  modernityScore: number;
  overallScore: number;
  leadQuality: LeadQuality;
  primaryAppType: AppTypeKey;
  detectedServices: string[];
  servicesSummary: string;
};
