-- UTM tracking on analytics sessions + mail bounces

ALTER TABLE "AnalyticsSession" ADD COLUMN "utmCampaign" TEXT;
ALTER TABLE "AnalyticsSession" ADD COLUMN "utmSource" TEXT;
ALTER TABLE "AnalyticsSession" ADD COLUMN "utmMedium" TEXT;
ALTER TABLE "AnalyticsSession" ADD COLUMN "utmContent" TEXT;

CREATE INDEX "AnalyticsSession_utmCampaign_idx" ON "AnalyticsSession"("utmCampaign");

CREATE TABLE "MailBounce" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "businessId" TEXT,
    "reason" TEXT,
    "source" TEXT NOT NULL DEFAULT 'inbox',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MailBounce_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MailBounce_email_idx" ON "MailBounce"("email");
CREATE INDEX "MailBounce_createdAt_idx" ON "MailBounce"("createdAt");

CREATE TABLE "WaitlistEntry" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "branchId" TEXT NOT NULL DEFAULT 'makelaardij',
    "companyName" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'nl',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WaitlistEntry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WaitlistEntry_email_branchId_key" ON "WaitlistEntry"("email", "branchId");
CREATE INDEX "WaitlistEntry_branchId_idx" ON "WaitlistEntry"("branchId");
