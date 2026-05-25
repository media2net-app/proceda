"use client";

import { useState } from "react";
import { useRecruitmentPortal } from "./RecruitmentPortalContext";
import RecruitmentAppSidebar from "./RecruitmentAppSidebar";

export default function RecruitmentAppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { brand } = useRecruitmentPortal();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div
      className="min-h-screen bg-[#F9FAFB] text-[#101828]"
      style={
        {
          "--demo-primary": brand.primaryColor,
          "--demo-secondary": brand.secondaryColor,
        } as React.CSSProperties
      }
    >
      <RecruitmentAppSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <button
        type="button"
        onClick={() => setSidebarOpen(true)}
        className="fixed left-4 top-4 z-30 rounded-lg border border-[#EAECF0] bg-white p-2 text-[#667085] shadow-md hover:bg-[#F9FAFB] md:hidden"
        aria-label="Menu"
      >
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
          />
        </svg>
      </button>

      <div className="md:pl-64">
        <main className="px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
