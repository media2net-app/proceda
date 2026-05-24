"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useAutopilot } from "@/context/AutopilotContext";
import type { AutopilotLogLevel } from "@/lib/outreach/autopilot-log";

const LEVEL_STYLE: Record<AutopilotLogLevel, string> = {
  info: "text-[#94A3B8]",
  run: "text-[#60A5FA]",
  ok: "text-[#4ADE80]",
  warn: "text-[#FBBF24]",
  error: "text-[#F87171]",
  skip: "text-[#A78BFA]",
};

const LEVEL_PREFIX: Record<AutopilotLogLevel, string> = {
  info: "INFO",
  run: "RUN ",
  ok: " OK ",
  warn: "WARN",
  error: " ERR",
  skip: "SKIP",
};

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("nl-NL", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatTickAgo(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return null;
  const min = Math.floor(diff / 60_000);
  if (min < 60) return `${min} min geleden`;
  return `${Math.floor(min / 60)} u geleden`;
}

export function AdminAutopilotLogSidebar() {
  const t = useTranslations("adminAutopilot");
  const { active, logLines, state, busy, lastError } = useAutopilot();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [logLines.length, busy, state?.tickInProgress]);

  if (!active) return null;

  const tickStale = formatTickAgo(state?.lastTickAt);
  const showStale =
    tickStale &&
    !state?.tickInProgress &&
    busy !== "tick" &&
    (Date.now() - new Date(state?.lastTickAt ?? 0).getTime() > 180_000);

  return (
    <aside
      className="autopilot-log-sidebar fixed bottom-0 left-0 right-0 z-40 flex h-[min(40dvh,16rem)] flex-col border-t border-[#1F2937] bg-[#0B0F14] shadow-2xl lg:inset-y-0 lg:left-auto lg:right-0 lg:h-dvh lg:w-[22rem] lg:border-l lg:border-t-0"
      aria-label={t("logTitle")}
    >
      <header className="flex shrink-0 items-center justify-between border-b border-[#1F2937] px-3 py-2.5 lg:safe-top lg:py-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[#22C55E]" />
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[#E2E8F0]">
            {t("logTitle")}
          </span>
        </div>
        <span className="font-mono text-[10px] text-[#64748B]">
          {state?.branchId ?? "—"}
          {state?.mode === "scrape_only" ? " · scrape" : ""}
          {state?.tickInProgress || busy === "tick" ? " · tick…" : ""}
        </span>
      </header>

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 py-2 font-mono text-[11px] leading-relaxed"
      >
        {logLines.length === 0 ? (
          <p className="text-[#64748B]">{t("logWaiting")}</p>
        ) : (
          <ul className="space-y-1.5">
            {logLines.map((line, i) => (
              <li key={`${line.at}-${line.step}-${i}`} className="break-words">
                <span className="text-[#475569]">{formatTime(line.at)}</span>{" "}
                <span className={LEVEL_STYLE[line.level]}>[{LEVEL_PREFIX[line.level]}]</span>{" "}
                <span className="text-[#64748B]">{line.step}</span>{" "}
                <span className="text-[#E2E8F0]">{line.message}</span>
                {line.detail ? (
                  <span className="mt-0.5 block pl-4 text-[#94A3B8]">↳ {line.detail}</span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
        {(state?.tickInProgress || busy === "tick") && (
          <p className="mt-3 animate-pulse text-[#60A5FA]">▸ {t("logRunning")}</p>
        )}
        {showStale ? (
          <p className="mt-3 text-[#FBBF24]">
            ⚠ {t("logStaleTick", { ago: tickStale ?? "" })}
          </p>
        ) : null}
        {lastError ? (
          <p className="mt-2 text-[#F87171]">⚠ {lastError}</p>
        ) : null}
      </div>

      <footer className="shrink-0 border-t border-[#1F2937] px-3 py-2 font-mono text-[10px] text-[#64748B]">
        {t("logFooter", { ticks: state?.ticksTotal ?? 0, ready: state?.draftCount ?? 0 })}
      </footer>
    </aside>
  );
}
