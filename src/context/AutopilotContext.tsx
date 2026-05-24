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
import {
  ADMIN_VERTICAL_ALL,
  useAdminVertical,
} from "@/context/AdminVerticalContext";
import type { OutreachBranchId } from "@/lib/bedrijven/outreach-branches";
import type {
  AutopilotLogLine,
  AutopilotMode,
  AutopilotPublicState,
  AutopilotTickSummary,
} from "@/lib/outreach/autopilot";

const STATUS_POLL_MS = 3_000;
const TICK_INTERVAL_FULL_MS = 4 * 60_000;
const TICK_INTERVAL_SCRAPE_MS = 45_000;

function staleTickThresholdMs(mode: AutopilotMode): number {
  if (mode === "scrape_only") return 75_000;
  return 300_000;
}

function isAutopilotTickStale(state: AutopilotPublicState | null): boolean {
  if (!state?.active || state.tickInProgress) return false;
  const threshold = staleTickThresholdMs(state.mode);
  if (!state.lastTickAt) return true;
  return Date.now() - new Date(state.lastTickAt).getTime() >= threshold;
}

type AutopilotContextValue = {
  state: AutopilotPublicState | null;
  active: boolean;
  logLines: AutopilotLogLine[];
  busy: "start" | "stop" | "tick" | null;
  lastError: string | null;
  refresh: () => Promise<void>;
  start: (mode?: AutopilotMode) => Promise<void>;
  stop: () => Promise<void>;
};

const AutopilotContext = createContext<AutopilotContextValue | null>(null);

