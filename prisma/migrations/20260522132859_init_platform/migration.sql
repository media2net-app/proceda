-- CreateEnum
CREATE TYPE "AppointmentSource" AS ENUM ('cold-call', 'auto-mail');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('scheduled', 'completed', 'cancelled', 'no-show');

-- CreateEnum
CREATE TYPE "MailLeadStatus" AS ENUM ('draft', 'sent', 'booked');

-- CreateEnum
CREATE TYPE "InboxDirection" AS ENUM ('inbound', 'outbound');

-- CreateTable
CREATE TABLE "Business" (
    "id" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subcategory" TEXT NOT NULL,
    "address" TEXT NOT NULL DEFAULT '',
    "city" TEXT NOT NULL DEFAULT '',
    "province" TEXT NOT NULL DEFAULT '',
    "provinceId" TEXT,
    "branchId" TEXT NOT NULL DEFAULT 'makelaardij',
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "openingHours" TEXT,
    "source" TEXT NOT NULL DEFAULT 'google',
    "lat" DOUBLE PRECISION,
    "lon" DOUBLE PRECISION,
    "scrapedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Business_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL,
    "businessId" TEXT,
    "businessName" TEXT NOT NULL,
    "contactName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "source" "AppointmentSource" NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER NOT NULL DEFAULT 30,
    "meetLink" TEXT NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'scheduled',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MailOutreach" (
    "businessId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "status" "MailLeadStatus" NOT NULL DEFAULT 'draft',
    "recipientEmail" TEXT,
    "sentAt" TIMESTAMP(3),
    "bookedAt" TIMESTAMP(3),
    "appointmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MailOutreach_pkey" PRIMARY KEY ("businessId")
);

-- CreateTable
CREATE TABLE "InboxSyncState" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "syncedAt" TIMESTAMP(3),
    "lastSyncError" TEXT,
    "accountOk" BOOLEAN,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InboxSyncState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InboxMessage" (
    "id" TEXT NOT NULL,
    "uid" TEXT NOT NULL,
    "messageId" TEXT,
    "from" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "preview" TEXT NOT NULL DEFAULT '',
    "bodyText" TEXT,
    "bodyHtml" TEXT,
    "seen" BOOLEAN NOT NULL DEFAULT false,
    "direction" "InboxDirection" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InboxMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessReport" (
    "businessId" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "website" TEXT NOT NULL DEFAULT '',
    "generatedAt" TIMESTAMP(3) NOT NULL,
    "screenshotPath" TEXT,
    "pageTitle" TEXT,
    "metaDescription" TEXT,
    "extractedSnippet" TEXT NOT NULL DEFAULT '',
    "usesHttps" BOOLEAN NOT NULL DEFAULT true,
    "responseTimeMs" INTEGER NOT NULL DEFAULT 0,
    "seoScore" INTEGER NOT NULL DEFAULT 0,
    "modernityScore" INTEGER NOT NULL DEFAULT 0,
    "overallScore" INTEGER NOT NULL DEFAULT 0,
    "leadQuality" TEXT NOT NULL,
    "primaryAppType" TEXT NOT NULL,
    "detectedServices" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "servicesSummary" TEXT NOT NULL DEFAULT '',
    "extractedEmail" TEXT,
    "demoHomepageUrl" TEXT,
    "demoAppUrl" TEXT,
    "deepScrapeSummary" JSONB,
    "ai" JSONB NOT NULL,
    "fetchError" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessReport_pkey" PRIMARY KEY ("businessId")
);

-- CreateTable
CREATE TABLE "DeepScrape" (
    "businessId" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "website" TEXT NOT NULL,
    "scrapedAt" TIMESTAMP(3) NOT NULL,
    "brand" JSONB NOT NULL,
    "pages" JSONB NOT NULL DEFAULT '[]',
    "listings" JSONB NOT NULL DEFAULT '[]',
    "contact" JSONB NOT NULL,
    "tagline" TEXT,
    "services" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "aboutText" TEXT,
    "homepageScreenshotPath" TEXT,
    "errors" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeepScrape_pkey" PRIMARY KEY ("businessId")
);

