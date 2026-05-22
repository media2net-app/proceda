/**
 * Import bestaande JSON-data naar Prisma Postgres.
 * Run: npx tsx scripts/seed-db-from-json.ts
 */
import "dotenv/config";
import fs from "fs/promises";
import path from "path";
import { prisma } from "../src/lib/db/prisma";
import type { Bedrijf, BedrijvenCache } from "../src/lib/bedrijven/types";
import type { LeadAppointment } from "../src/lib/afspraken/types";
import type { MailOutreachRecord } from "../src/lib/mail/types";
import type { BusinessReport } from "../src/lib/bedrijven/business-report-types";
import type { DeepScrapeResult } from "../src/lib/bedrijven/deep-scrape-types";
import type {
  DemoReadyAuditFile,
  DemoReadyAuditRow,
} from "../src/lib/bedrijven/demo-ready-audit";
import type { DemoBrandsFile } from "../src/lib/demo-homepage/demo-brand-registry";
import type { MailInboxCache } from "../src/lib/mail/types";

const ROOT = process.cwd();

async function readJson<T>(filePath: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function seedBusinesses(): Promise<number> {
  const dir = path.join(ROOT, "data", "bedrijven");
  let count = 0;
  let branches: string[];
  try {
    branches = await fs.readdir(dir);
  } catch {
    return 0;
  }

  for (const branchId of branches) {
    const branchPath = path.join(dir, branchId);
    const stat = await fs.stat(branchPath).catch(() => null);
    if (!stat?.isDirectory()) continue;

    const files = await fs.readdir(branchPath);
    for (const file of files) {
      if (!file.endsWith(".json") || file.includes("-progress")) continue;
      const cache = await readJson<BedrijvenCache>(
        path.join(branchPath, file),
      );
      if (!cache?.businesses?.length) continue;

      for (const b of cache.businesses) {
        const business: Bedrijf = {
          ...b,
          branchId: cache.branch,
          provinceId: cache.province,
        };
        await prisma.business.upsert({
          where: { id: business.id },
          create: {
            id: business.id,
            placeId: business.placeId,
            name: business.name,
            category: business.category,
            subcategory: business.subcategory,
            address: business.address ?? "",
            city: business.city ?? "",
            province: business.province ?? "",
            provinceId: business.provinceId ?? null,
            branchId: business.branchId ?? cache.branch,
            phone: business.phone ?? null,
            email: business.email ?? null,
            website: business.website ?? null,
            openingHours: business.openingHours ?? null,
            source: business.source,
            lat: business.lat ?? null,
            lon: business.lon ?? null,
          },
          update: {
            name: business.name,
            email: business.email ?? null,
            website: business.website ?? null,
            scrapedAt: new Date(),
          },
        });
        count++;
        if (count % 200 === 0) console.log(`  businesses: ${count}`);
      }
    }
  }
  return count;
}

async function seedAppointments(): Promise<number> {
  const data = await readJson<{ appointments: LeadAppointment[] }>(
    path.join(ROOT, "data", "afspraken.json"),
  );
  if (!data?.appointments?.length) return 0;

  for (const a of data.appointments) {
    if (a.businessId) {
      await prisma.business.upsert({
        where: { id: a.businessId },
        create: {
          id: a.businessId,
          placeId: a.businessId,
          name: a.businessName,
          category: "services",
          subcategory: "unknown",
        },
        update: { name: a.businessName },
      });
    }

    await prisma.appointment.upsert({
      where: { id: a.id },
      create: {
        id: a.id,
        businessId: a.businessId ?? null,
        businessName: a.businessName,
        contactName: a.contactName ?? null,
        email: a.email ?? null,
        phone: a.phone ?? null,
        source: a.source === "cold-call" ? "cold_call" : "auto_mail",
        scheduledAt: new Date(a.scheduledAt),
        durationMinutes: a.durationMinutes,
        meetLink: a.meetLink,
        status:
          a.status === "no-show"
            ? "no_show"
            : a.status,
        notes: a.notes ?? null,
        createdAt: new Date(a.createdAt),
        updatedAt: new Date(a.updatedAt),
      },
      update: {},
    });
  }
  return data.appointments.length;
}

async function seedMailOutreach(): Promise<number> {
  const data = await readJson<{ records: MailOutreachRecord[] }>(
    path.join(ROOT, "data", "mail-outreach.json"),
  );
  if (!data?.records?.length) return 0;

  for (const r of data.records) {
    await prisma.business.upsert({
      where: { id: r.businessId },
      create: {
        id: r.businessId,
        placeId: r.businessId,
        name: r.businessId,
        category: "services",
        subcategory: "unknown",
        email: r.recipientEmail ?? null,
      },
      update: { email: r.recipientEmail ?? undefined },
    });

    await prisma.mailOutreach.upsert({
      where: { businessId: r.businessId },
      create: {
        businessId: r.businessId,
        token: r.token,
        status: r.status,
        recipientEmail: r.recipientEmail ?? null,
        sentAt: r.sentAt ? new Date(r.sentAt) : null,
        bookedAt: r.bookedAt ? new Date(r.bookedAt) : null,
        appointmentId: r.appointmentId ?? null,
        createdAt: new Date(r.createdAt),
        updatedAt: new Date(r.updatedAt),
      },
      update: {
        status: r.status,
        appointmentId: r.appointmentId ?? null,
      },
    });
  }
  return data.records.length;
}

async function seedInbox(): Promise<number> {
  const cache = await readJson<MailInboxCache>(
    path.join(ROOT, "data", "mail-inbox.json"),
  );
  if (!cache) return 0;

  await prisma.inboxMessage.deleteMany();
  if (cache.messages.length) {
    await prisma.inboxMessage.createMany({
      data: cache.messages.map((m) => ({
        uid: String(m.uid),
        messageId: m.messageId ?? null,
        fromAddr: m.from,
        toAddr: m.to,
        subject: m.subject,
        date: new Date(m.date),
        preview: m.preview,
        bodyText: m.bodyText ?? null,
        bodyHtml: m.bodyHtml ?? null,
        seen: m.seen,
        direction: m.direction,
      })),
      skipDuplicates: true,
    });
  }

  await prisma.inboxSyncState.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      syncedAt: cache.syncedAt ? new Date(cache.syncedAt) : null,
      lastSyncError: cache.lastSyncError ?? null,
      accountOk: cache.accountOk ?? null,
    },
    update: {
      syncedAt: cache.syncedAt ? new Date(cache.syncedAt) : null,
      lastSyncError: cache.lastSyncError ?? null,
      accountOk: cache.accountOk ?? null,
    },
  });

  return cache.messages.length;
}

