-- Browser lead scrape progress (serverless / Vercel — geen data/ filesystem)
CREATE TABLE "BrowserScrapeProgress" (
    "branchId" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,
    "queries" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "queryIndex" INTEGER NOT NULL DEFAULT 0,
    "urlQueue" JSONB NOT NULL DEFAULT '[]',
    "enrichedHosts" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "discoveryComplete" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN,
    "phase" TEXT,
    "percent" DOUBLE PRECISION,
    "log" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "lastBatchAttemptAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BrowserScrapeProgress_pkey" PRIMARY KEY ("branchId","regionId")
);
