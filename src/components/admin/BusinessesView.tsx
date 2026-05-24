"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { BusinessesOutreachKpi } from "./BusinessesOutreachKpi";
import { ScrapeProgressPanel } from "./ScrapeProgressPanel";
import { CATEGORY_ORDER } from "@/lib/bedrijven/categories";
import {
  BRANCH_IDS,
  BRANCHES,
  DEFAULT_BRANCH,
  LENJERII_SEGMENTS,
  type LenjeriiSegment,
  type ScrapeBranchId,
} from "@/lib/bedrijven/branches";
import {
  isOutreachBranchId,
  type OutreachBranchId,
} from "@/lib/bedrijven/outreach-branches";
import {
  ADMIN_VERTICAL_ALL,
  useAdminVertical,
} from "@/context/AdminVerticalContext";
import {
  getRegionConfig,
  getRegionIdsForBranch,
  type ScrapeRegionId,
} from "@/lib/bedrijven/regions";
import { ROMANIA_CENTER } from "@/lib/bedrijven/romania-counties";

/** Nederland — centrum voor kaart bij landelijk overzicht. */
const NETHERLANDS_CENTER: [number, number] = [52.2, 5.3];
const ROMANIA_MAP_CENTER: [number, number] = [
  ROMANIA_CENTER.lat,
  ROMANIA_CENTER.lon,
];

type ProvinceFilter = ScrapeRegionId | "all";
import type {
  Bedrijf,
  BedrijfCategory,
  BedrijvenCache,
} from "@/lib/bedrijven/types";

type ScrapeProgressInfo = {
  totalEnriched: number;
  count: number;
  queueTotal: number;
  remaining: number;
  discoveryComplete: boolean;
  done: boolean;
  active?: boolean;
  phase?: string;
  percent?: number;
  statusMessage?: string;
  log?: string[];
  enrichingDone?: number;
  enrichingTotal?: number;
};

const BusinessesMap = dynamic(
  () => import("./BusinessesMap").then((m) => m.BusinessesMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[420px] items-center justify-center rounded-xl border border-[#EAECF0] bg-[#F9FAFB] text-sm text-[#667085]">
        …
      </div>
    ),
  },
);

function CategoryChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
        active
          ? "bg-[#7F56D9] text-white"
          : "bg-[#F2F4F7] text-[#475467] hover:bg-[#EAECF0]"
      }`}
    >
      {label}
    </button>
  );
}

function CellValue({
  children,
  href,
  external,
}: {
  children: React.ReactNode;
  href?: string;
  external?: boolean;
}) {
  if (!href) {
    return <span className="text-[#98A2B3]">{children}</span>;
  }
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="break-all text-[#7F56D9] hover:underline"
    >
      {children}
    </a>
  );
}

function BusinessRow({
  bedrijf,
  categoryLabel,
  noValue,
}: {
  bedrijf: Bedrijf;
  categoryLabel: string;
  noValue: string;
}) {
  const phone = bedrijf.phone?.split(";")[0]?.trim();
  const website = bedrijf.website;
  const websiteLabel = website
    ? website.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")
    : null;

  return (
    <tr className="align-top hover:bg-[#F9FAFB]">
      <td className="px-4 py-3">
        <p className="font-medium text-[#101828]">{bedrijf.name}</p>
        <p className="text-xs text-[#667085]">{bedrijf.subcategory}</p>
      </td>
      <td className="px-4 py-3">
        <span className="rounded-full bg-[#F9F5FF] px-2.5 py-0.5 text-xs font-medium text-[#6941C6]">
          {categoryLabel}
        </span>
      </td>
      <td className="max-w-[200px] px-4 py-3 text-sm text-[#475467]">
        <p>{bedrijf.address}</p>
        <p className="text-xs text-[#667085]">
          {bedrijf.city} · {bedrijf.province}
        </p>
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-sm">
        <CellValue href={phone ? `tel:${phone}` : undefined}>
          {phone ?? noValue}
        </CellValue>
      </td>
      <td className="max-w-[180px] px-4 py-3 text-sm">
        <CellValue href={website} external>
          {websiteLabel ?? noValue}
        </CellValue>
      </td>
      <td className="max-w-[160px] px-4 py-3 text-sm">
        <CellValue href={bedrijf.email ? `mailto:${bedrijf.email}` : undefined}>
          {bedrijf.email ?? noValue}
        </CellValue>
      </td>
      <td className="max-w-[220px] px-4 py-3 text-xs text-[#475467]">
        {bedrijf.openingHours ? (
          <span title={bedrijf.openingHours}>
            {bedrijf.openingHours.length > 80
              ? `${bedrijf.openingHours.slice(0, 80)}…`
              : bedrijf.openingHours}
          </span>
        ) : (
          <span className="text-[#98A2B3]">{noValue}</span>
        )}
      </td>
    </tr>
  );
}

export function BusinessesView() {
  const t = useTranslations("adminBusinesses");
  const { vertical, setVertical, verticalLabel } = useAdminVertical();
  /** Alleen voor Lenjerii RO — outreach (makelaardij/installatie) volgt de sidebar. */
  const [legacyBranchOverride, setLegacyBranchOverride] =
    useState<ScrapeBranchId | null>(null);

  const branch: ScrapeBranchId | typeof ADMIN_VERTICAL_ALL =
    legacyBranchOverride ??
    (vertical === ADMIN_VERTICAL_ALL
      ? ADMIN_VERTICAL_ALL
      : isOutreachBranchId(vertical)
        ? vertical
        : DEFAULT_BRANCH);

  useEffect(() => {
    setLegacyBranchOverride(null);
  }, [vertical]);

  const [province, setProvince] = useState<ProvinceFilter>("all");
  const [cache, setCache] = useState<BedrijvenCache | null>(null);
  const [progress, setProgress] = useState<ScrapeProgressInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);
  const [liveProgress, setLiveProgress] = useState<ScrapeProgressInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<BedrijfCategory | "all">("all");
  const [lenjeriiSegment, setLenjeriiSegment] = useState<LenjeriiSegment | "all">(
    "all",
  );
  const [withWebsiteOnly, setWithWebsiteOnly] = useState(false);

  const regionBranch: ScrapeBranchId =
    branch === ADMIN_VERTICAL_ALL ? DEFAULT_BRANCH : branch;
  const regionIds = getRegionIdsForBranch(regionBranch);
  const isLenjerii = branch === "lenjerii-hotel";
  const isAllProvinces = province === "all";
  const provinceConfig = isAllProvinces
    ? null
    : getRegionConfig(regionBranch, province);
  const branchName =
    branch === ADMIN_VERTICAL_ALL ? verticalLabel : BRANCHES[branch].name;
  const mapCenter: [number, number] = isAllProvinces
    ? isLenjerii
      ? ROMANIA_MAP_CENTER
      : NETHERLANDS_CENTER
    : [provinceConfig!.center.lat, provinceConfig!.center.lon];
  const provinceLabel = isAllProvinces
    ? isLenjerii
      ? t("provinceAllRomania")
      : t("provinceAll")
    : provinceConfig!.name;

  useEffect(() => {
    setProvince("all");
    setCategory("all");
    setLenjeriiSegment("all");
  }, [branch]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/bedrijven?branch=${encodeURIComponent(branch)}&province=${encodeURIComponent(province)}`,
      );
      const data = (await res.json()) as BedrijvenCache & {
        progress?: ScrapeProgressInfo;
      };
      setProgress(data.progress ?? null);
      setCache(
        (data.businesses?.length ?? 0) > 0 || data.count > 0 ? data : null,
      );
    } catch {
      setError(t("scrapeError"));
    } finally {
      setLoading(false);
    }
  }, [branch, province, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const pollProgress = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/bedrijven?branch=${encodeURIComponent(branch)}&province=${encodeURIComponent(province)}`,
      );
      const data = (await res.json()) as { progress?: ScrapeProgressInfo };
      if (data.progress) setLiveProgress(data.progress);
    } catch {
      // ignore poll errors during scrape
    }
  }, [branch, province]);

  useEffect(() => {
    if (scraping) {
      void pollProgress();
      pollRef.current = setInterval(() => void pollProgress(), 800);
    } else if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [scraping, pollProgress]);

  async function handleScrape() {
    if (isAllProvinces) return;
    setScraping(true);
    setError(null);
    setLiveProgress({
      totalEnriched: progress?.totalEnriched ?? 0,
      count: cache?.count ?? 0,
      queueTotal: progress?.queueTotal ?? 0,
      remaining: progress?.remaining ?? 0,
      discoveryComplete: false,
      done: false,
      active: true,
      phase: "discovering",
      percent: 0,
      statusMessage: t("progressStarting"),
      log: [],
      enrichingDone: 0,
      enrichingTotal: 0,
    });
    try {
      const res = await fetch("/api/bedrijven/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branch, province }),
        signal: AbortSignal.timeout(600000),
      });
      const data = (await res.json()) as {
        error?: string;
        waitSeconds?: number;
        message?: string;
        batchAdded?: number;
        remaining?: number;
        done?: boolean;
      };

      if (!res.ok) {
        if (data.error === "RATE_LIMIT_COOLDOWN" && data.waitSeconds) {
          throw new Error(
            t("rateLimitCooldown", { seconds: String(data.waitSeconds) }),
          );
        }
        if (data.error?.includes("GOOGLE_API_KEY_MISSING")) {
          throw new Error(t("googleRequired"));
        }
        throw new Error(data.message ?? data.error ?? t("scrapeError"));
      }
      if (data.batchAdded != null && data.batchAdded > 0) {
        setProgress((p) =>
          p
            ? {
                ...p,
                count: (cache?.count ?? 0) + data.batchAdded!,
                remaining: data.remaining ?? p.remaining,
                done: data.done ?? false,
              }
            : p,
        );
      }
      await loadData();
      await pollProgress();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("scrapeError"));
    } finally {
      setScraping(false);
    }
  }

  const showProgress = scraping || (liveProgress?.active ?? false);
  const progressDisplay = liveProgress ?? progress;

  const categoryLabel = (cat: BedrijfCategory) =>
    t(`categories.${cat}` as "categories.horeca");

  const filtered = useMemo(() => {
    const list = cache?.businesses ?? [];
    const q = search.trim().toLowerCase();
    return list.filter((b) => {
      if (category !== "all" && b.category !== category) return false;
      if (
        isLenjerii &&
        lenjeriiSegment !== "all" &&
        b.subcategory !== lenjeriiSegment
      ) {
        return false;
      }
      if (withWebsiteOnly && !b.website?.trim()) return false;
      if (!q) return true;
      return (
        b.name.toLowerCase().includes(q) ||
        b.address.toLowerCase().includes(q) ||
        b.city.toLowerCase().includes(q) ||
        b.subcategory.toLowerCase().includes(q) ||
        (b.phone?.toLowerCase().includes(q) ?? false) ||
        (b.website?.toLowerCase().includes(q) ?? false) ||
        (b.email?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [cache, search, category, withWebsiteOnly, isLenjerii, lenjeriiSegment]);

  const websiteCount = useMemo(
    () => (cache?.businesses ?? []).filter((b) => b.website?.trim()).length,
    [cache],
  );

  const countsByCategory = useMemo(() => {
    const counts: Partial<Record<BedrijfCategory, number>> = {};
    for (const b of cache?.businesses ?? []) {
      counts[b.category] = (counts[b.category] ?? 0) + 1;
    }
    return counts;
  }, [cache]);

  const countsByLenjeriiSegment = useMemo(() => {
    const counts: Partial<Record<LenjeriiSegment, number>> = {};
    for (const b of cache?.businesses ?? []) {
      const seg = b.subcategory as LenjeriiSegment;
      if (LENJERII_SEGMENTS.includes(seg)) {
        counts[seg] = (counts[seg] ?? 0) + 1;
      }
    }
    return counts;
  }, [cache]);

  const columns = [
    t("columns.name"),
    t("columns.category"),
    t("columns.address"),
    t("columns.phone"),
    t("columns.website"),
    t("columns.email"),
    t("columns.hours"),
  ];

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[#101828]">
            {t("title")} · {branchName}
          </h1>
          <p className="mt-1 text-sm text-[#667085]">{t("subtitle")}</p>
          {(vertical === ADMIN_VERTICAL_ALL || isOutreachBranchId(vertical)) &&
          !legacyBranchOverride ? (
            <p className="mt-1 text-xs text-[#6941C6]">
              {t("branchFromSidebar", { name: verticalLabel })}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(vertical === ADMIN_VERTICAL_ALL || isOutreachBranchId(vertical)) &&
          !legacyBranchOverride ? (
            <span className="rounded-lg border border-[#D6BBFB] bg-[#F9F5FF] px-3 py-2 text-sm font-semibold text-[#6941C6]">
              {verticalLabel}
            </span>
          ) : (
            <>
              <label className="sr-only" htmlFor="branch-select">
                {t("branchLabel")}
              </label>
              <select
                id="branch-select"
                value={branch}
                onChange={(e) => {
                  const id = e.target.value as ScrapeBranchId;
                  if (isOutreachBranchId(id)) {
                    setLegacyBranchOverride(null);
                    setVertical(id as OutreachBranchId);
                  } else {
                    setLegacyBranchOverride(id);
                  }
                }}
                className="rounded-lg border border-[#D0D5DD] bg-white px-3 py-2 text-sm font-medium text-[#344054] shadow-xs focus:border-[#7F56D9] focus:outline-none focus:ring-2 focus:ring-[#7F56D9]/20"
              >
                {BRANCH_IDS.map((id) => (
                  <option key={id} value={id}>
                    {BRANCHES[id].name}
                  </option>
                ))}
              </select>
            </>
          )}
          <button
            type="button"
            title={t("branchOtherMarkets")}
            onClick={() => {
              const next =
                legacyBranchOverride === "lenjerii-hotel"
                  ? null
                  : "lenjerii-hotel";
              setLegacyBranchOverride(next);
            }}
            className={`rounded-lg border px-2.5 py-2 text-xs font-medium ${
              legacyBranchOverride === "lenjerii-hotel"
                ? "border-[#7F56D9] bg-[#F9F5FF] text-[#6941C6]"
                : "border-[#D0D5DD] bg-white text-[#667085] hover:bg-[#F9FAFB]"
            }`}
          >
            {t("branchLenjerii")}
          </button>
          <label className="sr-only" htmlFor="province-select">
            {t("provinceLabel")}
          </label>
          <select
            id="province-select"
            value={province}
            onChange={(e) => setProvince(e.target.value as ProvinceFilter)}
            className="rounded-lg border border-[#D0D5DD] bg-white px-3 py-2 text-sm text-[#344054] shadow-xs focus:border-[#7F56D9] focus:outline-none focus:ring-2 focus:ring-[#7F56D9]/20"
          >
            <option value="all">{t("provinceAll")}</option>
            {regionIds.map((id) => (
              <option key={id} value={id}>
                {getRegionConfig(regionBranch, id)?.name ?? id}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleScrape}
            disabled={isAllProvinces || scraping || progress?.done}
            title={isAllProvinces ? t("scrapeSelectProvince") : undefined}
            className="rounded-lg bg-[#7F56D9] px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-[#6941C6] disabled:opacity-60"
          >
            {scraping
              ? t("scraping")
              : progress?.done
                ? t("scrapeDone")
                : cache && (progress?.remaining ?? 0) > 0
                  ? t("scrapeNext")
                  : t("scrapeFirst")}
          </button>
        </div>
      </div>

      <p className="mb-4 text-xs text-[#667085]">
        {t("sourceGoogle", { branch: branchName, province: provinceLabel })}
      </p>

      {isOutreachBranchId(branch) && (
        <BusinessesOutreachKpi
          branchId={branch}
          businesses={cache?.businesses ?? []}
          showNational={isAllProvinces}
        />
      )}

      <ScrapeProgressPanel
        active={!isAllProvinces && showProgress}
        percent={progressDisplay?.percent ?? (scraping ? 5 : 0)}
        statusMessage={progressDisplay?.statusMessage ?? ""}
        phase={progressDisplay?.phase ?? "idle"}
        log={progressDisplay?.log ?? []}
        enrichingDone={progressDisplay?.enrichingDone ?? 0}
        enrichingTotal={progressDisplay?.enrichingTotal ?? 0}
        labels={{
          title: t("progressTitle"),
          discovering: t("progressDiscovering"),
          enriching: t("progressEnriching"),
          done: t("progressDone"),
          logTitle: t("progressLog"),
        }}
      />

      {(cache || (!isAllProvinces && progress)) && (
        <div className="scrollbar-hide-x -mx-4 mb-6 flex gap-3 px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
          <div className="min-w-[140px] shrink-0 rounded-xl border border-[#EAECF0] bg-white p-4 shadow-xs">
            <p className="text-xs font-semibold uppercase text-[#667085]">{t("total")}</p>
            <p className="text-2xl font-bold text-[#7F56D9]">{cache?.count ?? 0}</p>
          </div>
          {!isAllProvinces && progress && (
            <div className="min-w-[160px] shrink-0 rounded-xl border border-[#EAECF0] bg-white p-4 shadow-xs">
              <p className="text-xs font-semibold uppercase text-[#667085]">{t("remaining")}</p>
              <p className="text-2xl font-bold text-[#101828]">{progress.remaining}</p>
              <p className="mt-1 text-xs text-[#667085]">
                {progress.discoveryComplete
                  ? t("discoveryDone")
                  : t("discoveryRunning")}
              </p>
            </div>
          )}
          {cache && !isAllProvinces && (
            <div className="min-w-[200px] rounded-xl border border-[#EAECF0] bg-white p-4 shadow-xs">
              <p className="text-xs font-semibold uppercase text-[#667085]">{t("scrapedAt")}</p>
              <p className="text-sm font-medium text-[#101828]">
                {new Date(cache.scrapedAt).toLocaleString()}
              </p>
            </div>
          )}
        </div>
      )}

      {error && (
        <p
          role="alert"
          className="mb-4 rounded-lg border border-[#FECDCA] bg-[#FEF3F2] px-4 py-3 text-sm text-[#B42318]"
        >
          {error}
        </p>
      )}

      <div className="mb-4 space-y-3">
        <input
          type="search"
          placeholder={t("search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-[#D0D5DD] bg-white px-4 py-2.5 text-sm shadow-xs focus:border-[#7F56D9] focus:outline-none focus:ring-2 focus:ring-[#7F56D9]/20 sm:max-w-md"
        />
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase text-[#667085]">
            {t("columns.website")}:
          </span>
          <CategoryChip
            active={!withWebsiteOnly}
            onClick={() => setWithWebsiteOnly(false)}
            label={`${t("filterAll")}${cache ? ` (${cache.count})` : ""}`}
          />
          <CategoryChip
            active={withWebsiteOnly}
            onClick={() => setWithWebsiteOnly(true)}
            label={`${t("filterWithWebsite")} (${websiteCount})`}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <CategoryChip
            active={category === "all"}
            onClick={() => setCategory("all")}
            label={`${t("allCategories")}${cache ? ` (${cache.count})` : ""}`}
          />
          {isLenjerii
            ? LENJERII_SEGMENTS.map((seg) => {
                const count = countsByLenjeriiSegment[seg];
                if (!count) return null;
                return (
                  <CategoryChip
                    key={seg}
                    active={lenjeriiSegment === seg}
                    onClick={() => {
                      setLenjeriiSegment(seg);
                      setCategory("all");
                    }}
                    label={`${t(`lenjeriiSegments.${seg}`)} (${count})`}
                  />
                );
              })
            : CATEGORY_ORDER.map((cat) => {
                const count = countsByCategory[cat];
                if (!count) return null;
                return (
                  <CategoryChip
                    key={cat}
                    active={category === cat}
                    onClick={() => setCategory(cat)}
                    label={`${categoryLabel(cat)} (${count})`}
                  />
                );
              })}
          {isLenjerii && lenjeriiSegment !== "all" && (
            <CategoryChip
              active={false}
              onClick={() => setLenjeriiSegment("all")}
              label={t("allCategories")}
            />
          )}
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl border border-[#EAECF0] bg-white py-12 text-center text-sm text-[#667085] shadow-xs">
          {t("loading")}
        </div>
      ) : !cache?.businesses.length ? (
        <div className="rounded-xl border border-[#EAECF0] bg-white py-12 text-center shadow-xs">
          <p className="text-sm text-[#667085]">
            {t("noData", { province: provinceLabel })}
          </p>
          <button
            type="button"
            onClick={handleScrape}
            disabled={scraping}
            className="mt-4 rounded-lg bg-[#7F56D9] px-4 py-2 text-sm font-semibold text-white hover:bg-[#6941C6] disabled:opacity-60"
          >
            {scraping ? t("scraping") : t("scrapeFirst")}
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-[#EAECF0] bg-white py-8 text-center text-sm text-[#667085] shadow-xs">
          {t("noResults")}
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <h3 className="mb-3 text-sm font-semibold text-[#101828]">{t("mapTitle")}</h3>
            <BusinessesMap
              businesses={filtered}
              center={mapCenter}
              categoryLabel={categoryLabel}
              noValue={t("noValue")}
              mapHint={t("mapHint")}
            />
          </div>
          <div className="overflow-hidden rounded-xl border border-[#EAECF0] bg-white shadow-xs">
            <div className="table-scroll -mx-1 px-1">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[#EAECF0] text-xs text-[#667085]">
                    {columns.map((col) => (
                      <th key={col} className="px-4 py-3 font-medium">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((b) => (
                    <BusinessRow
                      key={b.id}
                      bedrijf={b}
                      categoryLabel={
                        isLenjerii && LENJERII_SEGMENTS.includes(b.subcategory as LenjeriiSegment)
                          ? t(`lenjeriiSegments.${b.subcategory as LenjeriiSegment}`)
                          : categoryLabel(b.category)
                      }
                      noValue={t("noValue")}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
