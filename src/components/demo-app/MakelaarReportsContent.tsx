"use client";

import { useState } from "react";
import { useMakelaarPortal } from "./MakelaarPortalContext";
import { DemoChart, DemoPageHeader, FilterChip } from "./demo-ui";

export default function MakelaarReportsContent() {
  const { brand, data } = useMakelaarPortal();
  const primary = brand.primaryColor;
  const [period, setPeriod] = useState<"7d" | "30d" | "q2">("q2");

  return (
    <>
      <DemoPageHeader
        brand={brand}
        title="Rapportages"
        subtitle="Teamprestaties, pipeline en Funda-statistieken"
        action={
          <button
            type="button"
            className="rounded-lg border border-[#D0D5DD] bg-white px-4 py-2 text-sm font-medium text-[#344054] shadow-xs hover:bg-[#F9FAFB]"
          >
            Export PDF
          </button>
        }
      />

      <div className="mb-6 flex flex-wrap gap-2">
        <FilterChip
          label="7 dagen"
          active={period === "7d"}
          onClick={() => setPeriod("7d")}
          primaryColor={primary}
        />
        <FilterChip
          label="30 dagen"
          active={period === "30d"}
          onClick={() => setPeriod("30d")}
          primaryColor={primary}
        />
        <FilterChip
          label="Q2 2026"
          active={period === "q2"}
          onClick={() => setPeriod("q2")}
          primaryColor={primary}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.reportMetrics.map((m) => (
          <div
            key={m.label}
            className="rounded-xl border border-[#EAECF0] bg-white p-5 shadow-xs"
          >
            <p className="text-sm font-medium text-[#667085]">{m.label}</p>
            <p className="mt-2 text-2xl font-semibold text-[#101828]">{m.value}</p>
            <p
              className={`mt-1 text-sm font-medium ${
                m.positive ? "text-[#12B76A]" : "text-[#F04438]"
              }`}
            >
              {m.change} t.o.v. vorige periode
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-[#EAECF0] bg-white p-5 shadow-xs">
          <h2 className="text-base font-semibold text-[#101828]">Omzet per makelaar</h2>
          <div className="mt-4 space-y-3">
            {data.agents.map((agent, i) => {
              const pct = [88, 72, 65, 54][i] ?? 50;
              return (
                <div key={agent.initials}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-medium text-[#344054]">{agent.name}</span>
                    <span className="text-[#667085]">€ {(42 - i * 8) * 1000}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[#F2F4F7]">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, backgroundColor: primary }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-[#EAECF0] bg-white p-5 shadow-xs">
          <h2 className="text-base font-semibold text-[#101828]">Conversie funnel</h2>
          <div className="mt-4 h-48 overflow-hidden rounded-xl border border-[#EAECF0]/80 bg-gradient-to-b from-[#FFF4ED]/50 to-[#F9FAFB] p-4 pt-6">
            <DemoChart
              points={data.pipelinePoints}
              stroke={primary}
              trend="up"
              variant="area"
            />
          </div>
          <ul className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
            <li className="rounded-lg bg-[#F9FAFB] p-2">
              <p className="font-bold text-[#101828]">48</p>
              <p className="text-[#667085]">Leads</p>
            </li>
            <li className="rounded-lg bg-[#F9FAFB] p-2">
              <p className="font-bold text-[#101828]">16</p>
              <p className="text-[#667085]">Bezichtigingen</p>
            </li>
            <li className="rounded-lg bg-[#F9FAFB] p-2">
              <p className="font-bold text-[#101828]">6</p>
              <p className="text-[#667085]">Onder bod</p>
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-[#EAECF0] bg-white p-5 shadow-xs">
        <h2 className="text-base font-semibold text-[#101828]">Funda-performance per object</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead className="text-xs text-[#667085]">
              <tr className="border-b border-[#EAECF0]">
                <th className="pb-2 font-medium">Woning</th>
                <th className="pb-2 font-medium">Weergaven</th>
                <th className="pb-2 font-medium">Contact</th>
                <th className="pb-2 font-medium">Trend</th>
              </tr>
            </thead>
            <tbody>
              {data.listings.slice(0, 5).map((l) => (
                <tr key={l.id} className="border-b border-[#EAECF0] last:border-b-0">
                  <td className="py-2 font-medium text-[#101828]">{l.address}</td>
                  <td className="py-2">{l.fundaViews}</td>
                  <td className="py-2">{Math.floor((l.fundaViews ?? 0) / 12)}</td>
                  <td className="py-2 text-[#12B76A]">+{8 + (l.daysOnMarket % 15)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
