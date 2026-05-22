"use client";

import { createContext, useContext } from "react";
import type { DemoAppBrand, MakelaarPortalData } from "@/lib/demo-app/types";

type PortalContextValue = {
  brand: DemoAppBrand;
  slug: string;
  data: MakelaarPortalData;
};

const MakelaarPortalContext = createContext<PortalContextValue | null>(null);

export function MakelaarPortalProvider({
  brand,
  slug,
  data,
  children,
}: PortalContextValue & { children: React.ReactNode }) {
  return (
    <MakelaarPortalContext.Provider value={{ brand, slug, data }}>
      {children}
    </MakelaarPortalContext.Provider>
  );
}

export function useMakelaarPortal() {
  const ctx = useContext(MakelaarPortalContext);
  if (!ctx) {
    throw new Error("useMakelaarPortal must be used within MakelaarPortalProvider");
  }
  return ctx;
}
