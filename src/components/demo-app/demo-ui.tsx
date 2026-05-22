"use client";

import { useCallback, useId, useState } from "react";
import type { DemoAppBrand, ListingStatusStyle } from "@/lib/demo-app/types";

export function useDemoAction() {
  const [message, setMessage] = useState<string | null>(null);

  const run = useCallback((label: string) => {
    setMessage(label);
    const t = setTimeout(() => setMessage(null), 2800);
    return () => clearTimeout(t);
  }, []);

  const Toast = message ? (
    <div
      role="status"
      className="fixed bottom-6 right-6 z-[100] max-w-sm rounded-xl border border-[#ABEFC6] bg-[#ECFDF3] px-4 py-3 text-sm font-medium text-[#027A48] shadow-lg"
    >
      ✓ {message}
    </div>
  ) : null;

  return { run, Toast };
}

export const STATUS_CLASS: Record<ListingStatusStyle, string> = {
  new: "bg-[#FFF4ED] text-[#C4320A]",
  sale: "bg-[#ECFDF3] text-[#027A48]",
  bid: "bg-[#EFF8FF] text-[#175CD3]",
  sold: "bg-[#F2F4F7] text-[#475467]",
};

export function ListingStatusBadge({
  status,
  statusStyle,
}: {
  status: string;
  statusStyle: ListingStatusStyle;
}) {
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
        STATUS_CLASS[statusStyle] ?? STATUS_CLASS.sale
      }`}
    >
      {status}
    </span>
  );
}

export function AgentAvatar({
  initials,
  primaryColor,
  size = "md",
}: {
  initials: string;
  primaryColor: string;
  size?: "sm" | "md";
}) {
  const dim = size === "sm" ? "h-7 w-7 text-xs" : "h-8 w-8 text-xs";
  return (
    <div
      className={`flex ${dim} items-center justify-center rounded-full bg-[#F2F4F7] font-bold text-[#475467]`}
      style={{ border: `2px solid ${primaryColor}33` }}
      title={initials}
    >
      {initials}
    </div>
  );
}

export function DemoPageHeader({
  brand,
  title,
  subtitle,
  action,
}: {
  brand: DemoAppBrand;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold text-[#101828]">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-[#667085]">{subtitle}</p>}
      </div>
      {action ?? (
        <button
          type="button"
          className="rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-xs"
          style={{ backgroundColor: brand.primaryColor }}
        >
          + Nieuw
        </button>
      )}
    </div>
  );
}

export function DemoSearchBar({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="mb-6 rounded-xl border border-[#EAECF0] bg-white p-4 shadow-xs">
      <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-[#D0D5DD] bg-white px-3 py-2 shadow-xs">
        <svg
          className="h-4 w-4 shrink-0 text-[#98A2B3]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m21 21-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full min-w-0 bg-transparent text-sm text-[#101828] outline-none placeholder:text-[#98A2B3]"
        />
      </div>
    </div>
  );
}

export function FilterChip({
  label,
  active,
  onClick,
  primaryColor,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  primaryColor: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? "text-white shadow-xs"
          : "border-[#D0D5DD] bg-white text-[#344054] shadow-xs hover:bg-[#F9FAFB]"
      }`}
      style={active ? { backgroundColor: primaryColor, borderColor: primaryColor } : undefined}
    >
      {label}
    </button>
  );
}

function parseChartPoints(points: string): [number, number][] {
  return points
    .trim()
    .split(/\s+/)
    .map((pair) => {
      const [x, y] = pair.split(",").map(Number);
      return [x, y] as [number, number];
    })
    .filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y));
}

function smoothLinePath(coords: [number, number][]): string {
  if (coords.length === 0) return "";
  if (coords.length === 1) return `M ${coords[0][0]},${coords[0][1]}`;

  let d = `M ${coords[0][0]},${coords[0][1]}`;
  for (let i = 0; i < coords.length - 1; i++) {
    const p0 = coords[Math.max(0, i - 1)]!;
    const p1 = coords[i]!;
    const p2 = coords[i + 1]!;
    const p3 = coords[Math.min(coords.length - 1, i + 2)]!;
    const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2[0]},${p2[1]}`;
  }
  return d;
}

export type ChartTrend = "up" | "down" | "neutral";

export function DemoChart({
  points,
  stroke,
  trend = "up",
  variant = "sparkline",
}: {
  points: string;
  stroke: string;
  trend?: ChartTrend;
  variant?: "sparkline" | "area";
}) {
  const uid = useId().replace(/:/g, "");
  const coords = parseChartPoints(points);
  const linePath = smoothLinePath(coords);
  const last = coords[coords.length - 1];
  const baseline = variant === "sparkline" ? 92 : 88;
  const areaPath = last
    ? `${linePath} L ${last[0]},${baseline} L ${coords[0]?.[0] ?? 0},${baseline} Z`
    : "";

  const trendStroke =
    trend === "down" ? "#F04438" : trend === "neutral" ? "#98A2B3" : stroke;

  const gridLines =
    variant === "area"
      ? [25, 50, 75].map((y) => (
          <line
            key={y}
            x1="0"
            y1={y}
            x2="100"
            y2={y}
            stroke="#EAECF0"
            strokeWidth="0.5"
            vectorEffect="non-scaling-stroke"
          />
        ))
      : null;

  return (
    <svg
      viewBox="0 0 100 100"
      className="h-full w-full overflow-visible"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id={`fill-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={trendStroke} stopOpacity="0.28" />
          <stop offset="100%" stopColor={trendStroke} stopOpacity="0.02" />
        </linearGradient>
        <linearGradient id={`stroke-${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={trendStroke} stopOpacity="0.5" />
          <stop offset="100%" stopColor={trendStroke} stopOpacity="1" />
        </linearGradient>
      </defs>
      {gridLines}
      {areaPath && (
        <path d={areaPath} fill={`url(#fill-${uid})`} stroke="none" />
      )}
      <path
        d={linePath}
        fill="none"
        stroke={`url(#stroke-${uid})`}
        strokeWidth={variant === "sparkline" ? 2.5 : 2.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      {last && (
        <>
          <circle
            cx={last[0]}
            cy={last[1]}
            r={variant === "sparkline" ? 4 : 5}
            fill={trendStroke}
            vectorEffect="non-scaling-stroke"
          />
          <circle
            cx={last[0]}
            cy={last[1]}
            r={variant === "sparkline" ? 2 : 2.5}
            fill="#fff"
            vectorEffect="non-scaling-stroke"
          />
        </>
      )}
    </svg>
  );
}

/** @deprecated Use DemoChart */
export function MiniChart({
  points,
  stroke,
}: {
  points: string;
  stroke: string;
}) {
  return <DemoChart points={points} stroke={stroke} variant="area" />;
}
