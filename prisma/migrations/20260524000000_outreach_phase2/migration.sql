-- Fase 2: sequences, suppression, appointment reminders

ALTER TABLE "MailOutreach" ADD COLUMN "doNotMail" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "MailOutreach" ADD COLUMN "sequenceStep" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "MailOutreach" ADD COLUMN "sequenceNextAt" TIMESTAMP(3);

ALTER TABLE "Appointment" ADD COLUMN "reminder24SentAt" TIMESTAMP(3);
ALTER TABLE "Appointment" ADD COLUMN "reminder1SentAt" TIMESTAMP(3);

CREATE INDEX "MailOutreach_sequenceNextAt_idx" ON "MailOutreach"("sequenceNextAt");
CREATE INDEX "MailOutreach_doNotMail_idx" ON "MailOutreach"("doNotMail");
