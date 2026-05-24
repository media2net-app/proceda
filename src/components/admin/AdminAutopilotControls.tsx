"use client";

import { useTranslations } from "next-intl";
import { useAutopilot } from "@/context/AutopilotContext";

export function AdminAutopilotControls() {
  const t = useTranslations("adminAutopilot");
  const { state, active, busy, lastError, start, stop } = useAutopilot();

  const mode = state?.mode ?? "full";
  const mailBlocksFull =
    state != null && !state.mailConfigured && mode === "full";
  const disabled = busy !== null || mailBlocksFull;

  const modeLabel = mode === "scrape_only" ? t("modeScrape") : t("modeFull");

  return (
    <div className="flex min-w-0 flex-col items-end gap-0.5">
      <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2">
        {active ? (
          <>
            <span
              className={`hidden items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide sm:inline-flex ${
                mode === "scrape_only"
                  ? "bg-[#EFF8FF] text-[#175CD3]"
                  : "bg-[#ECFDF3] text-[#027A48]"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 animate-pulse rounded-full ${
                  mode === "scrape_only" ? "bg-[#2E90FA]" : "bg-[#12B76A]"
                }`}
              />
              {modeLabel}
            </span>
            {mode !== "scrape_only" ? (
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => void start("scrape_only")}
                className="touch-target-auto flex h-9 shrink-0 items-center justify-center rounded-lg border border-[#84CAFF] bg-[#EFF8FF] px-2.5 text-xs font-semibold text-[#175CD3] transition hover:bg-[#D1E9FF] disabled:opacity-50 sm:h-10 sm:px-3 sm:text-sm"
                title={t("startScrapeHint")}
              >
                {busy === "start" ? t("starting") : t("startScrape")}
              </button>
            ) : null}
            <button
              type="button"
              disabled={disabled}
              onClick={() => void stop()}
              className="touch-target-auto flex h-9 shrink-0 items-center justify-center rounded-lg border border-[#FDA29B] bg-[#FEF3F2] px-2.5 text-xs font-semibold text-[#B42318] transition hover:bg-[#FEE4E2] disabled:opacity-50 sm:h-10 sm:px-3 sm:text-sm"
            >
              {busy === "stop" ? t("stopping") : t("stop")}
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => void start("scrape_only")}
              className="touch-target-auto flex h-9 shrink-0 items-center justify-center rounded-lg border border-[#84CAFF] bg-[#EFF8FF] px-2.5 text-xs font-semibold text-[#175CD3] transition hover:bg-[#D1E9FF] disabled:opacity-50 sm:h-10 sm:px-3 sm:text-sm"
              title={t("startScrapeHint")}
            >
              {busy === "start" ? t("starting") : t("startScrape")}
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => void start("full")}
              className="touch-target-auto flex h-9 shrink-0 items-center justify-center rounded-lg border border-[#ABEFC6] bg-[#ECFDF3] px-2.5 text-xs font-semibold text-[#027A48] transition hover:bg-[#D1FADF] disabled:opacity-50 sm:h-10 sm:px-3 sm:text-sm"
              title={t("startFullHint")}
            >
              {t("startFull")}
            </button>
          </>
        )}
      </div>
      {!active && !state?.mailConfigured ? (
        <p className="hidden text-[10px] text-[#98A2B3] lg:block" title={t("mailMissingHint")}>
          {t("mailOptionalScrape")}
        </p>
      ) : null}
      {lastError ? (
        <p className="max-w-[14rem] truncate text-[10px] text-[#B42318] lg:max-w-xs" title={lastError}>
          {t("actionFailed")}
        </p>
      ) : state && !active ? (
        <p className="hidden text-[10px] text-[#98A2B3] lg:block">
          {t("draftsHint", { count: state.draftCount })}
        </p>
      ) : null}
    </div>
  );
}
