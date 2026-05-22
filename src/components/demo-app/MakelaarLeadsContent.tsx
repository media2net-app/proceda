"use client";

import { useMemo, useState } from "react";
import type { DemoLead } from "@/lib/demo-app/types";
import { useMakelaarPortal } from "./MakelaarPortalContext";
import { AgentAvatar, DemoPageHeader, DemoSearchBar, FilterChip } from "./demo-ui";

const TYPE_LABEL: Record<DemoLead["type"], string> = {
  verkoper: "Verkoper",
  koper: "Koper",
  zoeker: "Zoeker",
};

const STAGE_LABEL: Record<DemoLead["stage"], string> = {
  nieuw: "Nieuw",
  contact: "Contact",
  bezichtiging: "Bezichtiging",
  onderhandeling: "Onderhandeling",
  afgerond: "Afgerond",
};

const STAGES: DemoLead["stage"][] = [
  "nieuw",
  "contact",
  "bezichtiging",
  "onderhandeling",
  "afgerond",
];

export default function MakelaarLeadsContent() {
  const { brand, data } = useMakelaarPortal();
  const primary = brand.primaryColor;
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<DemoLead["type"] | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(data.leads[0]?.id ?? null);

  const filtered = useMemo(() => {
    return data.leads.filter((l) => {
      const q = search.toLowerCase();
      const matchSearch =
        !search ||
        l.name.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        (l.property?.toLowerCase().includes(q) ?? false);
      const matchType = typeFilter === "all" || l.type === typeFilter;
      return matchSearch && matchType;
    });
  }, [data.leads, search, typeFilter]);

  const selected = data.leads.find((l) => l.id === selectedId) ?? filtered[0] ?? null;

  const byStage = STAGES.map((stage) => ({
    stage,
    label: STAGE_LABEL[stage],
    items: filtered.filter((l) => l.stage === stage),
  }));

  return (
    <>
      <DemoPageHeader
        brand={brand}
        title="Leads & contacten"
        subtitle={`${filtered.length} relaties · pipeline van lead tot overdracht`}
      />

      <DemoSearchBar
        value={search}
        onChange={setSearch}
        placeholder="Zoek op naam, e-mail of woning…"
      />

      <div className="mb-6 flex flex-wrap gap-2">
        <FilterChip
          label="Alle"
          active={typeFilter === "all"}
          onClick={() => setTypeFilter("all")}
          primaryColor={primary}
        />
        {(["verkoper", "koper", "zoeker"] as const).map((t) => (
          <FilterChip
            key={t}
            label={TYPE_LABEL[t]}
            active={typeFilter === t}
            onClick={() => setTypeFilter(t)}
            primaryColor={primary}
          />
        ))}
      </div>

      <div className="mb-6 overflow-x-auto pb-2">
        <div className="flex min-w-[900px] gap-3">
          {byStage.map((col) => (
            <div
              key={col.stage}
              className="flex w-52 shrink-0 flex-col rounded-xl border border-[#EAECF0] bg-[#F9FAFB] p-2"
            >
              <div className="mb-2 flex items-center justify-between px-1">
                <span className="text-xs font-semibold text-[#344054]">{col.label}</span>
                <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-[#667085]">
                  {col.items.length}
                </span>
              </div>
              <div className="space-y-2">
                {col.items.map((lead) => (
                  <button
                    key={lead.id}
                    type="button"
                    onClick={() => setSelectedId(lead.id)}
                    className={`w-full rounded-lg border bg-white p-3 text-left shadow-xs transition-shadow hover:shadow-sm ${
                      selected?.id === lead.id
                        ? "border-[#FDBA74] ring-1 ring-[#E85B2B]/40"
                        : "border-[#EAECF0]"
                    }`}
                  >
                    <p className="text-sm font-semibold text-[#101828]">{lead.name}</p>
                    <p className="mt-0.5 text-xs text-[#667085]">{TYPE_LABEL[lead.type]}</p>
                    {lead.property && (
                      <p className="mt-1 truncate text-xs text-[#475467]">{lead.property}</p>
                    )}
                    <div className="mt-2 flex items-center justify-between">
                      <span
                        className="rounded px-1.5 py-0.5 text-[10px] font-bold text-white"
                        style={{ backgroundColor: primary }}
                      >
                        {lead.score}
                      </span>
                      <AgentAvatar initials={lead.agent} primaryColor={primary} size="sm" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {selected && (
        <div className="rounded-xl border border-[#EAECF0] bg-white p-5 shadow-xs">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-[#101828]">{selected.name}</h3>
              <p className="text-sm text-[#667085]">
                {TYPE_LABEL[selected.type]} · {STAGE_LABEL[selected.stage]} · Lead-score{" "}
                <strong style={{ color: primary }}>{selected.score}</strong>
              </p>
            </div>
            <AgentAvatar initials={selected.agent} primaryColor={primary} />
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg bg-[#F9FAFB] p-3">
              <p className="text-xs text-[#667085]">E-mail</p>
              <p className="text-sm font-medium text-[#101828]">{selected.email}</p>
            </div>
            <div className="rounded-lg bg-[#F9FAFB] p-3">
              <p className="text-xs text-[#667085]">Telefoon</p>
              <p className="text-sm font-medium text-[#101828]">{selected.phone}</p>
            </div>
            <div className="rounded-lg bg-[#F9FAFB] p-3">
              <p className="text-xs text-[#667085]">Bron</p>
              <p className="text-sm font-medium text-[#101828]">{selected.source}</p>
            </div>
            <div className="rounded-lg bg-[#F9FAFB] p-3">
              <p className="text-xs text-[#667085]">Laatste contact</p>
              <p className="text-sm font-medium text-[#101828]">{selected.lastContact}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-lg px-4 py-2 text-sm font-semibold text-white"
              style={{ backgroundColor: primary }}
            >
              E-mail sturen
            </button>
            <button
              type="button"
              className="rounded-lg border border-[#D0D5DD] px-4 py-2 text-sm font-medium text-[#344054] hover:bg-[#F9FAFB]"
            >
              Bel terug
            </button>
            <button
              type="button"
              className="rounded-lg border border-[#D0D5DD] px-4 py-2 text-sm font-medium text-[#344054] hover:bg-[#F9FAFB]"
            >
              Bezichtiging plannen
            </button>
          </div>
        </div>
      )}
    </>
  );
}
