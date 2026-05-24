import { listReportSummaries } from "./business-report-storage";
import { prisma } from "@/lib/db/prisma";
import {
  hasAutoMailerContact,
  hasCallListContact,
} from "./contact-utils";
import { DEFAULT_BRANCH, type ScrapeBranchId } from "./branches";
import {
  OUTREACH_BRANCH_IDS,
  type AdminVerticalScope,
} from "./outreach-branches";
import { loadAllBusinesses } from "./load-all-businesses";
import type { Bedrijf } from "./types";
import { PROVINCE_IDS, type ProvinceId } from "./provinces";
import { loadBedrijvenCache } from "./scraper";

/** Verwachte omzet per geslaagde deal (EUR). */
export const DEAL_VALUE_EUR = 3000;

export type OutreachKpi = {
  withEmail: number;
  withPhone: number;
  withWebsiteAndEmail: number;
  withWebsiteAndPhone: number;
  autoMailerQualified: number;
  callListQualified: number;
  /** Hete leads mét e-mail (auto mailer prioriteit) */
  autoMailerHot: number;
  /** Hete leads mét telefoon (bellijst prioriteit) */
  callListHot: number;
  /** Geen e-mail én geen telefoon */
  noOutreachChannel: number;
};

export type ProvinceKpiRow = {
  id: ProvinceId;
  name: string;
  businessCount: number;
  withWebsite: number;
  withEmail: number;
  withPhone: number;
  autoMailerQualified: number;
  callListQualified: number;
  reports: number;
  hotLeads: number;
  warmLeads: number;
  coldLeads: number;
  pipelineEur: number;
};

export type AdminKpiStats = {
  dealValueEur: number;
  totalBusinesses: number;
  withWebsite: number;
  reportsReady: number;
  hotLeads: number;
  warmLeads: number;
  coldLeads: number;
  avgLeadScore: number;
  /** Hete leads × dealwaarde — primaire omzetkans */
  revenueHotEur: number;
  /** (Hete + warme) × dealwaarde — max. pipeline */
  revenuePipelineEur: number;
  /** Geslaagde deals (handmatig/CRM — nog 0 tot tracking bestaat) */
  successfulDeals: number;
  revenueWonEur: number;
  outreach: OutreachKpi;
  provinces: ProvinceKpiRow[];
  updatedAt: string;
};

function countOutreach(businesses: Bedrijf[]): Omit<OutreachKpi, "autoMailerHot" | "callListHot"> {
  let withEmail = 0;
  let withPhone = 0;
  let withWebsiteAndEmail = 0;
  let withWebsiteAndPhone = 0;
  let autoMailerQualified = 0;
  let callListQualified = 0;
  let noOutreachChannel = 0;

  for (const b of businesses) {
    const email = hasAutoMailerContact(b);
    const phone = hasCallListContact(b);
    const website = !!b.website?.trim();

    if (email) withEmail++;
    if (phone) withPhone++;
    if (website && email) withWebsiteAndEmail++;
    if (website && phone) withWebsiteAndPhone++;
    if (email) autoMailerQualified++;
    if (phone) callListQualified++;
    if (!email && !phone) noOutreachChannel++;
  }

  return {
    withEmail,
    withPhone,
    withWebsiteAndEmail,
    withWebsiteAndPhone,
    autoMailerQualified,
    callListQualified,
    noOutreachChannel,
  };
}

function pipelineEur(hot: number, warm: number): number {
  return (hot + warm) * DEAL_VALUE_EUR;
}

function mergeProvinceRows(rows: ProvinceKpiRow[]): ProvinceKpiRow[] {
  const byId = new Map<string, ProvinceKpiRow>();
  for (const p of rows) {
    const cur = byId.get(p.id);
    if (!cur) {
      byId.set(p.id, { ...p });
      continue;
    }
    byId.set(p.id, {
      ...cur,
      businessCount: cur.businessCount + p.businessCount,
      withWebsite: cur.withWebsite + p.withWebsite,
      withEmail: cur.withEmail + p.withEmail,
      withPhone: cur.withPhone + p.withPhone,
      autoMailerQualified: cur.autoMailerQualified + p.autoMailerQualified,
      callListQualified: cur.callListQualified + p.callListQualified,
      reports: cur.reports + p.reports,
      hotLeads: cur.hotLeads + p.hotLeads,
      warmLeads: cur.warmLeads + p.warmLeads,
      coldLeads: cur.coldLeads + p.coldLeads,
      pipelineEur: cur.pipelineEur + p.pipelineEur,
    });
  }
  return [...byId.values()].sort((a, b) => b.businessCount - a.businessCount);
}

