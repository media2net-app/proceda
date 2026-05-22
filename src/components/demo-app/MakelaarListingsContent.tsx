"use client";

import { useMemo, useState } from "react";
import { useMakelaarPortal } from "./MakelaarPortalContext";
import {
  AgentAvatar,
  DemoPageHeader,
  DemoSearchBar,
  FilterChip,
  ListingStatusBadge,
} from "./demo-ui";
import type { ListingStatusStyle } from "@/lib/demo-app/types";

const STATUS_FILTERS: { label: string; value: ListingStatusStyle | "all" }[] = [
  { label: "Alle", value: "all" },
  { label: "Nieuw", value: "new" },
  { label: "Te koop", value: "sale" },
  { label: "Onder bod", value: "bid" },
  { label: "Verkocht", value: "sold" },
];

export default function MakelaarListingsContent() {
  const { brand, data } = useMakelaarPortal();
  const primary = brand.primaryColor;
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ListingStatusStyle | "all">("all");
  const [view, setView] = useState<"grid" | "table">("table");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return data.listings.filter((r) => {
      const matchSearch =
        !search ||
        r.address.toLowerCase().includes(search.toLowerCase()) ||
        r.city.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || r.statusStyle === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [data.listings, search, statusFilter]);

  const selected = filtered.find((r) => r.id === selectedId) ?? filtered[0] ?? null;

  return (
    <>
      <DemoPageHeader
        brand={brand}
        title="Woningaanbod"
        subtitle={`${filtered.length} woningen · Funda-sync actief`}
        action={
          <div className="flex flex-wrap gap-2">
            <span className="flex items-center gap-1.5 rounded-lg border border-[#ABEFC6] bg-[#ECFDF3] px-3 py-2 text-xs font-semibold text-[#027A48]">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#12B76A]" />
              Live sync
            </span>
            <button
              type="button"
              className="rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-xs"
              style={{ backgroundColor: primary }}
            >
              + Woning toevoegen
            </button>
          </div>
        }
      />

      <DemoSearchBar
        value={search}
        onChange={setSearch}
        placeholder="Zoek op adres, plaats of makelaar…"
      />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((f) => (
            <FilterChip
              key={f.value}
              label={f.label}
              active={statusFilter === f.value}
              onClick={() => setStatusFilter(f.value)}
              primaryColor={primary}
            />
          ))}
        </div>
        <div className="flex rounded-lg border border-[#D0D5DD] bg-white p-0.5 shadow-xs">
          <button
            type="button"
            onClick={() => setView("grid")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              view === "grid" ? "text-white" : "text-[#667085]"
            }`}
            style={view === "grid" ? { backgroundColor: primary } : undefined}
          >
            Grid
          </button>
          <button
            type="button"
            onClick={() => setView("table")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              view === "table" ? "text-white" : "text-[#667085]"
            }`}
            style={view === "table" ? { backgroundColor: primary } : undefined}
          >
            Tabel
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className={selected ? "lg:col-span-2" : "lg:col-span-3"}>
          {view === "grid" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {filtered.map((row) => (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => setSelectedId(row.id)}
                  className={`rounded-xl border bg-white p-4 text-left shadow-xs transition-shadow hover:shadow-md ${
                    selected?.id === row.id
                      ? "border-[#FDBA74] ring-2 ring-[#E85B2B]/30"
                      : "border-[#EAECF0]"
                  }`}
                >
                  <div className="mb-3 aspect-[4/3] overflow-hidden rounded-lg bg-[#F2F4F7]">
                    {row.thumbSrc ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={row.thumbSrc}
                        alt={row.address}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-4xl text-[#D0D5DD]">
                        🏠
                      </div>
                    )}
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-[#101828]">{row.address}</p>
                      <p className="text-xs text-[#667085]">{row.city}</p>
                    </div>
                    <ListingStatusBadge status={row.status} statusStyle={row.statusStyle} />
                  </div>
                  <p className="mt-2 text-lg font-bold" style={{ color: primary }}>
                    {row.price}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-xs text-[#667085]">
                    <span>{row.daysOnMarket}d op markt · {row.fundaViews} Funda-views</span>
                    <AgentAvatar initials={row.agent} primaryColor={primary} size="sm" />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[#EAECF0] bg-white shadow-xs">
              <table className="w-full min-w-[800px] text-left text-sm">
                <thead className="bg-[#F9FAFB] text-xs text-[#667085]">
                  <tr>
                    <th className="px-4 py-3 font-medium">Woning</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Prijs</th>
                    <th className="px-4 py-3 font-medium">m²</th>
                    <th className="px-4 py-3 font-medium">Funda</th>
                    <th className="px-4 py-3 font-medium">Makelaar</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row) => (
                    <tr
                      key={row.id}
                      onClick={() => setSelectedId(row.id)}
                      className={`cursor-pointer border-t border-[#EAECF0] hover:bg-[#F9FAFB] ${
                        selected?.id === row.id ? "bg-[#FFF4ED]/40" : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-16 shrink-0 overflow-hidden rounded-md bg-[#F2F4F7]">
                          {row.thumbSrc ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={row.thumbSrc}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : null}
                        </div>
                        <span className="font-medium text-[#101828]">{row.address}</span>
                      </div>
                    </td>
                      <td className="px-4 py-3">
                        <ListingStatusBadge status={row.status} statusStyle={row.statusStyle} />
                      </td>
                      <td className="px-4 py-3 font-semibold" style={{ color: primary }}>
                        {row.price}
                      </td>
                      <td className="px-4 py-3 text-[#667085]">{row.livingArea}</td>
                      <td className="px-4 py-3 text-[#667085]">{row.fundaViews}</td>
                      <td className="px-4 py-3">
                        <AgentAvatar initials={row.agent} primaryColor={primary} size="sm" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {filtered.length === 0 && (
            <p className="rounded-xl border border-dashed border-[#D0D5DD] bg-white p-12 text-center text-sm text-[#667085]">
              Geen woningen gevonden voor dit filter.
            </p>
          )}
        </div>

        {selected && (
          <div className="rounded-xl border border-[#EAECF0] bg-white p-5 shadow-xs lg:sticky lg:top-6 lg:self-start">
            {selected.thumbSrc && (
              <div className="mb-4 aspect-video overflow-hidden rounded-lg bg-[#F2F4F7]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selected.thumbSrc}
                  alt={selected.address}
                  className="h-full w-full object-cover"
                />
              </div>
            )}
            <h3 className="text-base font-semibold text-[#101828]">Objectdetails</h3>
            <p className="mt-1 text-sm text-[#667085]">{selected.address}</p>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-[#667085]">Status</dt>
                <dd>
                  <ListingStatusBadge status={selected.status} statusStyle={selected.statusStyle} />
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#667085]">Vraagprijs</dt>
                <dd className="font-semibold" style={{ color: primary }}>
                  {selected.price}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#667085]">Woonoppervlak</dt>
                <dd className="text-[#101828]">{selected.livingArea}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#667085]">Slaapkamers</dt>
                <dd className="text-[#101828]">{selected.bedrooms}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#667085]">Makelaar</dt>
                <dd className="text-[#101828]">{selected.agentName}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#667085]">Funda-weergaven</dt>
                <dd className="text-[#101828]">{selected.fundaViews}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#667085]">Funda</dt>
                <dd className="text-[#101828]">
                  {selected.fundaPublished ? "Gepubliceerd" : "Niet live"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#667085]">Laatste sync</dt>
                <dd className="text-[#101828]">{selected.lastSync ?? "—"}</dd>
              </div>
            </dl>
            <div className="mt-5 flex flex-col gap-2">
              <button
                type="button"
                className="w-full rounded-lg py-2 text-sm font-semibold text-white"
                style={{ backgroundColor: primary }}
              >
                Publiceren naar Funda
              </button>
              <button
                type="button"
                className="w-full rounded-lg border border-[#D0D5DD] py-2 text-sm font-medium text-[#344054] hover:bg-[#F9FAFB]"
              >
                Bezichtiging plannen
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
