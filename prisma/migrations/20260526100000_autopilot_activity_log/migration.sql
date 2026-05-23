-- AlterTable
ALTER TABLE "OutreachAutopilot" ADD COLUMN "activityLog" JSONB;
ALTER TABLE "OutreachAutopilot" ADD COLUMN "tickInProgress" BOOLEAN NOT NULL DEFAULT false;