function mergeAdminKpiStats(parts: AdminKpiStats[]): AdminKpiStats {
  const first = parts[0]!;
  const sum = (fn: (s: AdminKpiStats) => number) =>
    parts.reduce((acc, s) => acc + fn(s), 0);

  const hotLeads = sum((s) => s.hotLeads);
  const warmLeads = sum((s) => s.warmLeads);

  return {
    dealValueEur: first.dealValueEur,
    totalBusinesses: sum((s) => s.totalBusinesses),
    withWebsite: sum((s) => s.withWebsite),
    reportsReady: sum((s) => s.reportsReady),
    hotLeads,
    warmLeads,
    coldLeads: sum((s) => s.coldLeads),
    avgLeadScore:
      sum((s) => s.reportsReady) > 0
        ? Math.round(
            parts.reduce(
              (acc, s) => acc + s.avgLeadScore * s.reportsReady,
              0,
            ) / sum((s) => s.reportsReady),
          )
        : 0,
    revenueHotEur: hotLeads * DEAL_VALUE_EUR,
    revenuePipelineEur: pipelineEur(hotLeads, warmLeads),
    successfulDeals: sum((s) => s.successfulDeals),
    revenueWonEur: sum((s) => s.revenueWonEur),
    outreach: {
      withEmail: sum((s) => s.outreach.withEmail),
      withPhone: sum((s) => s.outreach.withPhone),
      withWebsiteAndEmail: sum((s) => s.outreach.withWebsiteAndEmail),
      withWebsiteAndPhone: sum((s) => s.outreach.withWebsiteAndPhone),
      autoMailerQualified: sum((s) => s.outreach.autoMailerQualified),
      callListQualified: sum((s) => s.outreach.callListQualified),
      autoMailerHot: sum((s) => s.outreach.autoMailerHot),
      callListHot: sum((s) => s.outreach.callListHot),
      noOutreachChannel: sum((s) => s.outreach.noOutreachChannel),
    },
    provinces: mergeProvinceRows(parts.flatMap((s) => s.provinces)),
    updatedAt: new Date().toISOString(),
  };
}

export async function getAdminKpiStatsForScope(
  scope: AdminVerticalScope,
): Promise<AdminKpiStats> {
  if (scope === "all") {
    const parts = await Promise.all(
      OUTREACH_BRANCH_IDS.map((id) => getAdminKpiStats(id)),
    );
    return mergeAdminKpiStats(parts);
  }
  return getAdminKpiStats(scope);
}

export async function getAdminKpiStats(
  branchId: ScrapeBranchId = DEFAULT_BRANCH,
): Promise<AdminKpiStats> {
  const businesses = await loadAllBusinesses(branchId);
  const byId = new Map(businesses.map((b) => [b.id, b]));
  const summaries = await listReportSummaries(byId);

  let hotLeads = 0;
  let warmLeads = 0;
  let coldLeads = 0;
  let scoreSum = 0;
  let scoreCount = 0;

  for (const s of summaries) {
    if (s.leadQuality === "hot") hotLeads++;
    else if (s.leadQuality === "warm") warmLeads++;
    else coldLeads++;
    scoreSum += s.overallScore;
    scoreCount++;
  }

  const withWebsite = businesses.filter((b) => b.website?.trim()).length;

  const outreachBase = countOutreach(businesses);
  let autoMailerHot = 0;
  let callListHot = 0;
  for (const s of summaries) {
    if (s.leadQuality !== "hot") continue;
    const b = byId.get(s.businessId);
    if (!b) continue;
    if (hasAutoMailerContact(b)) autoMailerHot++;
    if (hasCallListContact(b)) callListHot++;
  }
  const outreach: OutreachKpi = {
    ...outreachBase,
    autoMailerHot,
    callListHot,
  };

  const provinces: ProvinceKpiRow[] = [];
  for (const id of PROVINCE_IDS) {
    const cache = await loadBedrijvenCache(branchId, id);
    if (!cache || cache.count === 0) continue;

    const provBusinesses = cache.businesses;
    const provIds = new Set(provBusinesses.map((b) => b.id));
    const provReports = summaries.filter((s) => provIds.has(s.businessId));

    let pHot = 0;
    let pWarm = 0;
    let pCold = 0;
    for (const r of provReports) {
      if (r.leadQuality === "hot") pHot++;
      else if (r.leadQuality === "warm") pWarm++;
      else pCold++;
    }

    const provOutreach = countOutreach(provBusinesses);

    provinces.push({
      id,
      name: cache.provinceName,
      businessCount: provBusinesses.length,
      withWebsite: provBusinesses.filter((b) => b.website?.trim()).length,
      withEmail: provOutreach.withEmail,
      withPhone: provOutreach.withPhone,
      autoMailerQualified: provOutreach.autoMailerQualified,
      callListQualified: provOutreach.callListQualified,
      reports: provReports.length,
      hotLeads: pHot,
      warmLeads: pWarm,
      coldLeads: pCold,
      pipelineEur: pipelineEur(pHot, pWarm),
    });
  }

  const successfulDeals = await prisma.mailOutreach.count({
    where: {
      pipelineStatus: "won",
      business: { branchId },
    },
  });

  return {
    dealValueEur: DEAL_VALUE_EUR,
    totalBusinesses: businesses.length,
    withWebsite,
    reportsReady: summaries.length,
    hotLeads,
    warmLeads,
    coldLeads,
    avgLeadScore: scoreCount > 0 ? Math.round(scoreSum / scoreCount) : 0,
    revenueHotEur: hotLeads * DEAL_VALUE_EUR,
    revenuePipelineEur: pipelineEur(hotLeads, warmLeads),
    successfulDeals,
    revenueWonEur: successfulDeals * DEAL_VALUE_EUR,
    outreach,
    provinces: provinces.sort((a, b) => b.businessCount - a.businessCount),
    updatedAt: new Date().toISOString(),
  };
}
