-- CreateTable
CREATE TABLE "AnalyticsSession" (
    "sessionId" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "countryCode" TEXT,
    "city" TEXT,
    "region" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "userAgent" TEXT,
    "referrer" TEXT,
    "currentPath" TEXT NOT NULL DEFAULT '/',
    "funnelLabel" TEXT,
    "bookingActive" BOOLEAN NOT NULL DEFAULT false,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsSession_pkey" PRIMARY KEY ("sessionId")
);

-- CreateTable
CREATE TABLE "AnalyticsPageView" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "funnelLabel" TEXT,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsPageView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AnalyticsSession_lastSeenAt_idx" ON "AnalyticsSession"("lastSeenAt");

-- CreateIndex
CREATE INDEX "AnalyticsSession_visitorId_idx" ON "AnalyticsSession"("visitorId");

-- CreateIndex
CREATE INDEX "AnalyticsPageView_viewedAt_idx" ON "AnalyticsPageView"("viewedAt");

-- CreateIndex
CREATE INDEX "AnalyticsPageView_sessionId_idx" ON "AnalyticsPageView"("sessionId");

-- CreateIndex
CREATE INDEX "AnalyticsPageView_path_idx" ON "AnalyticsPageView"("path");

-- AddForeignKey
ALTER TABLE "AnalyticsPageView" ADD CONSTRAINT "AnalyticsPageView_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AnalyticsSession"("sessionId") ON DELETE CASCADE ON UPDATE CASCADE;
