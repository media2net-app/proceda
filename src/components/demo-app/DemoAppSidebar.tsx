"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { DEMO_APP_NAV, demoAppHref, demoAppNavActive } from "@/lib/demo-app/nav";
import { useMakelaarPortal } from "./MakelaarPortalContext";

type Props = {
  open?: boolean;
  onClose?: () => void;
};

export default function DemoAppSidebar({ open, onClose }: Props) {
  const { brand, slug } = useMakelaarPortal();
  const pathname = usePathname();

  return (
    <>
      {open && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          aria-label="Sluit menu"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-[#EAECF0] bg-white transition-transform md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="border-b border-[#EAECF0] px-4 py-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={brand.logoPath}
            alt={brand.businessName}
            className="h-12 w-auto max-w-[220px] object-contain object-left"
          />
          <p className="mt-2 text-xs font-medium text-[#667085]">Makelaarsportaal</p>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {DEMO_APP_NAV.map((item) => {
            const href = demoAppHref(slug, item.segment || undefined);
            const isActive = demoAppNavActive(pathname, slug, item.segment);
            return (
              <Link
                key={item.id}
                href={href}
                onClick={onClose}
                className={`flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
                  isActive
                    ? "text-white"
                    : "text-[#344054] hover:bg-[#F9FAFB]"
                }`}
                style={
                  isActive
                    ? { backgroundColor: brand.primaryColor }
                    : undefined
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-2 border-t border-[#EAECF0] p-4">
          <a
            href={brand.homepageDemoPath}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-lg border border-[#EAECF0] bg-[#F9FAFB] px-3 py-2 text-center text-xs font-semibold text-[#344054] hover:bg-[#F2F4F7]"
          >
            ↔ Website-concept
          </a>
        </div>
      </aside>
    </>
  );
}
