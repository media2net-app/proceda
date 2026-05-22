"use client";

import { useEffect, useRef } from "react";
import type { Bedrijf } from "@/lib/bedrijven/types";
import "leaflet/dist/leaflet.css";

const CATEGORY_COLORS: Record<string, string> = {
  horeca: "#7F56D9",
  retail: "#6941C6",
  services: "#6366f1",
  health: "#12B76A",
  auto: "#F79009",
  education: "#9E77ED",
  office: "#475467",
  other: "#98A2B3",
};

type BusinessesMapProps = {
  businesses: Bedrijf[];
  center: [number, number];
  categoryLabel: (cat: Bedrijf["category"]) => string;
  noValue: string;
  mapHint: string;
};

export function BusinessesMap({
  businesses,
  center,
  categoryLabel,
  noValue,
  mapHint,
}: BusinessesMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const layerRef = useRef<import("leaflet").LayerGroup | null>(null);

  const mappable = businesses.filter(
    (b) => b.lat != null && b.lon != null && !Number.isNaN(b.lat) && !Number.isNaN(b.lon),
  );

  useEffect(() => {
    if (!containerRef.current) return;

    let cancelled = false;

    void import("leaflet").then((L) => {
      if (cancelled || !containerRef.current) return;

      delete (L.Icon.Default.prototype as L.Icon.Default & { _getIconUrl?: unknown })
        ._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      if (!mapRef.current) {
        mapRef.current = L.map(containerRef.current, {
          scrollWheelZoom: true,
        }).setView(center, 10);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(mapRef.current);

        layerRef.current = L.layerGroup().addTo(mapRef.current);
      }

      layerRef.current?.clearLayers();

      const bounds: [number, number][] = [];

      for (const b of mappable) {
        const lat = b.lat!;
        const lon = b.lon!;
        bounds.push([lat, lon]);

        const color = CATEGORY_COLORS[b.category] ?? CATEGORY_COLORS.other;
        const marker = L.circleMarker([lat, lon], {
          radius: 8,
          fillColor: color,
          color: "#fff",
          weight: 2,
          opacity: 1,
          fillOpacity: 0.9,
        });

        const website = b.website
          ? `<a href="${b.website}" target="_blank" rel="noopener noreferrer" style="color:#7F56D9">${b.website.replace(/^https?:\/\/(www\.)?/, "").slice(0, 40)}</a>`
          : noValue;

        marker.bindPopup(`
          <div style="min-width:180px;font-family:system-ui,sans-serif;font-size:13px;line-height:1.4">
            <strong style="color:#101828">${b.name}</strong><br/>
            <span style="color:#667085;font-size:11px">${categoryLabel(b.category)} · ${b.city}</span><br/><br/>
            <span>${b.address}</span><br/>
            ${b.phone ? `<span>📞 ${b.phone.split(";")[0]}</span><br/>` : ""}
            <span>🌐 ${website}</span>
          </div>
        `);

        marker.addTo(layerRef.current!);
      }

      if (bounds.length > 0) {
        mapRef.current!.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
      } else {
        mapRef.current!.setView(center, 10);
      }

      setTimeout(() => mapRef.current?.invalidateSize(), 100);
    });

    return () => {
      cancelled = true;
    };
  }, [mappable, categoryLabel, noValue, center]);

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        layerRef.current = null;
      }
    };
  }, []);

  const hint = mapHint
    .replace("{count}", String(mappable.length))
    .replace("{total}", String(businesses.length));

  return (
    <div className="overflow-hidden rounded-xl border border-[#EAECF0] bg-white shadow-xs">
      <p className="border-b border-[#EAECF0] px-4 py-2 text-xs text-[#667085]">
        {hint}
      </p>
      <div ref={containerRef} className="z-0 h-[420px] w-full" />
    </div>
  );
}
