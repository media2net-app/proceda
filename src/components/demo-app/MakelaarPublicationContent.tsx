"use client";

import { useMemo, useState } from "react";
import { Link } from "@/i18n/navigation";
import { demoAppHref } from "@/lib/demo-app/nav";
import type { PublicationStatus } from "@/lib/demo-app/types";
import { useMakelaarPortal } from "./MakelaarPortalContext";
import {
  DemoPageHeader,
  DemoSearchBar,
  FilterChip,
  ListingStatusBadge,
  useDemoAction,
} from "./demo-ui";

const PUB_STYLE: Record<PublicationStatus, string> = {
  live: "bg-[#ECFDF3] text-[#027A48]",
  pending: "bg-[#FFF4ED] text-[#C4320A]",
  error: "bg-[#FEF3F2] text-[#B42318]",
  offline: "bg-[#F2F4F7] text-[#475467]",
};

const PUB_LABEL: Record<PublicationStatus, string> = {
  live: "Live",
  pending: "In wachtrij",
  error: "Fout",
  offline: "Offline",
};

export default function MakelaarPublicationContent() {
  const { brand, slug, data } = useMakelaarPortal();
  const primary = brand.primaryColor;
  const { run, Toast } = useDemoAction();
  const [search, setSearch] = useState("");
  const [syncing, setSyncing] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return data.listings.filter(
      (l) =>
        !search ||
        l.address.toLowerCase().includes(q) ||
        l.city.toLowerCase().includes(q),
    );
  }, [data.listings, search]);

  const liveCount = data.listings.filter((l) => l.publicationStatus === "live").length;

  return (
    <>
      {Toast}
      <DemoPageHeader
        brand={brand}
        title="Publicatie"
        subtitle={`Funda & website-sync · ${liveCount} objecten live`}
        action={
          <button
            type="button"
            disabled={syncing}
            onClick={() => {
              setSyncing(true);
              setTimeout(() => {
                setSyncing(false);
                run("Funda + website sync voltooid");
              }, 1500);
            }}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-xs disabled:opacity-60"
            style={{ backgroundColor: primary }}
          >
            {syncing ? "Synchroniseren…" : "↻ Alles synchroniseren"}
          </button>
        }
      />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#ABEFC6] bg-[#ECFDF3] px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-[#027A48]">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[#12B76A]" />
          Tiara-koppeling actief · laatste bulk-sync vandaag 06:00
        </div>
        <Link
          href={demoAppHref(slug, "funda-markt")}
          className="text-sm font-semibold text-[#027A48] hover:underline"
        >
          Funda marktscan →
        </Link>
      </div>

      <DemoSearchBar
        value={search}
        onChange={setSearch}
        placeholder="Zoek object…"
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <FilterChip label="Alle" active onClick={() => {}} primaryColor={primary} />
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#EAECF0] bg-white shadow-xs">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-[#EAECF0] bg-[#F9FAFB] text-xs text-[#667085]">
            <tr>
              <th className="px-4 py-3 font-medium">Woning</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Funda</th>
              <th className="px-4 py-3 font-medium">Website</th>
              <th className="px-4 py-3 font-medium">Sync</th>
              <th className="px-4 py-3 font-medium">Publicatie</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => {
              const pub = row.publicationStatus ?? "live";
              return (
                <tr
                  key={row.id}
                  className="border-b border-[#EAECF0] last:border-b-0 hover:bg-[#F9FAFB]"
                >
                  <td className="px-4 py-3 font-medium text-[#101828]">{row.address}</td>
                  <td className="px-4 py-3">
                    <ListingStatusBadge status={row.status} statusStyle={row.statusStyle} />
                  </td>
                  <td className="px-4 py-3">
                    {row.fundaPublished ? (
                      <span className="text-[#027A48]">✓ Live</span>
                    ) : (
                      <span className="text-[#667085]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {row.websitePublished ? (
                      <span className="text-[#027A48]">✓ Live</span>
                    ) : (
                      <span className="text-[#C4320A]">Niet gepubliceerd</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[#667085]">{row.lastSync ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        PUB_STYLE[pub]
                      }`}
                    >
                      {PUB_LABEL[pub]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => run(`Sync ${row.address}`)}
                      className="text-sm font-semibold hover:underline"
                      style={{ color: primary }}
                    >
                      Sync
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
