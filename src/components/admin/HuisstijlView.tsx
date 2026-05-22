"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import type { HuisstijlFilter } from "@/lib/bedrijven/demo-ready-audit";

type HuisstijlRow = {
  businessId: string;
  name: string;
  website: string;
  ok: boolean;
  demoReady: boolean;
  hasLogo: boolean;
  hasColors: boolean;
  colorCount: number;
  primaryColor: string;
  secondaryColor?: string;
  accentColor?: string;
  brandColors?: string[];
  logoUrl: string | null;
  demoSlug: string;
  demoAppUrl: string;
  demo: {
    hasDemo: boolean;
    logoPath: string | null;
    logoOk: boolean;
    primaryColor: string | null;
    secondaryColor: string | null;
    accentColor: string | null;
  };
};

type HuisstijlResponse = {
  summary: {
    scannedAt: string;
    demoReady: number;
    probed: number;
    totalWithEmail: number;
    demosGenerated?: number;
    demosLogoOk?: number;
    brandsGeneratedAt?: string | null;
  };
  filter: HuisstijlFilter;
  q: string | null;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  rows: HuisstijlRow[];
  error?: string;
  message?: string;
};

function ColorSwatch({
  color,
  label,
  large,
}: {
  color: string;
  label?: string;
  large?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`rounded-lg border border-[#EAECF0] shadow-sm ${
          large ? "h-10 w-10" : "h-7 w-7"
        }`}
        style={{ backgroundColor: color }}
        title={color}
      />
      {label ? (
        <span className="max-w-[4.5rem] truncate text-[10px] font-mono text-[#667085]">
          {label}
        </span>
      ) : null}
    </div>
  );
}

