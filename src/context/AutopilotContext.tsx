"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAdminVertical } from "@/context/AdminVerticalContext";
import type {
  AutopilotLogLine,
  AutopilotPublicState,
  AutopilotTickSummary,
} from "@/lib/outreach/autopilot";

const STATUS_POLL_MS = 3_000;
const TICK_INTERVAL_MS = 4 * 60_000;

type AutopilotContextValue = {
  state: AutopilotPublicState | null;
  active: boolean;
  logLines: AutopilotLogLine[];
  busy: "start" | "stop" | "tick" | null;
  refresh: () => Promise<void>;
  start: () => Promise<void>;
  stop: () => Promise<void>;
};

const AutopilotContext = createContext<AutopilotContextValue | null>(null);

export function AutopilotProvider({ children }: { children: ReactNode }) {
  const { vertical } = useAdminVertical();
  const [state, setState] = useState<AutopilotPublicState | null>(null);
  const [busy, setBusy] = useState<"start" | "stop" | "tick" | null>(null);
  const tickingRef = useRef(false);

  const refresh = useCallback(async () => {
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
      await res.json();
      await refresh();
    } finally {
      tickingRef.current = false;
      setBusy(null);
    }
  }, [vertical, refresh]);

  const start = useCallback(async () => {
    setBusy("start");
    try {
      const res = await fetch(
        `/api/admin/outreach/autopilot?branch=${encodeURIComponent(vertical)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "start" }),
        },
      );
      if (res.ok) {
        setState((await res.json()) as AutopilotPublicState);
        void runTick();
      }
    } finally {
      setBusy(null);
    }
  }, [vertical, runTick]);

  const stop = useCallback(async () => {
    setBusy("stop");
    try {
      const res = await fetch(
        `/api/admin/outreach/autopilot?branch=${encodeURIComponent(vertical)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "stop" }),
        },
      );
      if (res.ok) {
        setState((await res.json()) as AutopilotPublicState);
      }
    } finally {
      setBusy(null);
    }
  }, [vertical]);

  useEffect(() => {
    void refresh();
    const ms =
      state?.tickInProgress || busy === "tick" ? 1_500 : STATUS_POLL_MS;
    const id = setInterval(() => void refresh(), ms);
    return () => clearInterval(id);
  }, [refresh, state?.tickInProgress, busy]);

  useEffect(() => {
    if (!state?.active) return;
    const id = setInterval(() => void runTick(), TICK_INTERVAL_MS);
    return () => clearInterval(id);
  }, [state?.active, runTick]);

  const value = useMemo(
    () => ({
      state,
      active: state?.active ?? false,
      logLines: state?.activityLog ?? [],
      busy,
      refresh,
      start,
      stop,
    }),
    [state, busy, refresh, start, stop],
  );

  return (
    <AutopilotContext.Provider value={value}>{children}</AutopilotContext.Provider>
  );
}

export function useAutopilot() {
  const ctx = useContext(AutopilotContext);
  if (!ctx) {
    throw new Error("useAutopilot must be used within AutopilotProvider");
  }
  return ctx;
}

export type { AutopilotTickSummary };
