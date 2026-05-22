"use client";

import { useMemo, useState } from "react";
import type { DemoViewing } from "@/lib/demo-app/types";
import { useMakelaarPortal } from "./MakelaarPortalContext";
import { AgentAvatar, DemoPageHeader, DemoSearchBar, FilterChip } from "./demo-ui";

const STATUS_STYLE: Record<DemoViewing["status"], string> = {
  gepland: "bg-[#FFF4ED] text-[#C4320A]",
  bevestigd: "bg-[#ECFDF3] text-[#027A48]",
  afgerond: "bg-[#F2F4F7] text-[#475467]",
  geannuleerd: "bg-[#FEF3F2] text-[#B42318]",
};

const STATUS_LABEL: Record<DemoViewing["status"], string> = {
  gepland: "Gepland",
  bevestigd: "Bevestigd",
  afgerond: "Afgerond",
  geannuleerd: "Geannuleerd",
};

export default function MakelaarViewingsContent() {
  const { brand, data } = useMakelaarPortal();
  const primary = brand.primaryColor;
  const [search, setSearch] = useState("");
  const [dayFilter, setDayFilter] = useState<"all" | "Vandaag" | "Morgen">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return data.viewings.filter((v) => {
      const q = search.toLowerCase();
      const matchSearch =
        !search ||
        v.property.toLowerCase().includes(q) ||
        v.contact.toLowerCase().includes(q);
      const matchDay = dayFilter === "all" || v.date === dayFilter;
      return matchSearch && matchDay;
    });
  }, [data.viewings, search, dayFilter]);

  const selected = data.viewings.find((v) => v.id === selectedId) ?? filtered[0] ?? null;

  const upcoming = filtered.filter((v) => v.status !== "afgerond" && v.status !== "geannuleerd");

  return (
    <>
      <DemoPageHeader
        brand={brand}
        title="Bezichtigingen"
        subtitle={`${upcoming.length} gepland · bevestigingen & herinneringen automatisch`}
        action={
          <button
            type="button"
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-xs"
            style={{ backgroundColor: primary }}
          >
            + Bezichtiging plannen
          </button>
        }
      />

      <DemoSearchBar
        value={search}
        onChange={setSearch}
        placeholder="Zoek woning of contact…"
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {(["all", "Vandaag", "Morgen"] as const).map((d) => (
          <FilterChip
            key={d}
            label={d === "all" ? "Alle dagen" : d}
            active={dayFilter === d}
            onClick={() => setDayFilter(d)}
            primaryColor={primary}
          />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {filtered.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setSelectedId(v.id)}
              className={`flex w-full flex-wrap items-center gap-4 rounded-xl border bg-white p-4 text-left shadow-xs transition-shadow hover:shadow-md sm:flex-nowrap ${
                selected?.id === v.id
                  ? "border-[#FDBA74] ring-2 ring-[#E85B2B]/25"
                  : "border-[#EAECF0]"
              }`}
            >
              <div
                className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-lg text-center"
                style={{ backgroundColor: `${primary}18` }}
              >
                <span className="text-[10px] font-semibold uppercase text-[#667085]">
                  {v.date}
                </span>
                <span className="text-lg font-bold" style={{ color: primary }}>
                  {v.time}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-[#101828]">{v.property}</p>
                <p className="text-sm text-[#667085]">
                  {v.city} · {v.contact} · {v.attendees} personen
                </p>
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  STATUS_STYLE[v.status]
                }`}
              >
                {STATUS_LABEL[v.status]}
              </span>
              <AgentAvatar initials={v.agent} primaryColor={primary} />
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="rounded-xl border border-dashed border-[#D0D5DD] p-8 text-center text-sm text-[#667085]">
              Geen bezichtigingen voor dit filter.
            </p>
          )}
        </div>

        {selected && (
          <div className="rounded-xl border border-[#EAECF0] bg-white p-5 shadow-xs lg:sticky lg:top-24">
            <h3 className="text-base font-semibold text-[#101828]">Afspraakdetails</h3>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-[#667085]">Woning</dt>
                <dd className="font-medium text-[#101828]">{selected.property}</dd>
              </div>
              <div>
                <dt className="text-[#667085]">Datum & tijd</dt>
                <dd className="font-medium text-[#101828]">
                  {selected.date} · {selected.time}
                </dd>
              </div>
              <div>
                <dt className="text-[#667085]">Contact</dt>
                <dd className="font-medium text-[#101828]">{selected.contact}</dd>
              </div>
              <div>
                <dt className="text-[#667085]">Makelaar</dt>
                <dd className="font-medium text-[#101828]">{selected.agentName}</dd>
              </div>
            </dl>
            <div className="mt-5 space-y-2">
              <button
                type="button"
                className="w-full rounded-lg py-2 text-sm font-semibold text-white"
                style={{ backgroundColor: primary }}
              >
                Bevestiging versturen
              </button>
              <button
                type="button"
                className="w-full rounded-lg border border-[#D0D5DD] py-2 text-sm font-medium text-[#344054]"
              >
                Woondossier delen
              </button>
              <button
                type="button"
                className="w-full rounded-lg border border-[#FECDCA] py-2 text-sm font-medium text-[#B42318]"
              >
                Annuleren
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