export function AutopilotProvider({ children }: { children: ReactNode }) {
  const { vertical, setVertical, outreachBranch } = useAdminVertical();
  const autopilotBranch: OutreachBranchId = outreachBranch ?? "makelaardij";
  const [state, setState] = useState<AutopilotPublicState | null>(null);
  const [busy, setBusy] = useState<"start" | "stop" | "tick" | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [optimisticActive, setOptimisticActive] = useState(false);
  const tickingRef = useRef(false);
  const switchingRef = useRef(false);
  const verticalPickPendingRef = useRef(false);
  const prevVerticalRef = useRef(autopilotBranch);
  const runTickRef = useRef<() => Promise<void>>(async () => {});
  const stateRef = useRef<AutopilotPublicState | null>(null);
  stateRef.current = state;

  const alignAutopilotToVertical = useCallback(
    async (target: OutreachBranchId, mode?: AutopilotMode) => {
      if (switchingRef.current) return;
      switchingRef.current = true;
      setBusy("start");
      setLastError(null);
      try {
        const res = await fetch(
          `/api/admin/outreach/autopilot?branch=${encodeURIComponent(target)}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "switch",
              ...(mode ? { mode } : {}),
            }),
          },
        );
        const body = (await res.json()) as AutopilotPublicState & {
          error?: string;
        };
        if (res.ok) {
          setState(body);
          setOptimisticActive(false);
          verticalPickPendingRef.current = false;
          void runTickRef.current();
        } else {
          setLastError(body.error ?? `HTTP ${res.status}`);
        }
      } catch (e) {
        setLastError(e instanceof Error ? e.message : "Wisselen mislukt");
      } finally {
        switchingRef.current = false;
        setBusy(null);
      }
    },
    [],
  );

  const refresh = useCallback(async () => {
    const activeRes = await fetch("/api/admin/outreach/autopilot", {
      cache: "no-store",
    });
    if (activeRes.ok) {
      const activeBody = (await activeRes.json()) as AutopilotPublicState & {
        active?: boolean;
      };
      if (activeBody.active && activeBody.branchId) {
        if (
          activeBody.branchId !== vertical &&
          !switchingRef.current &&
          busy !== "start" &&
          !verticalPickPendingRef.current
        ) {
          setVertical(activeBody.branchId as OutreachBranchId);
        }
        setState(activeBody);
        setOptimisticActive(false);
        setLastError(null);
        if (isAutopilotTickStale(activeBody) && !tickingRef.current) {
          void runTickRef.current();
        }
        return;
      }
    }

    const res = await fetch(
      `/api/admin/outreach/autopilot?branch=${encodeURIComponent(autopilotBranch)}`,
      { cache: "no-store" },
    );
    if (res.ok) {
      const next = (await res.json()) as AutopilotPublicState;
      setState(next);
      setOptimisticActive(false);
      setLastError(null);
      if (isAutopilotTickStale(next) && !tickingRef.current) {
        void runTickRef.current();
      }
    }
  }, [autopilotBranch, setVertical, busy]);

  const runTick = useCallback(async () => {
    if (tickingRef.current) return;
    tickingRef.current = true;
    setBusy("tick");
    try {
      const res = await fetch("/api/admin/outreach/autopilot/tick", {
        method: "POST",
      });
      const body = (await res.json()) as {
        ok?: boolean;
        error?: string;
        ticks?: { branchId: string; error?: string }[];
      };
      if (!res.ok) {
        setLastError(body.error ?? `Tick HTTP ${res.status}`);
      } else if (body.ticks?.some((t) => t.error)) {
        const err = body.ticks!.find((t) => t.error)?.error;
        setLastError(err ?? "Tick mislukt");
      } else {
        setLastError(null);
      }
      await refresh();
    } catch (e) {
      setLastError(e instanceof Error ? e.message : "Tick mislukt");
      await refresh();
    } finally {
      tickingRef.current = false;
      setBusy(null);
    }
  }, [refresh]);

  useEffect(() => {
    runTickRef.current = runTick;
  }, [runTick]);

  const start = useCallback(async (mode: AutopilotMode = "full") => {
    setBusy("start");
    setOptimisticActive(true);
    setLastError(null);
    try {
      const res = await fetch(
        `/api/admin/outreach/autopilot?branch=${encodeURIComponent(autopilotBranch)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "start", mode }),
        },
      );
      const body = (await res.json()) as AutopilotPublicState & { error?: string };
      if (res.ok) {
        setState(body);
        setOptimisticActive(false);
        if (body.branchId && body.branchId !== autopilotBranch) {
          setVertical(body.branchId as OutreachBranchId);
        }
        void runTick();
        return;
      }
      setOptimisticActive(false);
      const message = body.error ?? `HTTP ${res.status}`;
      setLastError(message);
    } catch (e) {
      setOptimisticActive(false);
      setLastError(e instanceof Error ? e.message : "Start mislukt");
    } finally {
      setBusy(null);
    }
  }, [autopilotBranch, runTick, setVertical]);

  useEffect(() => {
    if (vertical === ADMIN_VERTICAL_ALL) return;
    if (autopilotBranch === prevVerticalRef.current) return;
    prevVerticalRef.current = autopilotBranch;
    verticalPickPendingRef.current = true;
    if (!state?.active) return;
    if (state.branchId === autopilotBranch) {
      verticalPickPendingRef.current = false;
      return;
    }
    if (switchingRef.current) return;
    void alignAutopilotToVertical(autopilotBranch, state.mode);
  }, [
    vertical,
    autopilotBranch,
    state?.active,
    state?.branchId,
    state?.mode,
    alignAutopilotToVertical,
  ]);

  const stop = useCallback(async () => {
    setBusy("stop");
    setOptimisticActive(false);
    try {
      const res = await fetch(
        `/api/admin/outreach/autopilot?branch=${encodeURIComponent(autopilotBranch)}`,
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
    const ms =
      state.mode === "scrape_only"
        ? TICK_INTERVAL_SCRAPE_MS
        : TICK_INTERVAL_FULL_MS;

    const id = setInterval(() => void runTick(), ms);
    const onVisible = () => {
      if (
        document.visibilityState === "visible" &&
        isAutopilotTickStale(stateRef.current)
      ) {
        void runTick();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [state?.active, state?.mode, runTick]);

  const active = (state?.active ?? false) || optimisticActive;
  const logLines = useMemo(() => {
    const lines = state?.activityLog ?? [];
    if (!lastError) return lines;
    const errorLine: AutopilotLogLine = {
      at: new Date().toISOString(),
      level: "error",
      step: "system",
      message: "Autopilot start mislukt",
      detail: lastError,
    };
    return [...lines, errorLine];
  }, [state?.activityLog, lastError]);

  const value = useMemo(
    () => ({
      state,
      active,
      logLines,
      busy,
      lastError,
      refresh,
      start,
      stop,
    }),
    [state, active, logLines, busy, lastError, refresh, start, stop],
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
