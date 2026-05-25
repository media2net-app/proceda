"use client";

import { createContext, useContext } from "react";
import type { DemoAppBrand, RecruitmentPortalData } from "@/lib/demo-app/types";

type RecruitmentPortalContextValue = {
  brand: DemoAppBrand;
  slug: string;
  data: RecruitmentPortalData;
};

const RecruitmentPortalContext = createContext<RecruitmentPortalContextValue | null>(
  null,
);

export function RecruitmentPortalProvider({
  brand,
  slug,
  data,
  children,
}: RecruitmentPortalContextValue & { children: React.ReactNode }) {
  return (
    <RecruitmentPortalContext.Provider value={{ brand, slug, data }}>
      {children}
    </RecruitmentPortalContext.Provider>
  );
}

export function useRecruitmentPortal() {
  const ctx = useContext(RecruitmentPortalContext);
  if (!ctx) {
    throw new Error(
      "useRecruitmentPortal must be used within RecruitmentPortalProvider",
    );
  }
  return ctx;
}