function DemoCell({ row }: { row: HuisstijlRow }) {
  const t = useTranslations("adminHuisstijl");
  const { demo } = row;

  if (!demo.hasDemo) {
    return (
      <span className="text-xs text-[#98A2B3]">{t("demoMissing")}</span>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div
        className="flex h-14 w-[140px] items-center justify-center rounded-lg border border-[#EAECF0] bg-white px-2"
        style={{
          boxShadow: `inset 0 -3px 0 ${demo.primaryColor ?? row.primaryColor}`,
        }}
      >
        <LogoCell
          url={demo.logoOk ? demo.logoPath : null}
          name={row.name}
          compact
        />
      </div>
      <div className="flex items-center gap-1">
        {demo.primaryColor ? (
          <ColorSwatch color={demo.primaryColor} />
        ) : null}
        {demo.secondaryColor ? (
          <ColorSwatch color={demo.secondaryColor} />
        ) : null}
        {demo.accentColor ? (
          <ColorSwatch color={demo.accentColor} />
        ) : null}
      </div>
      <a
        href={row.demoAppUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-xs font-semibold text-[#6941C6] hover:underline"
      >
        {t("openDemo")}
        <span aria-hidden>↗</span>
      </a>
      {!demo.logoOk ? (
        <span className="text-[10px] text-[#B54708]">{t("demoLogoFailed")}</span>
      ) : null}
    </div>
  );
}

function LogoCell({
  url,
  name,
  compact,
}: {
  url: string | null;
  name: string;
  compact?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  if (!url || failed) {
    return (
      <div
        className={`flex items-center justify-center rounded border border-dashed border-[#EAECF0] bg-[#F9FAFB] text-[10px] text-[#98A2B3] ${
          compact ? "h-10 w-full" : "h-14 w-28"
        }`}
      >
        {failed ? "—" : "Geen logo"}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={`Logo ${name}`}
      className={
        compact
          ? "h-10 max-h-10 w-full max-w-[120px] object-contain"
          : "h-14 max-w-[140px] object-contain object-left"
      }
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

function BrandColorsRow({ row }: { row: HuisstijlRow }) {
  const palette = [
    { key: "primary", color: row.primaryColor, label: "Primair" },
    ...(row.secondaryColor
      ? [{ key: "secondary", color: row.secondaryColor, label: "Sec." }]
      : []),
    ...(row.accentColor
      ? [{ key: "accent", color: row.accentColor, label: "Accent" }]
      : []),
  ];

  const samples =
    row.brandColors?.filter(
      (c) =>
        !palette.some((p) => p.color.toLowerCase() === c.toLowerCase()),
    ) ?? [];

  return (
    <div className="flex flex-wrap items-end gap-3">
      {palette.map((p) => (
        <ColorSwatch key={p.key} color={p.color} label={p.label} large />
      ))}
      {samples.length > 0 ? (
        <div className="flex flex-wrap items-end gap-1.5 border-l border-[#EAECF0] pl-3">
          {samples.slice(0, 6).map((c) => (
            <ColorSwatch key={c} color={c} />
          ))}
        </div>
      ) : null}
      {!row.hasColors && row.colorCount === 0 ? (
        <span className="text-xs text-[#98A2B3]">Geen kleuren gedetecteerd</span>
      ) : null}
    </div>
  );
}

const FILTER_OPTIONS: HuisstijlFilter[] = [
  "demoReady",
  "hasBrand",
  "hasLogo",
  "all",
  "failed",
];

export function HuisstijlView() {
  const t = useTranslations("adminHuisstijl");
  const [filter, setFilter] = useState<HuisstijlFilter>("demoReady");
  const [search, setSearch] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<HuisstijlResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQ(search.trim()), 300);
    return () => clearTimeout(id);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [filter, debouncedQ]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        filter,
        page: String(page),
        limit: "50",
      });
      if (debouncedQ) params.set("q", debouncedQ);
      const res = await fetch(`/api/bedrijven/huisstijl?${params}`);
      const json = (await res.json()) as HuisstijlResponse & {
        error?: string;
        message?: string;
      };
      if (!res.ok) {
        setData(null);
        setError(json.message ?? json.error ?? t("loadError"));
        return;
      }
      setData(json);
    } catch {
      setError(t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [filter, page, debouncedQ, t]);

  useEffect(() => {
    load();
  }, [load]);

  const scannedLabel = useMemo(() => {
    if (!data?.summary?.scannedAt) return null;
    return new Date(data.summary.scannedAt).toLocaleString("nl-NL", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }, [data?.summary?.scannedAt]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#101828]">
          {t("title")}
        </h1>
        <p className="mt-1 text-sm text-[#667085]">{t("subtitle")}</p>
        {scannedLabel ? (
          <p className="mt-1 text-xs text-[#98A2B3]">
            {t("scannedAt", { date: scannedLabel })}
          </p>
        ) : null}
      </div>

      {data?.summary ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-[#EAECF0] bg-white p-4">
            <p className="text-xs font-medium text-[#667085]">{t("kpiDemoReady")}</p>
            <p className="mt-1 text-2xl font-bold text-[#101828]">
              {data.summary.demoReady}
            </p>
            <p className="text-xs text-[#98A2B3]">
              {t("kpiDemoReadySub", { total: data.summary.probed })}
            </p>
          </div>
          <div className="rounded-xl border border-[#EAECF0] bg-white p-4">
            <p className="text-xs font-medium text-[#667085]">{t("kpiWithEmail")}</p>
            <p className="mt-1 text-2xl font-bold text-[#101828]">
              {data.summary.totalWithEmail}
            </p>
          </div>
          <div className="rounded-xl border border-[#EAECF0] bg-white p-4">
            <p className="text-xs font-medium text-[#667085]">{t("kpiShowing")}</p>
            <p className="mt-1 text-2xl font-bold text-[#101828]">{data.total}</p>
            <p className="text-xs text-[#98A2B3]">{t(`filter_${filter}`)}</p>
          </div>
          {data.summary.demosGenerated != null ? (
            <div className="rounded-xl border border-[#EAECF0] bg-white p-4">
              <p className="text-xs font-medium text-[#667085]">{t("kpiDemosBuilt")}</p>
              <p className="mt-1 text-2xl font-bold text-[#101828]">
                {data.summary.demosGenerated}
              </p>
              <p className="text-xs text-[#98A2B3]">
                {t("kpiDemosBuiltSub", {
                  logos: data.summary.demosLogoOk ?? 0,
                })}
              </p>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="flex flex-wrap gap-2">
          {FILTER_OPTIONS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                filter === f
                  ? "bg-[#7F56D9] text-white"
                  : "bg-[#F2F4F7] text-[#475467] hover:bg-[#EAECF0]"
              }`}
            >
              {t(`filter_${f}`)}
            </button>
          ))}
        </div>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="min-w-[200px] flex-1 rounded-lg border border-[#D0D5DD] px-3 py-2 text-sm outline-none focus:border-[#7F56D9] focus:ring-2 focus:ring-[#7F56D9]/20"
        />
      </div>

      {error ? (
        <div className="rounded-xl border border-[#FECDCA] bg-[#FEF3F2] p-4 text-sm text-[#B42318]">
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-[#EAECF0] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#EAECF0] text-left text-sm">
            <thead className="bg-[#F9FAFB]">
              <tr>
                <th className="px-4 py-3 font-semibold text-[#475467]">
                  {t("colName")}
                </th>
                <th className="px-4 py-3 font-semibold text-[#475467]">
                  {t("colLogoScrape")}
                </th>
                <th className="px-4 py-3 font-semibold text-[#475467]">
                  {t("colDemo")}
                </th>
                <th className="px-4 py-3 font-semibold text-[#475467]">
                  {t("colColors")}
                </th>
                <th className="px-4 py-3 font-semibold text-[#475467]">
                  {t("colStatus")}
                </th>
                <th className="px-4 py-3 font-semibold text-[#475467]">
                  {t("colWebsite")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAECF0]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-[#667085]">
                    …
                  </td>
                </tr>
              ) : null}
              {!loading && data?.rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-[#667085]">
                    {t("empty")}
                  </td>
                </tr>
              ) : null}
              {!loading &&
                data?.rows.map((row) => (
                  <tr key={row.businessId} className="hover:bg-[#F9FAFB]/80">
                    <td className="max-w-[220px] px-4 py-4 align-top">
                      <p className="font-semibold text-[#101828]">{row.name}</p>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <LogoCell url={row.logoUrl} name={row.name} />
                      <p className="mt-1 text-[10px] text-[#98A2B3]">{t("logoFromWebsite")}</p>
                    </td>
                    <td className="min-w-[160px] px-4 py-4 align-top">
                      <DemoCell row={row} />
                    </td>
                    <td className="min-w-[200px] px-4 py-4 align-top">
                      <BrandColorsRow row={row} />
                      <p className="mt-1 text-[10px] text-[#98A2B3]">{t("colorsFromWebsite")}</p>
                    </td>
                    <td className="px-4 py-4 align-top">
                      {row.demoReady ? (
                        <span className="inline-flex rounded-full border border-[#ABEFC6] bg-[#ECFDF3] px-2 py-0.5 text-xs font-semibold text-[#027A48]">
                          {t("statusDemoReady")}
                        </span>
                      ) : row.ok ? (
                        <span className="inline-flex rounded-full border border-[#FEDF89] bg-[#FFFAEB] px-2 py-0.5 text-xs font-semibold text-[#B54708]">
                          {t("statusPartial")}
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full border border-[#FECDCA] bg-[#FEF3F2] px-2 py-0.5 text-xs font-semibold text-[#B42318]">
                          {t("statusFailed")}
                        </span>
                      )}
                    </td>
                    <td className="max-w-[200px] px-4 py-4 align-top">
                      <div className="flex flex-col gap-1">
                        <a
                          href={row.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="break-all text-xs text-[#6941C6] hover:underline"
                        >
                          {row.website.replace(/^https?:\/\//, "")}
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {data && data.totalPages > 1 ? (
          <div className="flex items-center justify-between border-t border-[#EAECF0] px-4 py-3">
            <p className="text-xs text-[#667085]">
              {t("pagination", {
                page: data.page,
                totalPages: data.totalPages,
                total: data.total,
              })}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-[#D0D5DD] px-3 py-1.5 text-xs font-semibold text-[#344054] disabled:opacity-40"
              >
                {t("prev")}
              </button>
              <button
                type="button"
                disabled={page >= data.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-[#D0D5DD] px-3 py-1.5 text-xs font-semibold text-[#344054] disabled:opacity-40"
              >
                {t("next")}
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <p className="text-xs text-[#98A2B3]">{t("hintRefresh")}</p>
    </div>
  );
}
