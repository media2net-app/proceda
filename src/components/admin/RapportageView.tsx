"use client";

import { Link } from "@/i18n/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  BRANCH_IDS,
  BRANCHES,
  LENJERII_SEGMENTS,
  type LenjeriiSegment,
  type ScrapeBranchId,
} from "@/lib/bedrijven/branches";
import { LiveScrapeLogPanel } from "./LiveScrapeLogPanel";

const RAPPORTAGE_DEFAULT_BRANCH: ScrapeBranchId = "lenjerii-hotel";
import type { ScrapeRegionId } from "@/lib/bedrijven/regions";
import type { BedrijfCategory } from "@/lib/bedrijven/types";
import type { AppTypeKey, LeadQuality } from "@/lib/bedrijven/lead-score";
import { businessIdToSlug } from "@/lib/bedrijven/slug";

type RapportRow = {
  id: string;
  name: string;
  category: BedrijfCategory;
  city: string;
  province: string;
  provinceId: string | null;
  website: string;
  email: string | null;
  subcategory: string;
  address: string;
  hasScreenshot?: boolean;
  report: {
    generatedAt: string;
    seoScore: number;
    modernityScore: number;
    overallScore: number;
    leadQuality: LeadQuality;
    primaryAppType: AppTypeKey;
    detectedServices: string[];
    servicesSummary: string;
    hasScreenshot: boolean;
    hasFullReport: boolean;
    demoHomepageUrl: string | null;
    demoAppUrl: string | null;
  } | null;
};

type RegionOption = { id: ScrapeRegionId; name: string; count: number };

type RapportStats = {
  total: number;
  withWebsite: number;
  withEmail: number;
  withPhone: number;
  segments?: Record<LenjeriiSegment, number>;
  otherSegment?: number;
};
type QualityFilter = "all" | LeadQuality;
type SortMode = "scoreDesc" | "scoreAsc" | "name";
type RegionFilter = "all" | ScrapeRegionId;

const QUALITY_STYLES: Record<
  LeadQuality,
  { badge: string; ring: string }
> = {
  hot: {
    badge: "bg-[#ECFDF3] text-[#027A48] border-[#ABEFC6]",
    ring: "ring-[#12B76A]/30",
  },
  warm: {
    badge: "bg-[#FFFAEB] text-[#B54708] border-[#FEDF89]",
    ring: "ring-[#F79009]/30",
  },
  cold: {
    badge: "bg-[#F2F4F7] text-[#475467] border-[#EAECF0]",
    ring: "ring-[#98A2B3]/30",
  },
};

