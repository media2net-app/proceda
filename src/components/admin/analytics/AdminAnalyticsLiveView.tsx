"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import AdminLiveGlobe from "@/components/admin/analytics/AdminLiveGlobe";
import { formatTopPageLabel } from "@/lib/analytics-funnel";
import type { AnalyticsLiveSnapshot, AnalyticsPeriod } from "@/lib/analytics-live-types";

const POLL_MS = 4000;

function maxViews(data: { views: number }[]): number {
  return Math.max(1, ...data.map((d) => d.views));
}

function formatConversionRate(rate: number | null | undefined): string {
  if (rate == null || !Number.isFinite(rate)) return "—";
  return `${rate.toFixed(1)}%`;
}

function timeAgo(iso: string): string {
  const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 60) return `${sec}s`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m`;
  return `${Math.floor(sec / 3600)}u`;
}

export default function AdminAnalyticsLiveView() {
  const t = useTranslations("adminAnalytics");
  const [period, setPeriod] = useState<AnalyticsPeriod>("today");
  const [data, setData] = useState<AnalyticsLiveSnapshot | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const periodOptions: { value: AnalyticsPeriod; label: string }[] = [
    { value: "today", label: t("periodToday") },
    { value: "7d", label: t("period7d") },
    { value: "30d", label: t("period30d") },
    { value: "all", label: t("periodAll") },
  ];

  const load = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/admin/analytics/live?period=${encodeURIComponent(period)}`,
        { cache: "no-store" },
      );
      const json = (await res.json()) as AnalyticsLiveSnapshot & {
        error?: string;
      };
      if (!res.ok) {
        setError(json.error ?? t("loadError"));
        return;
      }
      setError("");
      setData(json);
    } catch {
      setError(t("networkError"));
    } finally {
      setLoading(false);
    }
  }, [period, t]);

  useEffect(() => {
    setLoading(true);
    void load();
    const id = window.setInterval(() => void load(), POLL_MS);
    return () => window.clearInterval(id);
  }, [load]);

  const updatedLabel = data?.generatedAt
    ? new Date(data.generatedAt).toLocaleTimeString("nl-NL", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "—";

  const chartMax = maxViews(data?.pageViewsLast10Min ?? []);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#7F56D9]">{t("eyebrow")}</p>
          <h1 className="text-2xl font-bold text-[#101828] sm:text-3xl">{t("title")}</h1>
          <p className="mt-1 text-sm text-[#667085]">
            {t("subtitle", { time: updatedLabel })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {periodOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setPeriod(opt.value)}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                period === opt.value
                  ? "bg-[#7F56D9] text-white"
                  : "border border-[#EAECF0] bg-white text-[#344054] hover:border-[#D6BBFB]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </header>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1fr_300px] xl:grid-cols-[1fr_340px]">
        <section className="relative min-h-[360px] overflow-hidden rounded-2xl border border-[#EAECF0] bg-gradient-to-br from-[#F9F5FF] via-white to-[#F2F4F7] p-4 lg:min-h-[480px]">
          <AdminLiveGlobe
            visitors={data?.visitors ?? []}
            legendVisitor={t("legendVisitor")}
            legendBooking={t("legendBooking")}
          />
          {loading && !data ? (
            <p className="absolute inset-x-0 bottom-4 text-center text-sm text-[#667085]">
              {t("globeLoading")}
            </p>
          ) : null}
          {!loading && data && data.visitorsNow === 0 ? (
            <p className="absolute inset-x-0 bottom-4 text-center text-sm text-[#667085]">
              {t("noActiveVisitors")}
            </p>
          ) : null}
        </section>

        <aside className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <MetricCard
            label={t("metricLive")}
            value={data?.visitorsNow ?? (loading ? "…" : 0)}
            hint={t("metricLiveHint")}
            accent
          />
          <MetricCard
            label={t("metricBooking")}
            value={data?.bookingNow ?? (loading ? "…" : 0)}
            hint={t("metricBookingHint")}
          />
          <MetricCard
            label={t("metricSessions")}
            value={data?.sessions ?? (loading ? "…" : 0)}
            hint={data?.periodLabel ?? ""}
          />
          <MetricCard
            label={t("metricPageViews")}
            value={data?.pageViews ?? (loading ? "…" : 0)}
            hint={data?.periodLabel ?? ""}
          />
          <MetricCard
            label={t("metricBookings")}
            value={data?.bookings ?? (loading ? "…" : 0)}
            hint={data?.periodLabel ?? ""}
          />
          <MetricCard
            label={t("metricConversion")}
            value={formatConversionRate(data?.conversionRate)}
            hint={t("metricConversionHint", {
              bookings: data?.bookings ?? 0,
              sessions: data?.sessions ?? 0,
            })}
          />
        </aside>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <Panel title={t("chartPageViews")} subtitle={t("chartPageViewsSub")}>
          <div className="flex h-36 items-end gap-1 pt-2">
            {(data?.pageViewsLast10Min ?? []).map((bucket) => (
              <div
                key={bucket.minute}
                className="flex flex-1 flex-col items-center gap-1"
              >
                <div
                  className="w-full min-h-[8px] rounded-t bg-gradient-to-t from-[#7F56D9] to-[#B692F6]"
                  style={{
                    height: `${Math.max(8, (bucket.views / chartMax) * 100)}%`,
                  }}
                  title={`${bucket.views}`}
                />
                <span className="text-[10px] text-[#98A2B3]">{bucket.minute}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title={t("topPages")} subtitle={data?.periodLabel}>
          <BarList
            items={(data?.topPages ?? []).map((r) => ({
              key: r.path,
              label: formatTopPageLabel(r.path),
              views: r.views,
              max: maxViews(data?.topPages ?? []),
            }))}
            empty={t("noData")}
          />
        </Panel>

        <Panel title={t("topFunnels")} subtitle={data?.periodLabel}>
          <BarList
            items={(data?.topFunnels ?? []).map((r) => ({
              label: r.label,
              views: r.views,
              max: maxViews(data?.topFunnels ?? []),
            }))}
            empty={t("noFunnelData")}
          />
        </Panel>
      </div>

      <Panel title={t("activeVisitors")} subtitle={t("activeVisitorsSub")}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#EAECF0] text-[#667085]">
                <th className="px-3 py-2 font-semibold">{t("colStatus")}</th>
                <th className="px-3 py-2 font-semibold">{t("colFunnel")}</th>
                <th className="px-3 py-2 font-semibold">{t("colPage")}</th>
                <th className="px-3 py-2 font-semibold">{t("colLocation")}</th>
                <th className="px-3 py-2 font-semibold">{t("colLastSeen")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAECF0]">
              {(data?.activeVisitors ?? []).length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-3 py-8 text-center text-[#667085]"
                  >
                    {t("noActiveVisitors")}
                  </td>
                </tr>
              ) : (
                data?.activeVisitors.map((v) => (
                  <tr key={v.sessionId} className="text-[#344054]">
                    <td className="px-3 py-2">
                      {v.bookingActive ? (
                        <span className="inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                          {t("statusBooking")}
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-[#F9F5FF] px-2 py-0.5 text-xs font-semibold text-[#6941C6]">
                          {t("statusVisit")}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2">{v.funnelLabel ?? "—"}</td>
                    <td className="max-w-[200px] truncate px-3 py-2 font-mono text-xs text-[#667085]">
                      {v.path}
                    </td>
                    <td className="px-3 py-2">
                      {[v.city, v.countryCode].filter(Boolean).join(", ") || "—"}
                    </td>
                    <td className="px-3 py-2 text-[#667085]">
                      {timeAgo(v.lastSeenAt)} {t("ago")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function MetricCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string | number;
  hint: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        accent
          ? "border-[#D6BBFB] bg-gradient-to-br from-[#F9F5FF] to-white"
          : "border-[#EAECF0] bg-white"
      }`}
    >
      <p className="text-xs font-semibold text-[#667085]">{label}</p>
      <p
        className={`mt-1 text-2xl font-bold tabular-nums ${
          accent ? "text-[#7F56D9]" : "text-[#101828]"
        }`}
      >
        {value}
      </p>
      <p className="mt-0.5 text-xs text-[#98A2B3]">{hint}</p>
    </div>
  );
}

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[#EAECF0] bg-white p-4 shadow-xs">
      <h2 className="text-base font-bold text-[#101828]">{title}</h2>
      {subtitle ? (
        <p className="mt-0.5 text-xs text-[#667085]">{subtitle}</p>
      ) : null}
      <div className="mt-3">{children}</div>
    </section>
  );
}

function BarList({
  items,
  empty,
}: {
  items: { key?: string; label: string; views: number; max: number }[];
  empty: string;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-[#667085]">{empty}</p>;
  }
  return (
    <ul className="space-y-2">
      {items.map((row) => (
        <li key={row.key ?? row.label} className="flex items-center gap-2 text-sm">
          <span
            className="min-w-0 flex-1 truncate text-[#344054]"
            title={row.label}
          >
            {row.label}
          </span>
          <span className="h-2 max-w-[100px] flex-1 overflow-hidden rounded-full bg-[#F2F4F7]">
            <span
              className="block h-full rounded-full bg-[#7F56D9]"
              style={{ width: `${(row.views / row.max) * 100}%` }}
            />
          </span>
          <span className="w-8 text-right font-mono text-xs text-[#667085]">
            {row.views}
          </span>
        </li>
      ))}
    </ul>
  );
}
