"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import DashboardSidebar from "./DashboardSidebar";
import { MailSyncProvider } from "@/context/MailSyncContext";

type Props = { children: React.ReactNode };

export default function DashboardLayout({ children }: Props) {
  const t = useTranslations("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <MailSyncProvider>
    <div className="min-h-screen bg-[#F9FAFB] text-[#101828]">
      <DashboardSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="md:pl-64">
        <header className="sticky top-0 z-10 border-b border-[#EAECF0] bg-white/95 px-4 py-4 backdrop-blur-sm sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="rounded-lg p-2 text-[#667085] hover:bg-[#F2F4F7] hover:text-[#101828] md:hidden"
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
            <div className="flex items-center gap-4">
              <span className="max-w-[40vw] truncate text-sm text-[#667085] sm:max-w-none">{t("user")}</span>
              <button
                type="button"
                onClick={async () => {
                  await fetch("/api/auth/logout", { method: "POST" });
                  window.location.href = "/login";
                }}
                className="rounded-lg bg-[#7F56D9] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#6941C6]"
              >
                {t("logout")}
              </button>
            </div>
          </div>
        </header>

        <main className="px-4 py-8 sm:px-6">{children}</main>
      </div>
    </div>
    </MailSyncProvider>
  );
}
