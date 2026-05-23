-- Outreach Fase 1: funnel events, send batches, CRM pipeline status

CREATE TYPE "OutreachPipelineStatus" AS ENUM ('lead', 'contacted', 'meeting', 'proposal', 'won', 'lost');

ALTER TABLE "MailOutreach" ADD COLUMN "sendBatch" TEXT;
ALTER TABLE "MailOutreach" ADD COLUMN "subjectVariant" TEXT DEFAULT 'default';
ALTER TABLE "MailOutreach" ADD COLUMN "pipelineStatus" "OutreachPipelineStatus" NOT NULL DEFAULT 'lead';

CREATE INDEX "MailOutreach_sendBatch_idx" ON "MailOutreach"("sendBatch");
CREATE INDEX "MailOutreach_pipelineStatus_idx" ON "MailOutreach"("pipelineStatus");

CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "sessionId" TEXT,
    "visitorId" TEXT,
    "mailToken" TEXT,
    "businessId" TEXT,
    "path" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AnalyticsEvent_eventName_createdAt_idx" ON "AnalyticsEvent"("eventName", "createdAt");
CREATE INDEX "AnalyticsEvent_mailToken_idx" ON "AnalyticsEvent"("mailToken");
CREATE INDEX "AnalyticsEvent_businessId_idx" ON "AnalyticsEvent"("businessId");
CREATE INDEX "AnalyticsEvent_sessionId_eventName_idx" ON "AnalyticsEvent"("sessionId", "eventName");
