"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { ScrapeBranchId } from "@/lib/bedrijven/branches";
import type { BatchScrapeLogStatus } from "@/lib/bedrijven/batch-scrape-log";

type LiveScrapeLogPanelProps = {
  branchId: ScrapeBranchId;
};

function formatLogLine(line: string, locale: string): string {
  return line.replace(/^\[([^\]]+)\]\s*/, (_, ts) => {
    try {
      const d = new Date(ts);
      const local = d.toLocaleTimeString(locale, {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      return `[${local}] `;
    } catch {
      return `[${ts}] `;
    }
  });
}

export function LiveScrapeLogPanel({ branchId }: LiveScrapeLogPanelProps) {
  const t = useTranslations("adminRapportage");
  const locale = useLocale();
  const [status, setStatus] = useState<BatchScrapeLogStatus | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/bedrijven/scrape/log?branch=${encodeURIComponent(branchId)}`,
      );
      if (res.ok) setStatus((await res.json()) as BatchScrapeLogStatus);
    } catch {
      // ignore
    }
  }, [branchId]);

  useEffect(() => {
    load();
    const id = setInterval(load, 3000);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [status?.logLines.length]);

  if (!status) return null;

  const { summary, logLines, running } = status;
  const hasLog = logLines.length > 0;

  if (!hasLog && !running) return null;

  const phaseLabel =
    summary.phase === "enriching"
      ? t("scrapeLogPhaseEnriching")
      : summary.phase === "discovering"
        ? t("scrapeLogPhaseDiscovering")
        : summary.phase === "done"
          ? t("scrapeLogPhaseDone")
          : null;

  return (
    <div
      className="mb-6 rounded-xl border border-[#D6BBFB] bg-gradient-to-br from-[#F9F5FF] to-white p-4 shadow-xs"
      role="status"
      aria-live="polite"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-[#6941C6]">{t("scrapeLogTitle")}</p>
          {running && (
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#7F56D9] opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#7F56D9]" />
            </span>
          )}
        </div>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            running
              ? "bg-[#ECFDF3] text-[#027A48]"
              : "bg-[#F2F4F7] text-[#475467]"
          }`}
        >
          {running ? t("scrapeLogRunning") : t("scrapeLogIdle")}
        </span>
      </div>

      <div className="mb-3 flex flex-wrap gap-3 text-xs text-[#475467]">
        <span>
          {t("scrapeLogRegions", {
            done: String(summary.regionsDone),
            total: String(summary.regionsTotal),
          })}
        </span>
        <span>·</span>
        <span>
          {t("scrapeLogTotal", { count: String(summary.totalBusinesses) })}
        </span>
        <span>·</span>
        <span>
          {t("scrapeLogEmail", { count: String(summary.withEmail) })}
        </span>
        {summary.currentRegionName && (
          <>
            <span>·</span>
            <span className="font-medium text-[#6941C6]">
              {t("scrapeLogCurrent", { region: summary.currentRegionName })}
              {phaseLabel && ` (${phaseLabel})`}
              {summary.percent != null && ` — ${summary.percent}%`}
              {summary.pending != null && summary.pending > 0 && (
                <span className="text-[#667085]">
                  {" "}
                  · {t("scrapeLogPending", { count: String(summary.pending) })}
                </span>
              )}
            </span>
          </>
        )}
      </div>

      {summary.percent != null && running && (
        <div className="mb-3 h-2 overflow-hidden rounded-full bg-[#E9D7FE]">
          <div
            className="h-full rounded-full bg-[#7F56D9] transition-all duration-500"
            style={{ width: `${Math.min(100, summary.percent)}%` }}
          />
        </div>
      )}

      {hasLog ? (
        <div className="max-h-48 overflow-y-auto rounded-lg border border-[#EAECF0] bg-white px-3 py-2 font-mono text-xs leading-relaxed text-[#344054]">
          {logLines.map((line, i) => (
            <div
              key={`${i}-${line.slice(0, 30)}`}
              className={`py-0.5 ${
                i === logLines.length - 1 && running ? "text-[#6941C6] font-medium" : ""
              }`}
            >
              {formatLogLine(line, locale)}
            </div>
          ))}
          <div ref={logEndRef} />
        </div>
      ) : (
        <p className="text-xs text-[#667085]">{t("scrapeLogEmpty")}</p>
      )}
    </div>
  );
}
