"use client";

import { useTranslations } from "next-intl";
import { useAutopilot } from "@/context/AutopilotContext";

export function AdminAutopilotControls() {
  const t = useTranslations("adminAutopilot");
  const { state, active, busy, start, stop } = useAutopilot();

  const disabled = busy !== null || !state?.mailConfigured;

  return (
    <div className="flex min-w-0 flex-col items-end gap-0.5">
      <div className="flex items-center gap-1.5 sm:gap-2">
        {active ? (
          <span className="hidden items-center gap-1 rounded-full bg-[#ECFDF3] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#027A48] sm:inline-flex">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#12B76A]" />
            {t("running")}
          </span>
        ) : null}
        {!state?.mailConfigured ? (
          <span className="hidden text-[10px] text-[#B54708] lg:inline" title={t("mailMissingHint")}>
            {t("mailMissing")}
          </span>
        ) : null}
        {active ? (
          <button
            type="button"
            disabled={disabled}
            onClick={() => void stop()}
            className="touch-target-auto flex h-9 shrink-0 items-center justify-center rounded-lg border border-[#FDA29B] bg-[#FEF3F2] px-2.5 text-xs font-semibold text-[#B42318] transition hover:bg-[#FEE4E2] disabled:opacity-50 sm:h-10 sm:px-3 sm:text-sm"
          >
            {busy === "stop" ? t("stopping") : t("stop")}
          </button>
        ) : (
          <button
            type="button"
            disabled={disabled}
            onClick={() => void start()}
            className="touch-target-auto flex h-9 shrink-0 items-center justify-center rounded-lg border border-[#ABEFC6] bg-[#ECFDF3] px-2.5 text-xs font-semibold text-[#027A48] transition hover:bg-[#D1FADF] disabled:opacity-50 sm:h-10 sm:px-3 sm:text-sm"
          >
            {busy === "start" ? t("starting") : t("start")}
          </button>
        )}
      </div>
      {state && !active ? (
        <p className="hidden text-[10px] text-[#98A2B3] lg:block">
          {t("draftsHint", { count: state.draftCount })}
        </p>
      ) : null}
    </div>
  );
}