-- CreateTable
CREATE TABLE "BrandAuditRun" (
    "id" TEXT NOT NULL,
    "scannedAt" TIMESTAMP(3) NOT NULL,
    "summary" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BrandAuditRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandAuditResult" (
    "businessId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "website" TEXT NOT NULL DEFAULT '',
    "demoReady" BOOLEAN NOT NULL DEFAULT false,
    "logoOk" BOOLEAN NOT NULL DEFAULT false,
    "logoUrl" TEXT,
    "colorCount" INTEGER NOT NULL DEFAULT 0,
    "colors" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "error" TEXT,
    "row" JSONB,

    CONSTRAINT "BrandAuditResult_pkey" PRIMARY KEY ("businessId")
);

-- CreateTable
CREATE TABLE "DemoBrand" (
    "demoSlug" TEXT NOT NULL,
    "businessId" TEXT,
    "businessName" TEXT NOT NULL,
    "website" TEXT NOT NULL DEFAULT '',
    "primary" TEXT,
    "secondary" TEXT,
    "accent" TEXT,
    "textColor" TEXT,
    "logoPath" TEXT,
    "logoOk" BOOLEAN NOT NULL DEFAULT false,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DemoBrand_pkey" PRIMARY KEY ("demoSlug")
);

-- CreateTable
CREATE TABLE "ScrapeProgress" (
    "branchId" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,
    "discoveryComplete" BOOLEAN NOT NULL DEFAULT false,
    "discoveryCursor" JSONB NOT NULL,
    "placeQueue" JSONB NOT NULL DEFAULT '[]',
    "enrichedPlaceIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "active" BOOLEAN,
    "phase" TEXT,
    "percent" DOUBLE PRECISION,
    "statusMessage" TEXT,
    "log" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "enrichingDone" INTEGER,
    "enrichingTotal" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScrapeProgress_pkey" PRIMARY KEY ("branchId","regionId")
);

-- CreateTable
CREATE TABLE "GooglePlacesUsage" (
    "provinceId" TEXT NOT NULL,
    "calls" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GooglePlacesUsage_pkey" PRIMARY KEY ("provinceId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Business_placeId_key" ON "Business"("placeId");

-- CreateIndex
CREATE INDEX "Business_branchId_provinceId_idx" ON "Business"("branchId", "provinceId");

-- CreateIndex
CREATE INDEX "Business_email_idx" ON "Business"("email");

-- CreateIndex
CREATE INDEX "Business_name_idx" ON "Business"("name");

-- CreateIndex
CREATE INDEX "Appointment_scheduledAt_idx" ON "Appointment"("scheduledAt");

-- CreateIndex
CREATE INDEX "Appointment_status_idx" ON "Appointment"("status");

-- CreateIndex
CREATE INDEX "Appointment_businessId_idx" ON "Appointment"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "MailOutreach_token_key" ON "MailOutreach"("token");

-- CreateIndex
CREATE UNIQUE INDEX "MailOutreach_appointmentId_key" ON "MailOutreach"("appointmentId");

-- CreateIndex
CREATE INDEX "MailOutreach_status_idx" ON "MailOutreach"("status");

-- CreateIndex
CREATE INDEX "MailOutreach_token_idx" ON "MailOutreach"("token");

-- CreateIndex
CREATE INDEX "InboxMessage_date_idx" ON "InboxMessage"("date");

-- CreateIndex
CREATE INDEX "InboxMessage_direction_idx" ON "InboxMessage"("direction");

-- CreateIndex
CREATE UNIQUE INDEX "InboxMessage_uid_key" ON "InboxMessage"("uid");

-- CreateIndex
CREATE INDEX "BrandAuditResult_runId_idx" ON "BrandAuditResult"("runId");

-- CreateIndex
CREATE INDEX "BrandAuditResult_demoReady_idx" ON "BrandAuditResult"("demoReady");

-- CreateIndex
CREATE UNIQUE INDEX "DemoBrand_businessId_key" ON "DemoBrand"("businessId");

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MailOutreach" ADD CONSTRAINT "MailOutreach_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MailOutreach" ADD CONSTRAINT "MailOutreach_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessReport" ADD CONSTRAINT "BusinessReport_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeepScrape" ADD CONSTRAINT "DeepScrape_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandAuditResult" ADD CONSTRAINT "BrandAuditResult_runId_fkey" FOREIGN KEY ("runId") REFERENCES "BrandAuditRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandAuditResult" ADD CONSTRAINT "BrandAuditResult_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemoBrand" ADD CONSTRAINT "DemoBrand_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE SET NULL ON UPDATE CASCADE;
