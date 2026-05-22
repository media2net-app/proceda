"use client";

import { Link } from "@/i18n/navigation";
import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { AdminKpiStats } from "@/lib/bedrijven/kpi-stats";
import { LEAD_QUALITY_THRESHOLDS, LEAD_SCORE_WEIGHTS } from "@/lib/bedrijven/lead-score";

function formatEur(value: number, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

function KpiCard({
  label,
  value,
  sub,
  accent = false,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-5 shadow-xs ${
        accent
          ? "border-[#D6BBFB] bg-gradient-to-br from-[#F9F5FF] to-white"
          : "border-[#EAECF0] bg-white"
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-[#667085]">{label}</p>
      <p
        className={`mt-2 text-3xl font-bold tabular-nums ${
          accent ? "text-[#7F56D9]" : "text-[#101828]"
        }`}
      >
        {value}
      </p>
      {sub && <p className="mt-1 text-xs text-[#667085]">{sub}</p>}
    </div>
  );
}

function QualityTierCard({
  title,
  range,
  description,
  meaning,
  pipelineNote,
  count,
  colorClass,
  borderClass,
}: {
  title: string;
  range: string;
  description: string;
  meaning: string;
  pipelineNote: string;
  count: number;
  colorClass: string;
  borderClass: string;
}) {
  return (
    <div className={`rounded-xl border p-4 ${borderClass} bg-white`}>
      <div className="flex items-start justify-between gap-2">
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${colorClass}`}
        >
          {title}
        </span>
        <span className="tabular-nums text-lg font-bold text-[#101828]">{count}</span>
      </div>
      <p className="mt-3 text-sm font-semibold text-[#344054]">
        Leadscore {range}
      </p>
      <p className="mt-2 text-sm text-[#475467]">{description}</p>
      <p className="mt-2 text-xs text-[#667085]">
        <span className="font-semibold text-[#6941C6]">{meaning}</span>
      </p>
      <p className="mt-2 text-xs text-[#98A2B3]">{pipelineNote}</p>
    </div>
  );
}

function LeadBar({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="font-medium text-[#344054]">{label}</span>
        <span className="tabular-nums text-[#667085]">
          {count} ({pct}%)
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[#F2F4F7]">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function AdminKpiDashboard() {
  const t = useTranslations("adminKpi");
  const locale = useLocale();
  const [stats, setStats] = useState<AdminKpiStats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/bedrijven/kpi");
      if (res.ok) setStats((await res.json()) as AdminKpiStats);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [load]);

  const numberLocale = locale === "ro" ? "ro-RO" : locale === "nl" ? "nl-NL" : "en-GB";
  const totalLeads = stats
    ? stats.hotLeads + stats.warmLeads + stats.coldLeads
    : 0;

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#101828]">{t("title")}</h1>
          <p className="mt-1 text-sm text-[#667085]">{t("subtitle")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard-admin/bedrijven"
            className="rounded-lg border border-[#D0D5DD] bg-white px-4 py-2 text-sm font-semibold text-[#344054] shadow-xs hover:bg-[#F9FAFB]"
          >
            {t("goBedrijven")} →
          </Link>
          <Link
            href="/dashboard-admin/rapportage"
            className="rounded-lg bg-[#7F56D9] px-4 py-2 text-sm font-semibold text-white hover:bg-[#6941C6]"
          >
            {t("goRapportage")} →
          </Link>
        </div>
      </div>

      {loading && !stats ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-[#F2F4F7]" />
          ))}
        </div>
      ) : stats ? (
        <>
          <div className="mb-2 flex items-center gap-2 rounded-lg border border-[#D6BBFB] bg-[#F9F5FF] px-4 py-3 text-sm text-[#6941C6]">
            <span className="font-semibold">{t("dealValueLabel")}:</span>
            <span className="tabular-nums font-bold">
              {formatEur(stats.dealValueEur, numberLocale)}
            </span>
            <span className="text-[#667085]">— {t("dealValueHint")}</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              accent
              label={t("revenueHot")}
              value={formatEur(stats.revenueHotEur, numberLocale)}
              sub={t("revenueHotSub", { count: String(stats.hotLeads) })}
            />
            <KpiCard
              label={t("revenuePipeline")}
              value={formatEur(stats.revenuePipelineEur, numberLocale)}
              sub={t("revenuePipelineSub", {
                hot: String(stats.hotLeads),
                warm: String(stats.warmLeads),
              })}
            />
            <KpiCard
              label={t("revenueWon")}
              value={formatEur(stats.revenueWonEur, numberLocale)}
              sub={t("revenueWonSub", { deals: String(stats.successfulDeals) })}
            />
            <KpiCard
              label={t("avgLeadScore")}
              value={String(stats.avgLeadScore)}
              sub={t("avgLeadScoreSub")}
            />
          </div>

          <div className="mt-6 rounded-xl border border-[#D6BBFB] bg-gradient-to-br from-[#F9F5FF] to-white p-5 shadow-xs">
            <h2 className="text-base font-semibold text-[#101828]">{t("outreachTitle")}</h2>
            <p className="mt-1 text-sm text-[#667085]">{t("outreachSubtitle")}</p>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard
                accent
                label={t("autoMailerQualified")}
                value={String(stats.outreach.autoMailerQualified)}
                sub={t("autoMailerQualifiedSub", {
                  hot: String(stats.outreach.autoMailerHot),
                  total: String(stats.totalBusinesses),
                })}
              />
              <KpiCard
                accent
                label={t("callListQualified")}
                value={String(stats.outreach.callListQualified)}
                sub={t("callListQualifiedSub", {
                  hot: String(stats.outreach.callListHot),
                  total: String(stats.totalBusinesses),
                })}
              />
              <KpiCard
                label={t("withEmail")}
                value={String(stats.outreach.withEmail)}
                sub={t("withEmailSub", {
                  both: String(stats.outreach.withWebsiteAndEmail),
                })}
              />
              <KpiCard
                label={t("withPhone")}
                value={String(stats.outreach.withPhone)}
                sub={t("withPhoneSub", {
                  both: String(stats.outreach.withWebsiteAndPhone),
                })}
              />
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-[#ABEFC6] bg-[#ECFDF3] p-3 text-sm">
                <p className="font-semibold text-[#027A48]">{t("autoMailerRule")}</p>
                <p className="mt-1 text-xs text-[#027A48]/90">{t("autoMailerRuleDesc")}</p>
              </div>
              <div className="rounded-lg border border-[#B2DDFF] bg-[#EFF8FF] p-3 text-sm">
                <p className="font-semibold text-[#175CD3]">{t("callListRule")}</p>
                <p className="mt-1 text-xs text-[#175CD3]/90">{t("callListRuleDesc")}</p>
              </div>
            </div>

            {stats.outreach.noOutreachChannel > 0 && (
              <p className="mt-3 text-xs text-[#667085]">
                {t("noOutreachChannel", {
                  count: String(stats.outreach.noOutreachChannel),
                })}
              </p>
            )}
          </div>

          <div className="mt-6 rounded-xl border border-[#EAECF0] bg-white p-5 shadow-xs">
            <h2 className="text-base font-semibold text-[#101828]">{t("googleCostsTitle")}</h2>
            <p className="mt-1 text-xs text-[#667085]">{stats.googlePlaces.pricingNote}</p>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <KpiCard
                accent
                label={t("googleCostEstimated")}
                value={formatEur(stats.googlePlaces.estimated.costEur, numberLocale)}
                sub={t("googleCostEstimatedSub", {
                  calls: String(stats.googlePlaces.estimated.totalCalls),
                })}
              />
              <KpiCard
                label={t("googleCostTracked")}
                value={formatEur(stats.googlePlaces.tracked.costEur, numberLocale)}
                sub={t("googleCostTrackedSub", {
                  calls: String(stats.googlePlaces.tracked.totalCalls),
                })}
              />
              <KpiCard
                label={t("googleCostDetails")}
                value={String(stats.googlePlaces.estimated.placeDetails)}
                sub={t("googleCostDetailsSub", {
                  price: formatEur(
                    stats.googlePlaces.pricingUsdPerCall.placeDetails *
                      stats.googlePlaces.usdToEur,
                    locale,
                  ),
                })}
              />
            </div>

            <div className="mt-4 overflow-x-auto rounded-lg border border-[#EAECF0]">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead>
                  <tr className="bg-[#F9FAFB] text-xs uppercase text-[#667085]">
                    <th className="px-3 py-2 font-semibold">{t("googleColType")}</th>
                    <th className="px-3 py-2 font-semibold">{t("googleColCalls")}</th>
                    <th className="px-3 py-2 font-semibold">{t("googleColEstEur")}</th>
                  </tr>
                </thead>
                <tbody>
                  {(
                    [
                      ["nearbySearch", stats.googlePlaces.estimated.nearbySearch],
                      ["textSearch", stats.googlePlaces.estimated.textSearch],
                      ["placeDetails", stats.googlePlaces.estimated.placeDetails],
                    ] as const
                  ).map(([key, calls]) => {
                    const price =
                      stats.googlePlaces.pricingUsdPerCall[key] *
                      stats.googlePlaces.usdToEur;
                    return (
                      <tr key={key} className="border-t border-[#F2F4F7]">
                        <td className="px-3 py-2 font-medium text-[#344054]">
                          {t(`googleType.${key}`)}
                        </td>
                        <td className="px-3 py-2 tabular-nums text-[#475467]">{calls}</td>
                        <td className="px-3 py-2 tabular-nums text-[#6941C6]">
                          {formatEur(calls * price, numberLocale)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <p className="mt-3 text-xs text-[#98A2B3]">
              {t("googlePricingRef")}{" "}
              <a
                href="https://developers.google.com/maps/billing-and-pricing/pricing"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#6941C6] hover:underline"
              >
                Google Maps Platform pricing
              </a>
            </p>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              label={t("totalBusinesses")}
              value={String(stats.totalBusinesses)}
              sub={t("withWebsiteSub", { count: String(stats.withWebsite) })}
            />
            <KpiCard
              label={t("reportsReady")}
              value={String(stats.reportsReady)}
              sub={t("reportsReadySub")}
            />
            <KpiCard
              label={t("hotLeads")}
              value={String(stats.hotLeads)}
              sub={formatEur(stats.hotLeads * stats.dealValueEur, numberLocale)}
            />
            <KpiCard
              label={t("warmLeads")}
              value={String(stats.warmLeads)}
              sub={formatEur(stats.warmLeads * stats.dealValueEur, numberLocale)}
            />
          </div>

          <div className="mt-6 rounded-xl border border-[#EAECF0] bg-white p-5 shadow-xs">
            <h2 className="text-base font-semibold text-[#101828]">{t("qualityGuideTitle")}</h2>
            <p className="mt-1 text-sm text-[#667085]">{t("qualityGuideIntro")}</p>

            <div className="mt-4 rounded-lg border border-[#EAECF0] bg-[#F9FAFB] p-4 text-sm text-[#475467]">
              <p className="font-semibold text-[#344054]">{t("scoreFormulaTitle")}</p>
              <ul className="mt-2 list-inside list-disc space-y-1 text-xs sm:text-sm">
                <li>{t("scoreFactorPain", { pct: "48" })}</li>
                <li>{t("scoreFactorCategory", { pct: "32" })}</li>
                <li>
                  {t("scoreFactorContent", {
                    max: String(LEAD_SCORE_WEIGHTS.contentBonusMax),
                  })}
                </li>
                <li>
                  {t("scoreFactorHttps", {
                    bonus: String(LEAD_SCORE_WEIGHTS.httpsBonus),
                  })}
                </li>
                <li>
                  {t("scoreFactorFetch", {
                    penalty: String(LEAD_SCORE_WEIGHTS.fetchPenalty),
                  })}
                </li>
              </ul>
              <p className="mt-3 text-xs text-[#667085]">{t("scoreFormulaNote")}</p>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <QualityTierCard
                title={t("qualityHot")}
                range={`${LEAD_QUALITY_THRESHOLDS.hot.min}–${LEAD_QUALITY_THRESHOLDS.hot.max}`}
                description={t("qualityHotDesc")}
                meaning={t("qualityHotMeaning")}
                pipelineNote={t("qualityHotPipeline")}
                count={stats.hotLeads}
                colorClass="bg-[#ECFDF3] text-[#027A48]"
                borderClass="border-[#ABEFC6]"
              />
              <QualityTierCard
                title={t("qualityWarm")}
                range={`${LEAD_QUALITY_THRESHOLDS.warm.min}–${LEAD_QUALITY_THRESHOLDS.warm.max}`}
                description={t("qualityWarmDesc")}
                meaning={t("qualityWarmMeaning")}
                pipelineNote={t("qualityWarmPipeline")}
                count={stats.warmLeads}
                colorClass="bg-[#FFFAEB] text-[#B54708]"
                borderClass="border-[#FEDF89]"
              />
              <QualityTierCard
                title={t("qualityCold")}
                range={`${LEAD_QUALITY_THRESHOLDS.cold.min}–${LEAD_QUALITY_THRESHOLDS.cold.max}`}
                description={t("qualityColdDesc")}
                meaning={t("qualityColdMeaning")}
                pipelineNote={t("qualityColdPipeline")}
                count={stats.coldLeads}
                colorClass="bg-[#F2F4F7] text-[#475467]"
                borderClass="border-[#EAECF0]"
              />
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-[#EAECF0] bg-white p-5 shadow-xs">
              <h2 className="text-base font-semibold text-[#101828]">{t("leadMix")}</h2>
              <p className="mt-1 text-xs text-[#667085]">{t("leadMixSub")}</p>
              <div className="mt-5 space-y-4">
                <LeadBar
                  label={t("qualityHot")}
                  count={stats.hotLeads}
                  total={totalLeads}
                  color="bg-[#12B76A]"
                />
                <LeadBar
                  label={t("qualityWarm")}
                  count={stats.warmLeads}
                  total={totalLeads}
                  color="bg-[#F79009]"
                />
                <LeadBar
                  label={t("qualityCold")}
                  count={stats.coldLeads}
                  total={totalLeads}
                  color="bg-[#98A2B3]"
                />
              </div>
            </div>

            <div className="rounded-xl border border-[#EAECF0] bg-white p-5 shadow-xs">
              <h2 className="text-base font-semibold text-[#101828]">{t("byProvince")}</h2>
              <p className="mt-1 text-xs text-[#667085]">{t("byProvinceSub")}</p>
              {stats.provinces.length === 0 ? (
                <p className="mt-6 text-sm text-[#667085]">{t("noProvinces")}</p>
              ) : (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[320px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-[#EAECF0] text-xs uppercase text-[#667085]">
                        <th className="pb-2 pr-3 font-semibold">{t("colProvince")}</th>
                        <th className="pb-2 pr-3 font-semibold">{t("colBusinesses")}</th>
                        <th className="pb-2 pr-3 font-semibold">{t("colEmail")}</th>
                        <th className="pb-2 pr-3 font-semibold">{t("colPhone")}</th>
                        <th className="pb-2 pr-3 font-semibold">{t("colReports")}</th>
                        <th className="pb-2 font-semibold">{t("colPipeline")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.provinces.map((p) => (
                        <tr key={p.id} className="border-b border-[#F2F4F7]">
                          <td className="py-2.5 pr-3 font-medium text-[#101828]">{p.name}</td>
                          <td className="py-2.5 pr-3 tabular-nums text-[#475467]">
                            {p.businessCount}
                            <span className="text-[#98A2B3]"> ({p.withWebsite} www)</span>
                          </td>
                          <td className="py-2.5 pr-3 tabular-nums text-[#027A48]">
                            {p.autoMailerQualified}
                          </td>
                          <td className="py-2.5 pr-3 tabular-nums text-[#175CD3]">
                            {p.callListQualified}
                          </td>
                          <td className="py-2.5 pr-3 tabular-nums text-[#475467]">
                            {p.reports}
                            <span className="text-[#98A2B3]">
                              {" "}
                              · {p.hotLeads} {t("hotShort")}
                            </span>
                          </td>
                          <td className="py-2.5 tabular-nums font-medium text-[#6941C6]">
                            {formatEur(p.pipelineEur, numberLocale)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <p className="mt-6 text-xs text-[#98A2B3]">
            {t("updatedAt")}: {new Date(stats.updatedAt).toLocaleString(numberLocale)}
          </p>
        </>
      ) : (
        <p className="text-sm text-[#667085]">{t("loadError")}</p>
      )}
    </div>
  );
}
