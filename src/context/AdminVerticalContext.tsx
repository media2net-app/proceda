"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useSearchParams } from "next/navigation";
import { BRANCHES, type ScrapeBranchId } from "@/lib/bedrijven/branches";
import {
  OUTREACH_BRANCH_IDS,
  resolveAdminVerticalBranch,
  type OutreachBranchId,
} from "@/lib/bedrijven/outreach-branches";

const STORAGE_KEY = "proceda_admin_vertical";

type AdminVerticalContextValue = {
  vertical: OutreachBranchId;
  verticalLabel: string;
  setVertical: (id: OutreachBranchId) => void;
  outreachBranchIds: readonly OutreachBranchId[];
};

const AdminVerticalContext = createContext<AdminVerticalContextValue | null>(
  null,
);

export function AdminVerticalProvider({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const urlVertical = searchParams.get("vertical");

  const [vertical, setVerticalState] = useState<OutreachBranchId>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && OUTREACH_BRANCH_IDS.includes(stored as OutreachBranchId)) {
        return stored as OutreachBranchId;
      }
    }
    return resolveAdminVerticalBranch(urlVertical);
  });

  useEffect(() => {
    if (urlVertical) {
      setVerticalState(resolveAdminVerticalBranch(urlVertical));
    }
  }, [urlVertical]);

  const setVertical = useCallback((id: OutreachBranchId) => {
    setVerticalState(id);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, id);
    }
  }, []);

  const value = useMemo(
    (): AdminVerticalContextValue => ({
      vertical,
      verticalLabel: BRANCHES[vertical as ScrapeBranchId]?.name ?? vertical,
      setVertical,
      outreachBranchIds: OUTREACH_BRANCH_IDS,
    }),
    [vertical, setVertical],
  );

  return (
    <AdminVerticalContext.Provider value={value}>
      {children}
    </AdminVerticalContext.Provider>
  );
}

export function useAdminVertical(): AdminVerticalContextValue {
  const ctx = useContext(AdminVerticalContext);
  if (!ctx) {
    throw new Error("useAdminVertical must be used within AdminVerticalProvider");
  }
  return ctx;
}

/** Optioneel buiten provider (fallback makelaardij). */
export function useAdminVerticalOptional(): AdminVerticalContextValue | null {
  return useContext(AdminVerticalContext);
}
