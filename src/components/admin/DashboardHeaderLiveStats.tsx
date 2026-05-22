"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useTodayAnalytics } from "@/context/TodayAnalyticsContext";

function Divider() {
  return <span className="h-3 w-px shrink-0 bg-[#E4E7EC]" aria-hidden />;
}

function StatInline({
  label,
  value,
  hint,
  live,
}: {
  label: string;
  value: string | number;
  hint?: string;
  live?: boolean;
}) {
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap"
      title={hint}
    >
      {live ? (
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#12B76A] opacity-50" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#12B76A]" />
        </span>
      ) : null}
      <span className="text-[#98A2B3]">{label}</span>
      <span className="font-semibold tabular-nums text-[#344054]">{value}</span>
    </span>
  );
}

function TodayStatsRow({ className = "" }: { className?: string }) {
  const t = useTranslations("dashboard");
  const ta = useTranslations("adminAnalytics");
  const { data } = useTodayAnalytics();

  const conversion =
    data?.conversionRate != null ? `${data.conversionRate}%` : "—";
  const live = (data?.visitorsNow ?? 0) > 0;

  return (
    <span
      className={`inline-flex flex-nowrap items-center gap-3 text-xs ${className}`}
    >
      <span className="shrink-0 font-medium uppercase tracking-wider text-[#98A2B3]">
        {t("headerTodayShort")}
      </span>
      <Divider />
      <StatInline
        label={ta("metricLiveShort")}
        value={data?.visitorsNow ?? 0}
        hint={ta("metricLiveHint")}
        live={live}
      />
      <Divider />
      <StatInline
        label={t("headerSessionsShort")}
        value={data?.sessions ?? 0}
      />
      <Divider />
      <StatInline
        label={t("headerViewsShort")}
        value={data?.pageViews ?? 0}
      />
      <Divider />
      <StatInline
        label={t("headerBookingsShort")}
        value={data?.bookings ?? 0}
      />
      <Divider />
      <StatInline
        label={t("headerConversionShort")}
        value={conversion}
        hint={
          data
            ? ta("metricConversionHint", {
                bookings: data.bookings,
                sessions: data.sessions,
              })
            : undefined
        }
      />
    </span>
  );
}

const linkClass =
  "text-[#667085] transition-colors hover:text-[#6941C6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7F56D9]/30";

/** Desktop: één horizontale regel in de header. */
export function DashboardHeaderLiveStats() {
  const t = useTranslations("dashboard");

  return (
    <Link
      href="/dashboard-admin/live-view?period=all&outreach=1"
      className={`group hidden min-w-0 flex-1 items-center justify-center md:flex ${linkClass}`}
      title={t("headerStatsLink")}
    >
      <TodayStatsRow className="group-hover:[&_span]:text-[#6941C6]/90" />
    </Link>
  );
}

/** Mobiel: scrollbare regel onder de header. */
export function DashboardHeaderLiveStatsMobile() {
  const t = useTranslations("dashboard");

  return (
    <Link
      href="/dashboard-admin/live-view?period=all&outreach=1"
      className={`admin-mobile-stats flex overflow-x-auto border-b border-[#F2F4F7] bg-white/80 px-4 py-2 md:hidden ${linkClass}`}
      title={t("headerStatsLink")}
    >
      <TodayStatsRow />
    </Link>
  );
}
