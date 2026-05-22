"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { demoAppHref } from "@/lib/demo-app/nav";
import type { DemoKpi, DemoListingRow } from "@/lib/demo-app/types";
import { useMakelaarPortal } from "./MakelaarPortalContext";
import {
  AgentAvatar,
  DemoPageHeader,
  DemoSearchBar,
  FilterChip,
  ListingStatusBadge,
  type ChartTrend,
} from "./demo-ui";
import { DemoAiEmployeeNotice } from "./DemoAiEmployeeNotice";
import { DemoAreaChart } from "./charts/DemoAreaChart";
import { DemoKpiChart } from "./charts/DemoKpiChart";

type PeriodFilter = "today" | "week" | "q2";

function kpiTrend(trend: string, label: string): ChartTrend {
  if (trend === "0") return "neutral";
  if (trend.startsWith("-")) {
    return label.includes("dagen op markt") ? "up" : "down";
  }
  return "up";
}

function KpiCard({
  kpi,
  primary,
  trendLabel,
}: {
  kpi: DemoKpi;
  primary: string;
  trendLabel: string;
}) {
  const chartTrend = kpiTrend(kpi.trend, kpi.label);
  return (
    <div className="overflow-hidden rounded-xl border border-[#EAECF0] bg-white shadow-xs">
      <div className="p-4 pb-0">
        <p className="text-sm font-medium text-[#667085]">{kpi.label}</p>
        <p className="mt-1.5 text-2xl font-semibold tracking-tight text-[#101828]">
          {kpi.value}
        </p>
        <p
          className={`mt-1 text-xs font-medium ${
            kpi.trend.startsWith("-") && !kpi.label.includes("dagen")
              ? "text-[#F04438]"
              : kpi.trend === "0"
                ? "text-[#667085]"
                : "text-[#12B76A]"
          }`}
        >
          {kpi.trend}{" "}
          <span className="font-normal text-[#667085]">{trendLabel}</span>
        </p>
      </div>
      <div
        className="relative mt-3 w-full overflow-hidden rounded-lg"
        style={{
          background: `linear-gradient(180deg, ${primary}06 0%, transparent 100%)`,
        }}
      >
        <DemoKpiChart
          points={kpi.chartPoints}
          color={primary}
          trend={chartTrend}
          height={88}
        />
      </div>
    </div>
  );
}

