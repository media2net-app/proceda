import type {
  AppointmentSource,
  AppointmentStatus,
  LeadAppointment,
} from "@/lib/afspraken/types";
import type { Bedrijf, BedrijfCategory } from "@/lib/bedrijven/types";
import type { BusinessReport } from "@/lib/bedrijven/business-report-types";
import type { DeepScrapeResult } from "@/lib/bedrijven/deep-scrape-types";
import type { MailOutreachRecord } from "@/lib/mail/types";
import type {
  Appointment,
  AppointmentSource as DbAppointmentSource,
  AppointmentStatus as DbAppointmentStatus,
  Business,
  BusinessReport as DbBusinessReport,
  DeepScrape as DbDeepScrape,
  MailLeadStatus,
  MailOutreach,
} from "@/generated/prisma";

const CATEGORY_VALUES: BedrijfCategory[] = [
  "horeca",
  "retail",
  "services",
  "health",
  "auto",
  "education",
  "office",
  "other",
];

function asCategory(value: string): BedrijfCategory {
  return CATEGORY_VALUES.includes(value as BedrijfCategory)
    ? (value as BedrijfCategory)
    : "other";
}

export function businessToBedrijf(row: Business): Bedrijf {
  return {
    id: row.id,
    placeId: row.placeId,
    name: row.name,
    category: asCategory(row.category),
    subcategory: row.subcategory,
    address: row.address,
    city: row.city,
    province: row.province,
    provinceId: row.provinceId as Bedrijf["provinceId"],
    branchId: row.branchId as Bedrijf["branchId"],
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
    website: row.website ?? undefined,
    openingHours: row.openingHours ?? undefined,
    source: "google",
    lat: row.lat ?? undefined,
    lon: row.lon ?? undefined,
  };
}

export function bedrijfToBusinessCreate(b: Bedrijf) {
  return {
    id: b.id,
    placeId: b.placeId,
    name: b.name,
    category: b.category,
    subcategory: b.subcategory,
    address: b.address,
    city: b.city,
    province: b.province,
    provinceId: b.provinceId ?? null,
    branchId: b.branchId ?? "makelaardij",
    phone: b.phone ?? null,
    email: b.email ?? null,
    website: b.website ?? null,
    openingHours: b.openingHours ?? null,
    source: b.source,
    lat: b.lat ?? null,
    lon: b.lon ?? null,
    scrapedAt: new Date(),
  };
}

function dbSourceToApp(source: DbAppointmentSource): AppointmentSource {
  return source === "cold_call" ? "cold-call" : "auto-mail";
}

function appSourceToDb(source: AppointmentSource): DbAppointmentSource {
  return source === "cold-call" ? "cold_call" : "auto_mail";
}

function dbStatusToApp(status: DbAppointmentStatus): AppointmentStatus {
  if (status === "no_show") return "no-show";
  return status;
}

function appStatusToDb(status: AppointmentStatus): DbAppointmentStatus {
  if (status === "no-show") return "no_show";
  return status;
}

