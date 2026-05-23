-- CreateTable
CREATE TABLE "OutreachAutopilot" (
    "branchId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "startedAt" TIMESTAMP(3),
    "stoppedAt" TIMESTAMP(3),
    "lastTickAt" TIMESTAMP(3),
    "lastTickSummary" JSONB,
    "scrapeProvinceId" TEXT,
    "ticksTotal" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutreachAutopilot_pkey" PRIMARY KEY ("branchId")
);