function CardPlaceholder({ label }: { label: string }) {
  return (
    <div className="flex aspect-[16/10] w-full flex-col items-center justify-center gap-2 bg-[#F2F4F7] text-[#98A2B3]">
      <svg
        className="h-10 w-10 opacity-60"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.2}
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 15.75v5.25A2.25 2.25 0 004.5 21h15a2.25 2.25 0 002.25-2.25v-5.25M2.25 9.75l9.75-6.75 9.75 6.75M4.5 21V9.75l7.5-5.25 7.5 5.25V21"
        />
      </svg>
      <span className="text-xs font-medium">{label}</span>
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  return (
    <div
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-[#7F56D9] bg-white text-sm font-bold text-[#6941C6] shadow-sm"
      title={`${score}`}
    >
      {score}
    </div>
  );
}

export function RapportageView() {
  const t = useTranslations("adminRapportage");
  const locale = useLocale();

  const [rows, setRows] = useState<RapportRow[]>([]);
  const [stats, setStats] = useState<RapportStats | null>(null);
  const [provinces, setProvinces] = useState<RegionOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState<ScrapeBranchId>(
    RAPPORTAGE_DEFAULT_BRANCH,
  );
  const [regionFilter, setRegionFilter] = useState<RegionFilter>("all");
  const [qualityFilter, setQualityFilter] = useState<QualityFilter>("all");
  const [sortMode, setSortMode] = useState<SortMode>("scoreDesc");

  useEffect(() => {
    fetch(`/api/bedrijven/provinces?branch=${encodeURIComponent(branchFilter)}`)
      .then((r) => r.json())
      .then((d: { provinces: RegionOption[] }) => {
        setProvinces(d.provinces ?? []);
      })
      .catch(() => {});
  }, [branchFilter]);

  useEffect(() => {
    setRegionFilter("all");
  }, [branchFilter]);

  const load = useCallback(
    async (background = false) => {
      if (background) setRefreshing(true);
      else setLoading(true);
      try {
        const params = new URLSearchParams({ branch: branchFilter });
        if (regionFilter !== "all") {
          params.set("province", regionFilter);
        }
        const res = await fetch(`/api/bedrijven/rapport?${params}`);
        const data = (await res.json()) as {
          businesses: RapportRow[];
          stats?: RapportStats;
        };
        setRows(data.businesses ?? []);
        setStats(data.stats ?? null);
      } finally {
        if (background) setRefreshing(false);
        else setLoading(false);
      }
    },
    [branchFilter, regionFilter],
  );

  useEffect(() => {
    load(false);
    const interval = setInterval(() => load(true), 15000);
    return () => clearInterval(interval);
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = rows;

    if (qualityFilter !== "all") {
      list = list.filter((b) => b.report?.leadQuality === qualityFilter);
    }

    if (q) {
      list = list.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.website.toLowerCase().includes(q) ||
          b.city.toLowerCase().includes(q) ||
          b.address.toLowerCase().includes(q),
      );
    }

    const withScore = [...list];
    withScore.sort((a, b) => {
      if (sortMode === "name") {
        return a.name.localeCompare(b.name, locale);
      }
      const sa = a.report?.overallScore ?? -1;
      const sb = b.report?.overallScore ?? -1;
      if (sortMode === "scoreAsc") return sa - sb;
      return sb - sa;
    });

    return withScore;
  }, [rows, search, qualityFilter, sortMode]);

  const isLenjerii = branchFilter === "lenjerii-hotel";
  const withReport = rows.filter((b) => b.report).length;
  const withFull = rows.filter((b) => b.report?.hasFullReport).length;
  const hotCount = rows.filter((b) => b.report?.leadQuality === "hot").length;
  const totalBusinesses = stats?.total ?? rows.length;
  const withWebsiteCount = stats?.withWebsite ?? rows.length;
  const withEmailAll = stats?.withEmail ?? rows.filter((b) => b.email?.trim()).length;
  const withEmailOnCards = rows.filter((b) => b.email?.trim()).length;
  const withScreenshot = rows.filter(
    (b) => b.hasScreenshot ?? b.report?.hasScreenshot,
  ).length;
  const regionLabel =
    regionFilter === "all"
      ? t("filterRegionAll")
      : provinces.find((p) => p.id === regionFilter)?.name ?? regionFilter;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[#101828]">{t("title")}</h1>
        <p className="mt-1 text-sm text-[#667085]">{t("subtitle")}</p>
      </div>

      <LiveScrapeLogPanel branchId={branchFilter} />

      <div className="mb-6 flex flex-wrap gap-4">
        <div className="min-w-[140px] rounded-xl border border-[#D6BBFB] bg-[#F9F5FF] p-4 shadow-xs">
          <p className="text-xs font-semibold uppercase text-[#6941C6]">{t("totalBusinesses")}</p>
          <p className="text-2xl font-bold text-[#7F56D9]">{totalBusinesses}</p>
          <p className="mt-1 text-xs text-[#667085]">{t("totalBusinessesSub")}</p>
        </div>
        <div className="min-w-[140px] rounded-xl border border-[#EAECF0] bg-white p-4 shadow-xs">
          <p className="text-xs font-semibold uppercase text-[#667085]">{t("withWebsite")}</p>
          <p className="text-2xl font-bold text-[#101828]">{withWebsiteCount}</p>
          <p className="mt-1 text-xs text-[#667085]">
            {t("withWebsiteSub", { total: String(totalBusinesses) })}
          </p>
        </div>
        <div className="min-w-[140px] rounded-xl border border-[#EAECF0] bg-white p-4 shadow-xs">
          <p className="text-xs font-semibold uppercase text-[#667085]">{t("withReport")}</p>
          <p className="text-2xl font-bold text-[#101828]">{withReport}</p>
        </div>
        <div className="min-w-[140px] rounded-xl border border-[#ABEFC6] bg-[#ECFDF3] p-4 shadow-xs">
          <p className="text-xs font-semibold uppercase text-[#027A48]">{t("hotLeads")}</p>
          <p className="text-2xl font-bold text-[#027A48]">{hotCount}</p>
        </div>
        <div className="min-w-[140px] rounded-xl border border-[#EAECF0] bg-white p-4 shadow-xs">
          <p className="text-xs font-semibold uppercase text-[#667085]">{t("withEmail")}</p>
          <p className="text-2xl font-bold text-[#7F56D9]">{withEmailAll}</p>
          <p className="mt-1 text-xs text-[#667085]">
            {t("withEmailSub", { total: String(totalBusinesses) })}
            {withEmailOnCards !== withEmailAll && (
              <span className="block text-[#98A2B3]">
                {t("withEmailOnCards", { count: String(withEmailOnCards) })}
              </span>
            )}
          </p>
        </div>
        <div className="min-w-[140px] rounded-xl border border-[#EAECF0] bg-white p-4 shadow-xs">
          <p className="text-xs font-semibold uppercase text-[#667085]">{t("withScreenshot")}</p>
          <p className="text-2xl font-bold text-[#101828]">{withScreenshot}</p>
        </div>
        <div className="min-w-[140px] rounded-xl border border-[#FEDF89] bg-[#FFFAEB] p-4 shadow-xs">
          <p className="text-xs font-semibold uppercase text-[#B54708]">{t("withFullReport")}</p>
          <p className="text-2xl font-bold text-[#B54708]">{withFull}</p>
        </div>
      </div>

      {isLenjerii && stats?.segments && (
        <div className="mb-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#667085]">
            {t("segmentKpiTitle")}
          </p>
          <div className="flex flex-wrap gap-3">
            {LENJERII_SEGMENTS.map((seg) => (
              <div
                key={seg}
                className="min-w-[120px] rounded-xl border border-[#EAECF0] bg-white px-4 py-3 shadow-xs"
              >
                <p className="text-xs font-semibold text-[#667085]">
                  {t(`lenjeriiSegments.${seg}`)}
                </p>
                <p className="text-xl font-bold text-[#101828]">
                  {stats.segments![seg].toLocaleString(locale)}
                </p>
                <p className="mt-0.5 text-xs text-[#98A2B3]">
                  {t("segmentKpiSub", {
                    total: String(totalBusinesses),
                  })}
                </p>
              </div>
            ))}
            {(stats.otherSegment ?? 0) > 0 && (
              <div className="min-w-[120px] rounded-xl border border-dashed border-[#D0D5DD] bg-[#F9FAFB] px-4 py-3">
                <p className="text-xs font-semibold text-[#667085]">{t("segmentOther")}</p>
                <p className="text-xl font-bold text-[#475467]">
                  {stats.otherSegment!.toLocaleString(locale)}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <p className="mb-2 text-sm font-medium text-[#344054]">
        {t("filterBranch")}: {BRANCHES[branchFilter].name}
        {regionFilter !== "all" && (
          <span className="ml-2 text-[#667085]">
            · {t("filterRegion")}: {regionLabel}
          </span>
        )}
      </p>

      <p className="mb-4 text-sm text-[#667085]">
        {t("hint")}
        {refreshing && (
          <span className="ml-2 text-[#6941C6]">({t("refreshing")})</span>
        )}
      </p>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="search"
          placeholder={t("search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-[#D0D5DD] bg-white px-4 py-2.5 text-sm shadow-xs focus:border-[#7F56D9] focus:outline-none focus:ring-2 focus:ring-[#7F56D9]/20 sm:max-w-md"
        />
        <select
          value={branchFilter}
          onChange={(e) => setBranchFilter(e.target.value as ScrapeBranchId)}
          className="rounded-lg border border-[#D0D5DD] bg-white px-3 py-2.5 text-sm font-medium shadow-xs focus:border-[#7F56D9] focus:outline-none focus:ring-2 focus:ring-[#7F56D9]/20"
          aria-label={t("filterBranch")}
        >
          {BRANCH_IDS.map((id) => (
            <option key={id} value={id}>
              {BRANCHES[id].name}
            </option>
          ))}
        </select>
        <select
          value={regionFilter}
          onChange={(e) => setRegionFilter(e.target.value as RegionFilter)}
          className="rounded-lg border border-[#D0D5DD] bg-white px-3 py-2.5 text-sm font-medium shadow-xs focus:border-[#7F56D9] focus:outline-none focus:ring-2 focus:ring-[#7F56D9]/20"
          aria-label={t("filterRegion")}
        >
          <option value="all">{t("filterRegionAll")}</option>
          {provinces.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.count})
            </option>
          ))}
        </select>
        <select
          value={qualityFilter}
          onChange={(e) => setQualityFilter(e.target.value as QualityFilter)}
          className="rounded-lg border border-[#D0D5DD] bg-white px-3 py-2.5 text-sm shadow-xs focus:border-[#7F56D9] focus:outline-none focus:ring-2 focus:ring-[#7F56D9]/20"
          aria-label={t("filterQuality")}
        >
          <option value="all">{t("filterAll")}</option>
          <option value="hot">{t("leadQuality.hot")}</option>
          <option value="warm">{t("leadQuality.warm")}</option>
          <option value="cold">{t("leadQuality.cold")}</option>
        </select>
        <select
          value={sortMode}
          onChange={(e) => setSortMode(e.target.value as SortMode)}
          className="rounded-lg border border-[#D0D5DD] bg-white px-3 py-2.5 text-sm shadow-xs focus:border-[#7F56D9] focus:outline-none focus:ring-2 focus:ring-[#7F56D9]/20"
          aria-label={t("sortBy")}
        >
          <option value="scoreDesc">{t("sortScoreDesc")}</option>
          <option value="scoreAsc">{t("sortScoreAsc")}</option>
          <option value="name">{t("sortName")}</option>
        </select>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="animate-pulse overflow-hidden rounded-xl border border-[#EAECF0] bg-white shadow-xs"
            >
              <div className="aspect-[16/10] bg-[#F2F4F7]" />
              <div className="space-y-2 p-4">
                <div className="h-4 w-3/4 rounded bg-[#F2F4F7]" />
                <div className="h-3 w-1/2 rounded bg-[#F2F4F7]" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-[#EAECF0] bg-white py-12 text-center text-sm text-[#667085] shadow-xs">
          {t("empty")}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((b) => {
            const slug = businessIdToSlug(b.id);
            const href = `/dashboard-admin/rapportage/${slug}`;
            const hasScreenshot =
              b.hasScreenshot ?? b.report?.hasScreenshot ?? false;
            const report = b.report;
            const qStyle = report
              ? QUALITY_STYLES[report.leadQuality]
              : null;

            return (
              <Link
                key={b.id}
                href={href}
                className={`group flex flex-col overflow-hidden rounded-xl border border-[#EAECF0] bg-white shadow-xs transition hover:border-[#D6BBFB] hover:shadow-md ${
                  report ? `ring-1 ${qStyle?.ring}` : ""
                }`}
              >
                <div className="relative overflow-hidden border-b border-[#EAECF0] bg-[#F9FAFB]">
                  {hasScreenshot ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`/api/bedrijven/screenshot/${slug}`}
                      alt=""
                      className="aspect-[16/10] w-full object-cover object-top transition group-hover:scale-[1.02]"
                    />
                  ) : (
                    <CardPlaceholder
                      label={
                        report ? t("cardNoScreenshot") : t("cardNoPreview")
                      }
                    />
                  )}
                  {report && (
                    <div className="absolute right-2 top-2 flex items-center gap-1.5">
                      <span
                        className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${qStyle?.badge}`}
                      >
                        {t(`leadQuality.${report.leadQuality}`)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="line-clamp-2 flex-1 font-semibold text-[#101828] group-hover:text-[#7F56D9]">
                      {b.name}
                    </h2>
                    {report && <ScoreRing score={report.overallScore} />}
                  </div>
                  <p className="mt-1 text-xs text-[#667085]">
                    {isLenjerii &&
                    LENJERII_SEGMENTS.includes(b.subcategory as LenjeriiSegment)
                      ? t(`lenjeriiSegments.${b.subcategory as LenjeriiSegment}`)
                      : t(`categories.${b.category}` as "categories.horeca")}{" "}
                    · {b.city}
                  </p>
                  {b.email && (
                    <p className="mt-1 truncate text-xs text-[#6941C6]">{b.email}</p>
                  )}
                  {report ? (
                    <>
                      {report.servicesSummary && (
                        <p className="mt-2 line-clamp-2 text-xs text-[#475467]">
                          {t("cardServices")}: {report.servicesSummary}
                        </p>
                      )}
                      <p className="mt-1 line-clamp-2 text-xs font-medium text-[#6941C6]">
                        {t("cardAppType")}: {t(`appTypes.${report.primaryAppType}`)}
                      </p>
                      <p className="mt-1 text-xs text-[#98A2B3]">
                        SEO {report.seoScore} · {t("modernityShort")}{" "}
                        {report.modernityScore}
                      </p>
                      {report.hasFullReport && (
                        <p className="mt-2 text-xs font-semibold text-[#E85B2B]">
                          {t("badgeFullDemo")}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="mt-2 line-clamp-1 text-xs text-[#98A2B3]">
                      {b.website.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
                    </p>
                  )}
                  <p className="mt-3 text-xs font-semibold text-[#6941C6]">
                    {report ? t("viewReport") : t("generateOnDetail")} →
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
