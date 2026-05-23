"use client";

import { Suspense, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  DashboardHeaderLiveStats,
  DashboardHeaderLiveStatsMobile,
} from "@/components/admin/DashboardHeaderLiveStats";
import DashboardSidebar from "./DashboardSidebar";
import { AdminVerticalProvider } from "@/context/AdminVerticalContext";
import { MailSyncProvider } from "@/context/MailSyncContext";
import { TodayAnalyticsProvider } from "@/context/TodayAnalyticsContext";
import { AdminThemeProvider, useAdminTheme } from "@/context/AdminThemeContext";
import { AdminThemeToggle } from "@/components/admin/AdminThemeToggle";
import { AdminAutopilotControls } from "@/components/admin/AdminAutopilotControls";

type Props = { children: React.ReactNode };

function DashboardShell({ children }: Props) {
  const t = useTranslations("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isDark } = useAdminTheme();

  useEffect(() => {
    if (!sidebarOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [sidebarOpen]);

  return (
    <div
      className={`admin-shell min-h-screen min-h-[100dvh] overflow-x-hidden bg-[#F9FAFB] text-[#101828] ${isDark ? "dark-mode" : ""}`}
    >
      <DashboardSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="md:pl-64">
        <header className="admin-header safe-top sticky top-0 z-10 border-b border-[#EAECF0] bg-white/95 px-4 py-3 backdrop-blur-sm sm:px-6">
          <div className="flex min-w-0 items-center justify-between gap-2 sm:gap-4">
            <div className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="touch-target-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[#667085] hover:bg-[#F2F4F7] hover:text-[#101828] md:hidden"
                aria-label={t("openMenu")}
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              </button>
              <Link href="/" className="text-lg font-bold tracking-tight text-[#101828] md:hidden">
                Proceda
              </Link>
            </div>

            <DashboardHeaderLiveStats />

            <div className="flex shrink-0 items-center gap-2 sm:gap-4">
              <AdminAutopilotControls />
              <AdminThemeToggle />
              <span className="hidden max-w-[40vw] truncate text-sm text-[#667085] md:inline">
                {t("user")}
              </span>
              <button
                type="button"
                onClick={async () => {
                  await fetch("/api/auth/logout", { method: "POST" });
                  window.location.href = "/login";
                }}
                className="touch-target-auto flex h-11 shrink-0 items-center justify-center rounded-lg bg-[#7F56D9] px-3 text-sm font-semibold text-white transition-colors hover:bg-[#6941C6] sm:px-4"
              >
                <span className="sm:hidden">{t("logoutShort")}</span>
                <span className="hidden sm:inline">{t("logout")}</span>
              </button>
            </div>
          </div>
        </header>

        <DashboardHeaderLiveStatsMobile />

        <main className="safe-bottom min-w-0 max-w-[100vw] px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: Props) {
  return (
    <MailSyncProvider>
      <Suspense fallback={null}>
        <AdminVerticalProvider>
          <AdminThemeProvider>
            <TodayAnalyticsProvider>
              <DashboardShell>{children}</DashboardShell>
            </TodayAnalyticsProvider>
          </AdminThemeProvider>
        </AdminVerticalProvider>
      </Suspense>
    </MailSyncProvider>
  );
}
