"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FundaScrapeResult } from "@/lib/funda/types";
import { useMakelaarPortal } from "./MakelaarPortalContext";
import { DemoPageHeader, DemoSearchBar, FilterChip } from "./demo-ui";

function formatEur(n: number) {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

export default function MakelaarFundaMarktContent() {
  const { brand } = useMakelaarPortal();
  const primary = brand.primaryColor;
  const [data, setData] = useState<FundaScrapeResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "schenkel" | "other">("all");

  const load = useCallback(async (refresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/demo/funda-scrape${refresh ? "?refresh=1" : ""}`,
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Laden mislukt");
      setData(json as FundaScrapeResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Funda scrape mislukt");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(false);
  }, [load]);

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.listings.filter((l) => {
      const q = search.toLowerCase();
      const matchSearch =
        !search ||
        l.address.toLowerCase().includes(q) ||
        l.agent.toLowerCase().includes(q) ||
        l.price.toLowerCase().includes(q);
      const matchFilter =
        filter === "all" ||
        (filter === "schenkel" && l.isOwnOffice) ||
        (filter === "other" && !l.isOwnOffice);
      return matchSearch && matchFilter;
    });
  }, [data, search, filter]);

  const scrapedLabel = data
    ? new Date(data.scrapedAt).toLocaleString("nl-NL", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <>
      <DemoPageHeader
        brand={brand}
        title="Funda markt — Hoogeveen"
        subtitle="Live marktscan: alle koopwoningen in Hoogeveen (Drenthe) vs. eigen aanbod"
        action={
          <button
            type="button"
            disabled={loading}
            onClick={() => load(true)}
            className="rounded-lg border border-[#D0D5DD] bg-white px-4 py-2 text-sm font-semibold text-[#344054] shadow-xs hover:bg-[#F9FAFB] disabled:opacity-60"
          >
            {loading ? "Scrapen…" : "↻ Ververs Funda-data"}
          </button>
        }
      />

      {error && (
        <div className="mb-6 rounded-xl border border-[#FECDCA] bg-[#FEF3F2] p-4 text-sm text-[#B42318]">
          {error}
        </div>
      )}

      {data && (
        <>
          <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-[#EAECF0] bg-white p-4 shadow-xs">
              <p className="text-xs font-medium text-[#667085]">Totaal op Funda</p>
              <p className="mt-1 text-2xl font-bold text-[#101828]">{data.totalCount}</p>
              <p className="text-xs text-[#667085]">Hoogeveen · koop</p>
            </div>
            <div className="rounded-xl border border-[#EAECF0] bg-white p-4 shadow-xs">
              <p className="text-xs font-medium text-[#667085]">Gem. vraagprijs (sample)</p>
              <p className="mt-1 text-2xl font-bold text-[#101828]">
                {data.stats.avgPrice ? formatEur(data.stats.avgPrice) : "—"}
              </p>
              <p className="text-xs text-[#667085]">
                {data.listings.length} woningen in deze scan
              </p>
            </div>
            <div className="rounded-xl border border-[#FDBA74] bg-[#FFF4ED] p-4 shadow-xs">
              <p className="text-xs font-medium text-[#C4320A]">Schenkel Makelaardij</p>
              <p className="mt-1 text-2xl font-bold text-[#101828]">
                {data.stats.schenkelCount}
              </p>
              <p className="text-xs text-[#C4320A]">
                {data.stats.competitors?.length
                  ? "exact aantal op Funda"
                  : "eigen listings op Funda"}
              </p>
            </div>
            <div className="rounded-xl border border-[#EAECF0] bg-white p-4 shadow-xs">
              <p className="text-xs font-medium text-[#667085]">Laatste scrape</p>
              <p className="mt-1 text-sm font-semibold text-[#101828]">{scrapedLabel}</p>
              <p className="text-xs text-[#667085]">Bron: funda.nl</p>
            </div>
          </div>

          {data.stats.competitors && data.stats.competitors.length > 0 && (
            <div className="mb-6 rounded-xl border border-[#EAECF0] bg-white p-4 shadow-xs sm:p-6">
              <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
                <div>
                  <h2 className="text-base font-semibold text-[#101828]">
                    Concurrentie op Funda
                  </h2>
                  <p className="text-xs text-[#667085]">
                    Aantal koopwoningen per makelaar in Hoogeveen (exact via Funda-filter)
                  </p>
                </div>
                <p className="text-xs text-[#98A2B3]">
                  Totaal markt: {data.totalCount} woningen
                </p>
              </div>
              <div className="space-y-3">
                {data.stats.competitors.map((c) => {
                  const max = data.stats.competitors[0]?.count ?? 1;
                  const widthPct = max > 0 ? Math.round((c.count / max) * 100) : 0;
                  return (
                    <div key={c.numId}>
                      <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                        <a
                          href={c.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`font-medium hover:underline ${
                            c.isOwnOffice ? "text-[#C4320A]" : "text-[#344054]"
                          }`}
                        >
                          {c.name}
                          {c.isOwnOffice && (
                            <span className="ml-2 text-[10px] font-bold uppercase text-[#C4320A]">
                              jij
                            </span>
                          )}
                        </a>
                        <span className="shrink-0 font-semibold text-[#101828]">
                          {c.count}{" "}
                          <span className="font-normal text-[#667085]">
                            ({c.sharePct}%)
                          </span>
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-[#F2F4F7]">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${widthPct}%`,
                            backgroundColor: c.isOwnOffice ? primary : "#98A2B3",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <DemoSearchBar
            value={search}
            onChange={setSearch}
            placeholder="Zoek adres, makelaar of prijs…"
          />

          <div className="mb-6 flex flex-wrap gap-2">
            <FilterChip
              label="Alle"
              active={filter === "all"}
              onClick={() => setFilter("all")}
              primaryColor={primary}
            />
            <FilterChip
              label="Schenkel"
              active={filter === "schenkel"}
              onClick={() => setFilter("schenkel")}
              primaryColor={primary}
            />
            <FilterChip
              label="Concurrentie"
              active={filter === "other"}
              onClick={() => setFilter("other")}
              primaryColor={primary}
            />
          </div>

          {loading && !filtered.length ? (
            <div className="rounded-xl border border-dashed border-[#D0D5DD] bg-white p-12 text-center text-sm text-[#667085]">
              Funda wordt gescraped… (±30–60 sec incl. concurrentie)
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((l) => (
                <a
                  key={l.id}
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`rounded-xl border bg-white p-4 shadow-xs transition-shadow hover:shadow-md ${
                    l.isOwnOffice
                      ? "border-[#FDBA74] ring-1 ring-[#E85B2B]/25"
                      : "border-[#EAECF0]"
                  }`}
                >
                  <div className="mb-3 aspect-[4/3] overflow-hidden rounded-lg bg-[#F2F4F7]">
                    {l.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={l.imageUrl}
                        alt={l.address}
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  {l.isOwnOffice && (
                    <span className="mb-2 inline-block rounded-full bg-[#FFF4ED] px-2 py-0.5 text-[10px] font-bold text-[#C4320A]">
                      Schenkel Makelaardij
                    </span>
                  )}
                  <p className="font-semibold text-[#101828]">{l.address}</p>
                  <p className="text-xs text-[#667085]">
                    {l.postcode} {l.city}
                  </p>
                  <p className="mt-2 text-lg font-bold" style={{ color: primary }}>
                    {l.price || "Prijs op aanvraag"}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-[#667085]">
                    {l.livingArea && <span>{l.livingArea}</span>}
                    {l.rooms && <span>{l.rooms} kamers</span>}
                    {l.energyLabel && <span>Label {l.energyLabel}</span>}
                  </div>
                  <p className="mt-2 truncate text-xs text-[#98A2B3]">{l.agent}</p>
                </a>
              ))}
            </div>
          )}

          <p className="mt-6 text-xs text-[#98A2B3]">
            Demo: publieke Funda-zoekresultaten voor Hoogeveen. Geen officiële Funda-koppeling —
            voor productie gebruik NVM/Tiara of een gelicenseerde datafeed.
          </p>
        </>
      )}
    </>
  );
}