async function seedReports(): Promise<number> {
  const dir = path.join(ROOT, "data", "business-reports");
  let files: string[];
  try {
    files = await fs.readdir(dir);
  } catch {
    return 0;
  }

  let n = 0;
  for (const file of files.filter((f) => f.endsWith(".json"))) {
    const report = await readJson<BusinessReport>(path.join(dir, file));
    if (!report?.businessId || !report.ai) continue;

    await prisma.business.upsert({
      where: { id: report.businessId },
      create: {
        id: report.businessId,
        placeId: report.businessId,
        name: report.businessName,
        category: "services",
        subcategory: "unknown",
        website: report.website || null,
      },
      update: { name: report.businessName },
    });

    await prisma.businessReport.upsert({
      where: { businessId: report.businessId },
      create: {
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
        detectedServices: report.detectedServices ?? [],
        servicesSummary: report.servicesSummary ?? "",
        extractedEmail: report.extractedEmail ?? null,
        demoHomepageUrl: report.demoHomepageUrl ?? null,
        demoAppUrl: report.demoAppUrl ?? null,
        deepScrapeSummary: report.deepScrape ?? undefined,
        ai: report.ai,
        fetchError: report.fetchError ?? null,
      },
      update: { generatedAt: new Date(report.generatedAt) },
    });
    n++;
  }
  return n;
}

async function seedDeepScrapes(): Promise<number> {
  const dir = path.join(ROOT, "data", "deep-scrapes");
  let files: string[];
  try {
    files = await fs.readdir(dir);
  } catch {
    return 0;
  }

  let n = 0;
  for (const file of files.filter((f) => f.endsWith(".json"))) {
    const data = await readJson<DeepScrapeResult>(path.join(dir, file));
    if (!data?.businessId) continue;

    await prisma.business.upsert({
      where: { id: data.businessId },
      create: {
        id: data.businessId,
        placeId: data.businessId,
        name: data.businessName,
        category: "services",
        subcategory: "unknown",
        website: data.website,
      },
      update: { name: data.businessName },
    });

    await prisma.deepScrape.upsert({
      where: { businessId: data.businessId },
      create: {
        businessId: data.businessId,
        businessName: data.businessName,
        website: data.website,
        scrapedAt: new Date(data.scrapedAt),
        brand: data.brand,
        pages: data.pages,
        listings: data.listings,
        contact: data.contact,
        tagline: data.tagline ?? null,
        services: data.services,
        aboutText: data.aboutText ?? null,
        homepageScreenshotPath: data.homepageScreenshotPath ?? null,
        errors: data.errors,
      },
      update: { scrapedAt: new Date(data.scrapedAt) },
    });
    n++;
  }
  return n;
}

