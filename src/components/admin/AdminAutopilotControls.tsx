"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useAdminVertical } from "@/context/AdminVerticalContext";
import type { AutopilotPublicState, AutopilotTickSummary } from "@/lib/outreach/autopilot";

const STATUS_POLL_MS = 8_000;
const TICK_INTERVAL_MS = 4 * 60_000;

export function AdminAutopilotControls() {
  const t = useTranslations("adminAutopilot");
  const { vertical } = useAdminVertical();
  const [state, setState] = useState<AutopilotPublicState | null>(null);
  const [busy, setBusy] = useState<"start" | "stop" | "tick" | null>(null);
  const [tickNote, setTickNote] = useState<string | null>(null);
  const tickingRef = useRef(false);

  const loadStatus = useCallback(async () => {
    const res = await fetch(
      `/api/admin/outreach/autopilot?branch=${encodeURIComponent(vertical)}`,
      { cache: "no-store" },
    );
    if (res.ok) {
      setState((await res.json()) as AutopilotPublicState);
    }
  }, [vertical]);

  const runTick = useCallback(async () => {
    if (tickingRef.current) return;
    tickingRef.current = true;
    setBusy("tick");
    try {
      const res = await fetch(
        `/api/admin/outreach/autopilot/tick?branch=${encodeURIComponent(vertical)}`,
        { method: "POST" },
      );
      const json = (await res.json()) as {
        ticks?: { summary?: AutopilotTickSummary; error?: string }[];
        error?: string;
      };
      if (!res.ok) {
        setTickNote(json.error ?? t("tickFailed"));
        return;
      }
      const tick = json.ticks?.[0];
      if (tick?.error) {
        setTickNote(tick.error);
      } else if (tick?.summary) {
        const s = tick.summary;
        const sent = (s.steps.batchSend as { sent?: number })?.sent ?? 0;
        const scraped = (s.steps.scrape as { batchAdded?: number })?.batchAdded ?? 0;
        setTickNote(
          t("tickDone", {
            drafts: s.draftCount,
            sent,
            scraped,
          }),
        );
      }
      await loadStatus();
    } catch {
      setTickNote(t("tickFailed"));
    } finally {
      tickingRef.current = false;
      setBusy(null);
    }
  }, [vertical, loadStatus, t]);

  const toggle = useCallback(
    async (action: "start" | "stop") => {
      setBusy(action);
      setTickNote(null);
      try {
        const res = await fetch(
          `/api/admin/outreach/autopilot?branch=${encodeURIComponent(vertical)}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action }),
          },
        );
        if (!res.ok) {
          const json = (await res.json()) as { error?: string };
          setTickNote(json.error ?? t("actionFailed"));
          return;
        }
        const next = (await res.json()) as AutopilotPublicState;
        setState(next);
        if (action === "start") {
          void runTick();
        }
      } catch {
        setTickNote(t("actionFailed"));
      } finally {
        setBusy(null);
      }
    },
    [vertical, runTick, t],
  );

  useEffect(() => {
    void loadStatus();
    const id = setInterval(() => void loadStatus(), STATUS_POLL_MS);
    return () => clearInterval(id);
  }, [loadStatus]);

  useEffect(() => {
    if (!state?.active) return;
    const id = setInterval(() => void runTick(), TICK_INTERVAL_MS);
    return () => clearInterval(id);
  }, [state?.active, runTick]);

  const active = state?.active ?? false;
  const disabled = busy !== null || !state?.mailConfigured;

  return (
    <div className="flex min-w-0 flex-col items-end gap-0.5">
      <div className="flex items-center gap-1.5 sm:gap-2">
        {active ? (
          <span
            className="hidden items-center gap-1 rounded-full bg-[#ECFDF3] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#027A48] sm:inline-flex"
            title={tickNote ?? undefined}
          >
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
            onClick={() => void toggle("stop")}
            className="touch-target-auto flex h-9 shrink-0 items-center justify-center rounded-lg border border-[#FDA29B] bg-[#FEF3F2] px-2.5 text-xs font-semibold text-[#B42318] transition hover:bg-[#FEE4E2] disabled:opacity-50 sm:h-10 sm:px-3 sm:text-sm"
          >
            {busy === "stop" ? t("stopping") : t("stop")}
          </button>
        ) : (
          <button
            type="button"
            disabled={disabled}
            onClick={() => void toggle("start")}
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
      {tickNote && active ? (
        <p className="max-w-[14rem] truncate text-[10px] text-[#667085]" title={tickNote}>
          {tickNote}
        </p>
      ) : null}
    </div>
  );
}
