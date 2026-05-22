"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { useMailSync } from "@/context/MailSyncContext";
import { useAdminVertical } from "@/context/AdminVerticalContext";
import { AdminVerticalSelector } from "@/components/admin/AdminVerticalSelector";
import { MAKELAARDIJ_PRODUCT_DEMO_SLUG } from "@/lib/product/config";

type DashboardSidebarProps = {
  open?: boolean;
  onClose?: () => void;
};

type NavIconName =
  | "building"
  | "chart"
  | "chart2"
  | "calendar"
  | "mail"
  | "cube"
  | "palette"
  | "globe";

const navItems: {
  href: string;
  key:
    | "sidebarKpi"
    | "sidebarBedrijven"
    | "sidebarHuisstijl"
    | "sidebarRapportage"
    | "sidebarMail"
    | "sidebarAfspraken"
    | "sidebarLiveView";
  icon: NavIconName;
  exact?: boolean;
  showUnread?: boolean;
}[] = [
  { href: "/dashboard-admin", key: "sidebarKpi", icon: "chart", exact: true },
  { href: "/dashboard-admin/live-view", key: "sidebarLiveView", icon: "globe" },
  { href: "/dashboard-admin/bedrijven", key: "sidebarBedrijven", icon: "building" },
  { href: "/dashboard-admin/huisstijl", key: "sidebarHuisstijl", icon: "palette" },
  { href: "/dashboard-admin/rapportage", key: "sidebarRapportage", icon: "chart2" },
  { href: "/dashboard-admin/mail", key: "sidebarMail", icon: "mail", showUnread: true },
  { href: "/dashboard-admin/afspraken", key: "sidebarAfspraken", icon: "calendar" },
];

const productNav = {
  baseHref: "/dashboard-admin/product",
  key: "sidebarProduct" as const,
  children: [
    { href: "/dashboard-admin/product", key: "sidebarProductOverview" as const, exact: true },
    { href: "/dashboard-admin/product/marktonderzoek", key: "sidebarMarktonderzoek" as const },
    {
      href: `/demos/${MAKELAARDIJ_PRODUCT_DEMO_SLUG}/app`,
      key: "sidebarBekijkProduct" as const,
      isDemoApp: true,
    },
  ],
};

function BuildingIcon() {
  return (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5M2.25 9h19.5M2.25 3h19.5M4.5 9v12m0 0v-3.75M4.5 12h15m-7.5-3v3.75m0 0V9m0 3.75h7.5M19.5 9v12m0-3.75V9m0 3.75h-7.5" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M4.5 8.25h15M4.5 19.5h15a2.25 2.25 0 002.25-2.25V8.25a2.25 2.25 0 00-2.25-2.25h-15a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25z" />
    </svg>
  );
}

function CubeIcon() {
  return (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-14.25v9" />
    </svg>
  );
}

function PaletteIcon() {
  return (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.098 19.902a3.75 3.75 0 005.803 0M4.098 19.902c0-1.705.842-3.248 2.197-4.196M12 16.5V9.75m0 0a3.75 3.75 0 013.75-3.75M12 9.75a3.75 3.75 0 00-3.75-3.75M12 9.75V6m0 0a3.75 3.75 0 013.75-3.75M12 6a3.75 3.75 0 00-3.75-3.75"
      />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-8.843 4.582m16.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5a17.92 17.92 0 01-8.716-2.247m0 0A8.966 8.966 0 013 12c0-1.264.26-2.467.732-3.532" />
    </svg>
  );
}

function NavIcon({ name }: { name: NavIconName }) {
  if (name === "globe") return <GlobeIcon />;
  if (name === "mail") return <MailIcon />;
  if (name === "calendar") return <CalendarIcon />;
  if (name === "chart2") return <GridIcon />;
  if (name === "chart") return <ChartIcon />;
  if (name === "cube") return <CubeIcon />;
  if (name === "palette") return <PaletteIcon />;
  return <BuildingIcon />;
}

