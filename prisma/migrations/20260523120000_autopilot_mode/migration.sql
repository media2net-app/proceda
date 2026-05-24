-- Autopilot mode: full outreach vs scrape-only
ALTER TABLE "OutreachAutopilot" ADD COLUMN "mode" TEXT NOT NULL DEFAULT 'full';
