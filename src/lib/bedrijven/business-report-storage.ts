import fs from "fs/promises";
import path from "path";
import { prisma } from "@/lib/db/prisma";
import {
  businessReportToDbCreate,
  dbReportToBusinessReport,
} from "@/lib/db/mappers";
import type { BusinessReport, BusinessReportSummary } from "./business-report-types";
import { enrichBusinessReport } from "./enrich-report";
import { computeLeadScores } from "./lead-score";
import type { Bedrijf } from "./types";
import { businessIdToSlug, safeScreenshotFilename } from "./slug";

const SCREENSHOTS_DIR = path.join(process.cwd(), "public", "audits");

export {
  businessIdToSlug,
  screenshotApiPath,
  slugToBusinessId,
} from "./slug";

export function screenshotPublicPath(businessId: string): string {
  return `/audits/${safeScreenshotFilename(businessId)}.png`;
}

export function screenshotFilePath(businessId: string): string {
  return path.join(SCREENSHOTS_DIR, `${safeScreenshotFilename(businessId)}.png`);
}

export function legacyScreenshotFilePath(businessId: string): string {
  return path.join(SCREENSHOTS_DIR, `${businessIdToSlug(businessId)}.png`);
}

export async function resolveScreenshotFile(
  businessId: string,
): Promise<string | null> {
  const candidates = [
    screenshotFilePath(businessId),
    legacyScreenshotFilePath(businessId),
  ];
  for (const file of candidates) {
    try {
      await fs.access(file);
      return file;
    } catch {
      // try next
    }
  }
  return null;
}

export async function loadBusinessReport(
  businessId: string,
): Promise<BusinessReport | null> {
  const row = await prisma.businessReport.findUnique({
    where: { businessId },
  });
  return row ? dbReportToBusinessReport(row) : null;
}

export async function saveBusinessReport(report: BusinessReport): Promise<void> {
  const data = businessReportToDbCreate(report);
  await prisma.business.upsert({
    where: { id: report.businessId },
    create: {
      id: report.businessId,
      placeId: report.businessId,
      name: report.businessName,
      category: "services",
      subcategory: "unknown",
      website: report.website || null,
      email: report.extractedEmail ?? null,
    },
    update: {
      name: report.businessName,
      website: report.website || undefined,
      email: report.extractedEmail ?? undefined,
    },
  });
  await prisma.businessReport.upsert({
    where: { businessId: report.businessId },
    create: data,
    update: {
      ...data,
      businessId: undefined,
    },
  });
}

export function reportToSummary(
  report: BusinessReport,
): BusinessReportSummary {
  return {
    businessId: report.businessId,
    generatedAt: report.generatedAt,
    seoScore: report.seoScore,
    modernityScore: report.modernityScore,
    overallScore: report.overallScore,
    leadQuality: report.leadQuality,
    primaryAppType: report.primaryAppType,
    detectedServices: report.detectedServices ?? [],
    servicesSummary: report.servicesSummary ?? "",
  };
}

export async function listReportSummaries(
  businessesById?: Map<string, Bedrijf>,
): Promise<BusinessReportSummary[]> {
  const rows = await prisma.businessReport.findMany({
    orderBy: { generatedAt: "desc" },
  });

  const summaries: BusinessReportSummary[] = [];
  for (const row of rows) {
    let report = dbReportToBusinessReport(row);
    if (!report.businessId || !report.ai) continue;

    const business = businessesById?.get(report.businessId);
    if (!business && typeof report.overallScore !== "number") {
      const lead = computeLeadScores({
        category: "other",
        seoScore: report.seoScore,
        modernityScore: report.modernityScore,
        usesHttps: report.usesHttps,
        extractedSnippet: report.extractedSnippet,
        fetchError: report.fetchError,
        webApplicationIdeas: report.ai.webApplicationIdeas,
      });
      report = { ...report, ...lead };
    }
    if (business) report = enrichBusinessReport(report, business);
    summaries.push(reportToSummary(report));
  }
  return summaries;
}