function linkActive(pathname: string, href: string, exact?: boolean) {
  return exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

function MailStatusFooter() {
  const t = useTranslations("dashboard");
  const mail = useMailSync();

  if (!mail.configured) {
    return (
      <div className="rounded-xl border border-[#FECDCA] bg-[#FEF3F2] p-3 text-xs text-[#B42318]">
        <p className="font-semibold">{t("mailNotConfigured")}</p>
      </div>
    );
  }

  const connected = mail.connected && !mail.lastSyncError;
  const syncLabel = mail.syncing
    ? t("mailSyncing")
    : connected
      ? t("mailConnected")
      : t("mailDisconnected");

  return (
    <div
      className={`rounded-xl border p-3 text-xs ${
        connected
          ? "border-[#ABEFC6] bg-[#ECFDF3]"
          : "border-[#FECDCA] bg-[#FEF3F2]"
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`h-2.5 w-2.5 shrink-0 rounded-full ${
            mail.syncing
              ? "animate-pulse bg-[#7F56D9]"
              : connected
                ? "bg-[#12B76A]"
                : "bg-[#F04438]"
          }`}
          aria-hidden
        />
        <p
          className={`font-semibold ${
            connected ? "text-[#027A48]" : "text-[#B42318]"
          }`}
        >
          {syncLabel}
        </p>
      </div>
      <p className={`mt-1.5 ${connected ? "text-[#027A48]" : "text-[#B42318]"}`}>
        {mail.from ?? "info@proceda.nl"}
      </p>
      {mail.syncedAt && (
        <p className={`mt-1 ${connected ? "text-[#027A48]/80" : "text-[#B42318]/80"}`}>
          {t("mailLastSync")}:{" "}
          {new Date(mail.syncedAt).toLocaleString("nl-NL", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      )}
      {mail.lastSyncError && !mail.syncing && (
        <p className="mt-1 text-[#B42318]">{mail.lastSyncError}</p>
      )}
      <p className="mt-1.5 text-[#667085]">{t("mailAutoSync")}</p>
    </div>
  );
}

export default function DashboardSidebar({ open = false, onClose }: DashboardSidebarProps) {
  const t = useTranslations("dashboard");
  const pathname = usePathname();
  const mail = useMailSync();
  const { verticalLabel } = useAdminVertical();
  const productActive = pathname.startsWith(productNav.baseHref);
  const [productOpen, setProductOpen] = useState(productActive);
  const productExpanded = productOpen || productActive;

  const sidebarContent = (
    <>
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-[#EAECF0] px-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight text-[#101828]" onClick={onClose}>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#7F56D9] text-sm font-bold text-white">P</span>
          Proceda
        </Link>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[#667085] hover:bg-[#F2F4F7] hover:text-[#101828] md:hidden"
            aria-label={t("closeMenu")}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="px-3 pt-4 space-y-3">
        <AdminVerticalSelector />
        <div className="flex items-center gap-2 rounded-lg border border-[#D0D5DD] bg-white px-3 py-2 shadow-xs">
          <svg className="h-4 w-4 text-[#98A2B3]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span className="text-sm text-[#98A2B3]">{t("sidebarSearch")}</span>
          <span className="ml-auto rounded border border-[#EAECF0] px-1.5 py-0.5 text-[10px] text-[#667085]">⌘K</span>
        </div>
      </div>

      <nav className="scroll-touch flex flex-1 flex-col gap-0.5 overflow-y-auto p-3">
        {navItems.map(({ href, key, icon, exact, showUnread }) => {
          const isActive = linkActive(pathname, href, exact);
          const unread = showUnread && key === "sidebarMail" ? mail.unread : 0;
          return (
            <Link
              key={key}
              href={href}
              onClick={onClose}
              className={`admin-nav-item flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "admin-nav-active bg-[#F2F4F7] text-[#101828]"
                  : "text-[#475467] hover:bg-[#F9FAFB] hover:text-[#101828]"
              }`}
            >
              <NavIcon name={icon} />
              <span className="flex-1">
                {key === "sidebarMail"
                  ? `${t(key)} · ${verticalLabel}`
                  : t(key)}
              </span>
              {unread > 0 && (
                <span className="rounded-full bg-[#7F56D9] px-2 py-0.5 text-[11px] font-bold text-white">
                  {unread}
                </span>
              )}
            </Link>
          );
        })}

        <div className="mt-1">
          <button
            type="button"
            onClick={() => setProductOpen((v) => !v)}
            className={`admin-nav-item flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              productActive
                ? "admin-nav-active bg-[#F2F4F7] text-[#101828]"
                : "text-[#475467] hover:bg-[#F9FAFB] hover:text-[#101828]"
            }`}
          >
            <NavIcon name="cube" />
            <span className="flex-1 text-left">{t(productNav.key)}</span>
            <svg
              className={`h-4 w-4 shrink-0 text-[#98A2B3] transition-transform ${
                productExpanded ? "rotate-180" : ""
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
          {productExpanded && (
            <div className="ml-4 mt-0.5 space-y-0.5 border-l border-[#EAECF0] pl-2">
              {productNav.children.map(({ href, key, exact, isDemoApp }) => {
                const isActive = isDemoApp
                  ? pathname.includes("/demos/") && pathname.endsWith("/app")
                  : linkActive(pathname, href, exact);
                return (
                  <Link
                    key={key}
                    href={href}
                    onClick={onClose}
                    className={`admin-nav-item flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "admin-nav-product-active bg-[#F9F5FF] text-[#6941C6]"
                        : "text-[#475467] hover:bg-[#F9FAFB] hover:text-[#101828]"
                    }`}
                  >
                    <span>{t(key)}</span>
                    {isDemoApp && (
                      <svg
                        className="h-3.5 w-3.5 shrink-0 opacity-60"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                        aria-hidden
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5M10.5 13.5 21 3m0 0h-5.25M21 3v5.25"
                        />
                      </svg>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </nav>

      <div className="border-t border-[#EAECF0] p-3">
        <MailStatusFooter />
      </div>
    </>
  );

  return (
    <>
      {onClose && (
        <button
          type="button"
          aria-hidden
          onClick={onClose}
          className={`fixed inset-0 z-30 bg-[#101828]/40 transition-opacity md:hidden ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
        />
      )}

      <aside
        className={`admin-sidebar safe-top safe-x fixed left-0 top-0 z-40 flex h-full h-[100dvh] w-[min(100vw,16rem)] max-w-[85vw] flex-col border-r border-[#EAECF0] bg-white transition-transform duration-300 ease-out md:z-20 md:w-64 md:max-w-none md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } md:flex`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
