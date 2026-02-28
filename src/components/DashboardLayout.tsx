"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import DashboardSidebar from "./DashboardSidebar";

type Props = { children: React.ReactNode };

export default function DashboardLayout({ children }: Props) {
  const t = useTranslations("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#1e1b4b]">
      <DashboardSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="md:pl-56">
        <header className="sticky top-0 z-10 border-b border-white/10 bg-[#1e1b4b]/95 px-4 py-4 backdrop-blur-sm sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="rounded-lg p-2 text-white/90 hover:bg-white/10 hover:text-white md:hidden"
                aria-label="Menu openen"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              </button>
              <Link href="/" className="text-lg font-bold tracking-tight text-white md:hidden">
                Proceda
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-white/80">{t("user")}</span>
              <Link
                href="/login"
                className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-[#312e81] transition-colors hover:bg-white/95"
              >
                {t("logout")}
              </Link>
            </div>
          </div>
        </header>

        <main className="px-4 py-8 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
