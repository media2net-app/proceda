"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { AnalyticsLiveSnapshot } from "@/lib/analytics-live-types";

const POLL_MS = 30_000;

type TodayAnalyticsContextValue = {
  data: AnalyticsLiveSnapshot | null;
  refresh: () => void;
};

const TodayAnalyticsContext = createContext<TodayAnalyticsContextValue | null>(
  null,
);

export function TodayAnalyticsProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AnalyticsLiveSnapshot | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/analytics/live?period=all", {
        cache: "no-store",
      });
      if (!res.ok) return;
      setData((await res.json()) as AnalyticsLiveSnapshot);
    } catch {
      // header blijft stil bij fout
    }
  }, []);

  useEffect(() => {
    void refresh();
    const id = window.setInterval(() => void refresh(), POLL_MS);
    return () => window.clearInterval(id);
  }, [refresh]);

  return (
    <TodayAnalyticsContext.Provider value={{ data, refresh }}>
      {children}
    </TodayAnalyticsContext.Provider>
  );
}

export function useTodayAnalytics(): TodayAnalyticsContextValue {
  const ctx = useContext(TodayAnalyticsContext);
  if (!ctx) {
    throw new Error("useTodayAnalytics requires TodayAnalyticsProvider");
  }
  return ctx;
}
