-- Fase 3: outreach audit log

CREATE TABLE "OutreachAuditLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "businessId" TEXT,
    "branchId" TEXT,
    "actor" TEXT NOT NULL DEFAULT 'admin',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OutreachAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OutreachAuditLog_createdAt_idx" ON "OutreachAuditLog"("createdAt");
CREATE INDEX "OutreachAuditLog_businessId_idx" ON "OutreachAuditLog"("businessId");
CREATE INDEX "OutreachAuditLog_action_idx" ON "OutreachAuditLog"("action");
