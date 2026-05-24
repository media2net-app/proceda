import "server-only";

import { BRANCHES, type ScrapeBranchId } from "@/lib/bedrijven/branches";
import {
  OUTREACH_BRANCH_IDS,
  PLANNED_OUTREACH_VERTICALS,
  type OutreachBranchId,
} from "@/lib/bedrijven/outreach-branches";
import { prisma } from "@/lib/db/prisma";
import {
  ADMIN_VERTICAL_LEAD_TARGET,
  type AdminVerticalHubRow,
  type AdminVerticalSummariesResponse,
} from "@/lib/admin/vertical-summary-types";

export {
  ADMIN_VERTICAL_LEAD_TARGET,
  type AdminVerticalHubRow,
  type AdminVerticalSummariesResponse,
} from "@/lib/admin/vertical-summary-types";

const CACHE_MS = 30_000;
let cache: { at: number; payload: AdminVerticalSummariesResponse } | null = null;

async function countVerticalRow(
  id: string,
  name: string,
  status: "active" | "planned",
): Promise<AdminVerticalHubRow> {
  const businessWhere = { branchId: id };
  const withEmailWhere = {
    branchId: id,
    email: { not: null },
    NOT: { email: "" },
  };

  const [
    businessCount,
    withEmail,
    mailDraft,
    mailSent,
    mailBooked,
    followupReady,
  ] = await Promise.all([
    prisma.business.count({ where: businessWhere }),
    prisma.business.count({ where: withEmailWhere }),
    prisma.mailOutreach.count({
      where: { business: { branchId: id }, status: "draft" },
    }),
    prisma.mailOutreach.count({
      where: {
        business: { branchId: id },
        status: { in: ["sent", "booked"] },
      },
    }),
    prisma.mailOutreach.count({
      where: { business: { branchId: id }, status: "booked" },
    }),
    prisma.mailOutreach.count({
      where: {
        business: { branchId: id },
        status: "sent",
        followupSentAt: null,
      },
    }),
  ]);

  return {
    id,
    name,
    status,
    businessCount,
    withEmail,
    leadTarget: ADMIN_VERTICAL_LEAD_TARGET,
    mail: {
      concept: mailDraft,
      pool: withEmail,
      sent: mailSent,
      booked: mailBooked,
      followupReady,
      demoClicked: 0,
    },
  };
}

export async function getAdminVerticalSummaries(
  options?: { fresh?: boolean },
): Promise<AdminVerticalSummariesResponse> {
  const now = Date.now();
  if (!options?.fresh && cache && now - cache.at < CACHE_MS) {
    return cache.payload;
  }

  const activeRows = await Promise.all(
    OUTREACH_BRANCH_IDS.map((id) =>
      countVerticalRow(
        id,
        BRANCHES[id as ScrapeBranchId]?.name ?? id,
        "active",
      ),
    ),
  );

  const plannedRows = await Promise.all(
    PLANNED_OUTREACH_VERTICALS.map((v) =>
      countVerticalRow(v.id, v.name, "planned"),
    ),
  );

  const payload: AdminVerticalSummariesResponse = {
    rows: [...activeRows, ...plannedRows],
    updatedAt: new Date().toISOString(),
  };

  cache = { at: now, payload };
  return payload;
}

/** @deprecated Use rows from getAdminVerticalSummaries */
export type AdminVerticalSummary = AdminVerticalHubRow & {
  id: OutreachBranchId;
};