async function seedBrandAudit(): Promise<number> {
  const audit = await readJson<DemoReadyAuditFile>(
    path.join(ROOT, "data", "demo-ready-audit.json"),
  );
  if (!audit?.results?.length) return 0;

  const existing = await prisma.brandAuditRun.findFirst({
    orderBy: { scannedAt: "desc" },
  });
  if (existing) {
    console.log("  brand audit: already in DB, skip");
    return 0;
  }

  const run = await prisma.brandAuditRun.create({
    data: {
      scannedAt: new Date(audit.summary.scannedAt),
      summary: audit.summary,
    },
  });

  const batch: {
    businessId: string;
    runId: string;
    name: string;
    website: string;
    demoReady: boolean;
    logoOk: boolean;
    logoUrl: string | null;
    colorCount: number;
    colors: string[];
    error: string | null;
    row: object;
  }[] = [];

  for (const row of audit.results) {
    batch.push(auditRowToDb(run.id, row));
    if (batch.length >= 100) {
      await prisma.brandAuditResult.createMany({ data: batch, skipDuplicates: true });
      batch.length = 0;
    }
  }
  if (batch.length) {
    await prisma.brandAuditResult.createMany({ data: batch, skipDuplicates: true });
  }

  return audit.results.length;
}

function auditRowToDb(runId: string, row: DemoReadyAuditRow) {
  return {
    businessId: row.businessId,
    runId,
    name: row.name,
    website: row.website,
    demoReady: row.demoReady,
    logoOk: row.hasLogo,
    logoUrl: row.logoUrl,
    colorCount: row.colorCount,
    colors: row.brandColors ?? [row.primaryColor, row.secondaryColor, row.accentColor].filter(Boolean) as string[],
    error: row.error,
    row: row as object,
  };
}

async function seedDemoBrands(): Promise<number> {
  const file = await readJson<DemoBrandsFile>(
    path.join(ROOT, "data", "demo-brands.json"),
  );
  if (!file?.brands) return 0;

  let n = 0;
  for (const [demoSlug, entry] of Object.entries(file.brands)) {
    if (entry.businessId && !entry.businessId.startsWith("manual/")) {
      await prisma.business.upsert({
        where: { id: entry.businessId },
        create: {
          id: entry.businessId,
          placeId: entry.businessId,
          name: entry.businessName,
          category: "services",
          subcategory: "real_estate_agency",
          website: entry.website || null,
        },
        update: { name: entry.businessName },
      });
    }

    await prisma.demoBrand.upsert({
      where: { demoSlug },
      create: {
        demoSlug,
        businessId: entry.businessId?.startsWith("manual/")
          ? null
          : entry.businessId,
        businessName: entry.businessName,
        website: entry.website,
        primary: entry.primaryColor,
        secondary: entry.secondaryColor,
        accent: entry.accentColor,
        textColor: entry.textColor,
        logoPath: entry.logoPath,
        logoOk: entry.logoOk,
        generatedAt: new Date(file.generatedAt),
      },
      update: {
        primary: entry.primaryColor,
        logoPath: entry.logoPath,
        logoOk: entry.logoOk,
      },
    });
    n++;
  }
  return n;
}

async function main() {
  console.log("Seeding Proceda database from JSON…\n");

  const businesses = await seedBusinesses();
  console.log(`✓ businesses: ${businesses}`);

  const appointments = await seedAppointments();
  console.log(`✓ appointments: ${appointments}`);

  const mail = await seedMailOutreach();
  console.log(`✓ mail outreach: ${mail}`);

  const inbox = await seedInbox();
  console.log(`✓ inbox messages: ${inbox}`);

  const reports = await seedReports();
  console.log(`✓ business reports: ${reports}`);

  const deep = await seedDeepScrapes();
  console.log(`✓ deep scrapes: ${deep}`);

  const audit = await seedBrandAudit();
  console.log(`✓ brand audit rows: ${audit}`);

  const brands = await seedDemoBrands();
  console.log(`✓ demo brands: ${brands}`);

  console.log("\nDone.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