export default function MakelaarDashboardContent() {
  const { brand, slug, data } = useMakelaarPortal();
  const primary = brand.primaryColor;
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState<PeriodFilter>("q2");
  const [tasks, setTasks] = useState(data.tasks);

  const trendLabel =
    period === "q2"
      ? "t.o.v. Q1 2026"
      : period === "week"
        ? "t.o.v. vorige week"
        : "t.o.v. gisteren";

  const chartRangeLabel =
    period === "q2" ? "Q2 2026 (apr–jun)" : "Laatste 12 weken";

  const filteredListings = data.listings.filter(
    (r) =>
      !search ||
      r.address.toLowerCase().includes(search.toLowerCase()) ||
      r.city.toLowerCase().includes(search.toLowerCase()),
  );

  const recentListings = filteredListings.slice(0, 5);

  return (
    <>
      <DemoPageHeader
        brand={brand}
        title="Dashboard"
        subtitle={
          slug === "schenkel-makelaardij"
            ? "Overzicht woningaanbod, leads en bezichtigingen — Zuid-West Drenthe"
            : "Overzicht woningaanbod, leads en bezichtigingen"
        }
        action={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-lg border border-[#D0D5DD] bg-white px-4 py-2 text-sm font-medium text-[#344054] shadow-xs hover:bg-[#F9FAFB]"
            >
              Export
            </button>
            <Link
              href={demoAppHref(slug, "woningaanbod")}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-xs"
              style={{ backgroundColor: primary }}
            >
              Woning toevoegen
            </Link>
          </div>
        }
      />

      <DemoAiEmployeeNotice
        insight={data.aiInsight}
        primaryColor={primary}
      />

      <DemoSearchBar
        value={search}
        onChange={setSearch}
        placeholder="Zoek adres, plaats of status…"
      />

      <div className="mb-6 flex flex-wrap gap-2">
        <FilterChip
          label="Vandaag"
          active={period === "today"}
          onClick={() => setPeriod("today")}
          primaryColor={primary}
        />
        <FilterChip
          label="7 dagen"
          active={period === "week"}
          onClick={() => setPeriod("week")}
          primaryColor={primary}
        />
        <FilterChip
          label="Q2 2026"
          active={period === "q2"}
          onClick={() => setPeriod("q2")}
          primaryColor={primary}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <div className="min-w-0">
          <div className="grid gap-3 sm:grid-cols-2">
            {data.kpis.map((kpi) => (
              <KpiCard
                key={kpi.label}
                kpi={kpi}
                primary={primary}
                trendLabel={trendLabel}
              />
            ))}
          </div>
        </div>

        <div className="min-w-0 space-y-4">
          <div className="rounded-xl border border-[#EAECF0] bg-white p-5 shadow-xs">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-[#101828]">
                Recent aanbod
              </h2>
              <Link
                href={demoAppHref(slug, "woningaanbod")}
                className="text-xs font-semibold hover:underline"
                style={{ color: primary }}
              >
                Alles →
              </Link>
            </div>
            <ul className="space-y-2">
              {recentListings.map((row) => (
                <ListingRowCompact key={row.id} row={row} primary={primary} />
              ))}
              {recentListings.length === 0 && (
                <p className="text-sm text-[#667085]">Geen woningen gevonden.</p>
              )}
            </ul>
          </div>

          <div className="rounded-xl border border-[#EAECF0] bg-white p-5 shadow-xs">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-[#101828]">Taken</h2>
              <Link
                href={demoAppHref(slug, "taken")}
                className="text-xs font-semibold hover:underline"
                style={{ color: primary }}
              >
                Alles →
              </Link>
            </div>
            <ul className="space-y-2 text-sm">
              {tasks.slice(0, 5).map((task) => (
                <li
                  key={task.id}
                  className="flex items-center gap-2 rounded-lg border border-[#EAECF0] bg-[#F9FAFB] px-3 py-2"
                >
                  <input
                    type="checkbox"
                    checked={!!task.done}
                    onChange={() =>
                      setTasks((prev) =>
                        prev.map((t) =>
                          t.id === task.id ? { ...t, done: !t.done } : t,
                        ),
                      )
                    }
                    className="h-4 w-4 shrink-0 rounded border-[#D0D5DD]"
                  />
                  <span
                    className={`min-w-0 flex-1 ${
                      task.done ? "text-[#98A2B3] line-through" : "text-[#344054]"
                    }`}
                  >
                    {task.title}
                  </span>
                  <span className="shrink-0 text-xs text-[#667085]">{task.due}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-[#EAECF0] bg-white p-5 shadow-xs">
            <h2 className="text-base font-semibold text-[#101828]">Activiteiten</h2>
            <ul className="mt-3 space-y-2 text-sm text-[#475467]">
              {data.activities.slice(0, 5).map((item) => (
                <li
                  key={item}
                  className="rounded-lg border border-[#EAECF0] bg-[#F9FAFB] px-3 py-2"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-[#EAECF0] bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-[#101828]">
              Pipeline verkoopwaarde
            </h2>
            <span className="text-xs text-[#667085]">{chartRangeLabel}</span>
          </div>
          <div className="mt-4 h-52 overflow-hidden rounded-xl border border-[#EAECF0]/80 bg-gradient-to-b from-[#FFF4ED]/40 to-[#F9FAFB] px-2 pb-2 pt-4">
            <DemoAreaChart
              points={data.pipelinePoints}
              color={primary}
              trend="up"
              height={200}
            />
          </div>
        </div>
        <div className="rounded-xl border border-[#EAECF0] bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-[#101828]">
              Website-bezoeken aanbod
            </h2>
            <span className="text-xs text-[#667085]">{chartRangeLabel}</span>
          </div>
          <div className="mt-4 h-52 overflow-hidden rounded-xl border border-[#EAECF0]/80 bg-gradient-to-b from-[#F9FAFB] to-white px-2 pb-2 pt-4">
            <DemoAreaChart
              points={data.viewsPoints}
              color={brand.secondaryColor || "#344054"}
              trend="up"
              height={200}
            />
          </div>
        </div>
      </div>
    </>
  );
}

function ListingRowCompact({
  row,
  primary,
}: {
  row: DemoListingRow;
  primary: string;
}) {
  return (
    <li className="flex items-center gap-3 rounded-lg border border-[#EAECF0] bg-[#F9FAFB] p-2.5">
      <div className="h-12 w-16 shrink-0 overflow-hidden rounded-md bg-[#F2F4F7]">
        {row.thumbSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={row.thumbSrc} alt="" className="h-full w-full object-cover" />
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-[#101828]">{row.address}</p>
        <p className="text-xs text-[#667085]">{row.city}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <ListingStatusBadge status={row.status} statusStyle={row.statusStyle} />
          <span className="text-xs text-[#667085]">{row.daysOnMarket}d</span>
        </div>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-sm font-semibold" style={{ color: primary }}>
          {row.price}
        </p>
        <div className="mt-1 flex justify-end">
          <AgentAvatar initials={row.agent} primaryColor={primary} size="sm" />
        </div>
      </div>
    </li>
  );
}
