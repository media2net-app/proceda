"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { InboxMessage } from "@/lib/mail/types";

export type MailSyncState = {
  configured: boolean;
  connected: boolean;
  syncedAt: string | null;
  unread: number;
  inboxTotal: number;
  syncing: boolean;
  lastSyncError: string | null;
  from?: string;
  messages: InboxMessage[];
};

type MailSyncContextValue = MailSyncState & {
  syncNow: () => Promise<void>;
  refreshStatus: () => Promise<void>;
};

const MailSyncContext = createContext<MailSyncContextValue | null>(null);

const SYNC_INTERVAL_MS = 60_000;

export function MailSyncProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<MailSyncState>({
    configured: false,
    connected: false,
    syncedAt: null,
    unread: 0,
    inboxTotal: 0,
    syncing: false,
    lastSyncError: null,
    messages: [],
  });
  const syncingRef = useRef(false);

  const refreshStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/mail/status");
      if (!res.ok) return;
      const data = (await res.json()) as {
        configured: boolean;
        connected: boolean;
        syncedAt: string | null;
        unread: number;
        inboxTotal: number;
        lastSyncError: string | null;
        from?: string;
      };
      setState((prev) => ({
        ...prev,
        configured: data.configured,
        connected: data.connected,
        syncedAt: data.syncedAt,
        unread: data.unread,
        inboxTotal: data.inboxTotal,
        lastSyncError: data.lastSyncError,
        from: data.from,
      }));
    } catch {
      // ignore
    }
  }, []);

  const syncNow = useCallback(async () => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    setState((prev) => ({ ...prev, syncing: true }));
    try {
      const res = await fetch("/api/mail/sync", { method: "POST" });
      const data = (await res.json()) as {
        messages?: InboxMessage[];
        syncedAt?: string;
        unread?: number;
        error?: string;
      };
      if (!res.ok) {
        setState((prev) => ({
          ...prev,
          syncing: false,
          connected: false,
          lastSyncError: data.error ?? "Sync failed",
        }));
        return;
      }
      setState((prev) => {
        const unread =
          data.unread ??
          (data as { stats?: { unread: number } }).stats?.unread ??
          prev.unread;
        return {
          ...prev,
          syncing: false,
          connected: true,
          syncedAt: data.syncedAt ?? prev.syncedAt,
          unread,
          inboxTotal: data.messages?.length ?? prev.inboxTotal,
          messages: data.messages ?? prev.messages,
          lastSyncError: null,
        };
      });
    } catch (e) {
      setState((prev) => ({
        ...prev,
        syncing: false,
        lastSyncError: e instanceof Error ? e.message : "Sync failed",
      }));
    } finally {
      syncingRef.current = false;
    }
  }, []);

  useEffect(() => {
    refreshStatus().then(() => syncNow());

    const interval = setInterval(() => {
      syncNow();
    }, SYNC_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [refreshStatus, syncNow]);

  return (
    <MailSyncContext.Provider
      value={{
        ...state,
        syncNow,
        refreshStatus,
      }}
    >
      {children}
    </MailSyncContext.Provider>
  );
}

export function useMailSync(): MailSyncContextValue {
  const ctx = useContext(MailSyncContext);
  if (!ctx) {
    throw new Error("useMailSync must be used within MailSyncProvider");
  }
  return ctx;
}