export function appointmentToLead(row: Appointment): LeadAppointment {
  return {
    id: row.id,
    businessId: row.businessId ?? undefined,
    businessName: row.businessName,
    contactName: row.contactName ?? undefined,
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    source: dbSourceToApp(row.source),
    scheduledAt: row.scheduledAt.toISOString(),
    durationMinutes: row.durationMinutes,
    meetLink: row.meetLink,
    status: dbStatusToApp(row.status),
    notes: row.notes ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function leadToAppointmentCreate(
  input: Omit<LeadAppointment, "id" | "createdAt" | "updatedAt"> & {
    id?: string;
  },
) {
  return {
    id: input.id,
    businessId: input.businessId ?? null,
    businessName: input.businessName,
    contactName: input.contactName ?? null,
    email: input.email ?? null,
    phone: input.phone ?? null,
    source: appSourceToDb(input.source),
    scheduledAt: new Date(input.scheduledAt),
    durationMinutes: input.durationMinutes,
    meetLink: input.meetLink,
    status: appStatusToDb(input.status),
    notes: input.notes ?? null,
  };
}

export function mailOutreachToRecord(row: MailOutreach): MailOutreachRecord {
  return {
    businessId: row.businessId,
    token: row.token,
    status: row.status as MailOutreachRecord["status"],
    recipientEmail: row.recipientEmail ?? undefined,
    sentAt: row.sentAt?.toISOString(),
    followupSentAt: row.followupSentAt?.toISOString(),
    bookedAt: row.bookedAt?.toISOString(),
    appointmentId: row.appointmentId ?? undefined,
    sendBatch: row.sendBatch ?? undefined,
    subjectVariant: row.subjectVariant ?? undefined,
    pipelineStatus: row.pipelineStatus as MailOutreachRecord["pipelineStatus"],
    doNotMail: row.doNotMail,
    sequenceStep: row.sequenceStep,
    sequenceNextAt: row.sequenceNextAt?.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function dbReportToBusinessReport(row: DbBusinessReport): BusinessReport {
  const ai = row.ai as BusinessReport["ai"];
  const deepScrape = row.deepScrapeSummary as BusinessReport["deepScrape"];
  return {
    businessId: row.businessId,
    businessName: row.businessName,
    website: row.website,
    generatedAt: row.generatedAt.toISOString(),
    screenshotPath: row.screenshotPath,
    pageTitle: row.pageTitle,
    metaDescription: row.metaDescription,
    extractedSnippet: row.extractedSnippet,
    usesHttps: row.usesHttps,
    responseTimeMs: row.responseTimeMs,
    seoScore: row.seoScore,
    modernityScore: row.modernityScore,
    overallScore: row.overallScore,
    leadQuality: row.leadQuality as BusinessReport["leadQuality"],
    primaryAppType: row.primaryAppType as BusinessReport["primaryAppType"],
    detectedServices: row.detectedServices,
    servicesSummary: row.servicesSummary,
    extractedEmail: row.extractedEmail ?? undefined,
    demoHomepageUrl: row.demoHomepageUrl ?? undefined,
    demoAppUrl: row.demoAppUrl ?? undefined,
    deepScrape,
    ai,
    fetchError: row.fetchError ?? undefined,
  };
}

export function businessReportToDbCreate(report: BusinessReport) {
  return {
    businessId: report.businessId,
    businessName: report.businessName,
    website: report.website,
    generatedAt: new Date(report.generatedAt),
    screenshotPath: report.screenshotPath,
    pageTitle: report.pageTitle,
    metaDescription: report.metaDescription,
    extractedSnippet: report.extractedSnippet,
    usesHttps: report.usesHttps,
    responseTimeMs: report.responseTimeMs,
    seoScore: report.seoScore,
    modernityScore: report.modernityScore,
    overallScore: report.overallScore,
    leadQuality: report.leadQuality,
    primaryAppType: report.primaryAppType,
    detectedServices: report.detectedServices,
    servicesSummary: report.servicesSummary,
    extractedEmail: report.extractedEmail ?? null,
    demoHomepageUrl: report.demoHomepageUrl ?? null,
    demoAppUrl: report.demoAppUrl ?? null,
    deepScrapeSummary: report.deepScrape ?? undefined,
    ai: report.ai,
    fetchError: report.fetchError ?? null,
  };
}

export function dbDeepScrapeToResult(row: DbDeepScrape): DeepScrapeResult {
  const extra = row as DbDeepScrape & {
    allNavTexts?: string[];
    allImageUrls?: string[];
  };
  return {
    businessId: row.businessId,
    businessName: row.businessName,
    website: row.website,
    scrapedAt: row.scrapedAt.toISOString(),
    brand: row.brand as DeepScrapeResult["brand"],
    pages: row.pages as DeepScrapeResult["pages"],
    listings: row.listings as DeepScrapeResult["listings"],
    allNavTexts: extra.allNavTexts ?? [],
    allImageUrls: extra.allImageUrls ?? [],
    contact: row.contact as DeepScrapeResult["contact"],
    tagline: row.tagline,
    services: row.services,
    aboutText: row.aboutText,
    homepageScreenshotPath: row.homepageScreenshotPath,
    errors: row.errors,
  };
}

export function deepScrapeToDbCreate(result: DeepScrapeResult) {
  return {
    businessId: result.businessId,
    businessName: result.businessName,
    website: result.website,
    scrapedAt: new Date(result.scrapedAt),
    brand: result.brand,
    pages: result.pages,
    listings: result.listings,
    contact: result.contact,
    tagline: result.tagline ?? null,
    services: result.services,
    aboutText: result.aboutText ?? null,
    homepageScreenshotPath: result.homepageScreenshotPath ?? null,
    errors: result.errors,
  };
}

export function mailStatusToDb(
  status: MailOutreachRecord["status"],
): MailLeadStatus {
  return status;
}
