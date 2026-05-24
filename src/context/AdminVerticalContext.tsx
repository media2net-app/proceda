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
import { useTranslations } from "next-intl";
import { BRANCHES, type ScrapeBranchId } from "@/lib/bedrijven/branches";
import {
  ADMIN_VERTICAL_ALL,
  OUTREACH_BRANCH_IDS,
  parseAdminVerticalScope,
  type AdminVerticalScope,
  type OutreachBranchId,
} from "@/lib/bedrijven/outreach-branches";

const STORAGE_KEY = "proceda_admin_vertical";

type AdminVerticalContextValue = {
  vertical: AdminVerticalScope;
  verticalLabel: string;
  isAllBranches: boolean;
  /** Outreach-branch wanneer niet "all"; anders null. */
  outreachBranch: OutreachBranchId | null;
  setVertical: (id: AdminVerticalScope) => void;
  outreachBranchIds: readonly OutreachBranchId[];
};

const AdminVerticalContext = createContext<AdminVerticalContextValue | null>(
  null,
);

function readStoredVertical(): AdminVerticalScope {
  if (typeof window === "undefined") return ADMIN_VERTICAL_ALL;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === ADMIN_VERTICAL_ALL) return ADMIN_VERTICAL_ALL;
  if (stored && OUTREACH_BRANCH_IDS.includes(stored as OutreachBranchId)) {
    return stored as OutreachBranchId;
  }
  return ADMIN_VERTICAL_ALL;
}

export function AdminVerticalProvider({ children }: { children: ReactNode }) {
  const t = useTranslations("adminVertical");
  const searchParams = useSearchParams();
  const urlBranch =
    searchParams.get("branch") ?? searchParams.get("vertical");

  const [vertical, setVerticalState] = useState<AdminVerticalScope>(() => {
    if (urlBranch) return parseAdminVerticalScope(urlBranch);
    return readStoredVertical();
  });

  useEffect(() => {
    if (urlBranch) {
      setVerticalState(parseAdminVerticalScope(urlBranch));
    }
  }, [urlBranch]);

  const setVertical = useCallback((id: AdminVerticalScope) => {
    setVerticalState(id);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, id);
    }
  }, []);

  const value = useMemo((): AdminVerticalContextValue => {
    const isAllBranches = vertical === ADMIN_VERTICAL_ALL;
    const outreachBranch = isAllBranches
      ? null
      : (vertical as OutreachBranchId);
    const verticalLabel = isAllBranches
      ? t("allBranches")
      : (BRANCHES[vertical as ScrapeBranchId]?.name ?? vertical);

    return {
      vertical,
      verticalLabel,
      isAllBranches,
      outreachBranch,
      setVertical,
      outreachBranchIds: OUTREACH_BRANCH_IDS,
    };
  }, [vertical, setVertical, t]);

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

export function useAdminVerticalOptional(): AdminVerticalContextValue | null {
  return useContext(AdminVerticalContext);
}

export { ADMIN_VERTICAL_ALL };
