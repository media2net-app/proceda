"use client";

import { Link } from "@/i18n/navigation";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import HeroMobileNav from "@/components/HeroMobileNav";
import { BookingCtaButton } from "@/components/booking/BookingCtaButton";

type NavLink = { href: string; label: string };

type OrbaiHeaderProps = {
  navLinks: NavLink[];
  ctaLabel: string;
  menuLabel: string;
  closeLabel: string;
  languageLabel: string;
};

export default function OrbaiHeader({
  navLinks,
  ctaLabel,
  menuLabel,
  closeLabel,
  languageLabel,
}: OrbaiHeaderProps) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6">
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between rounded-full border border-white/[0.08] bg-[#0A0A0A]/90 px-4 shadow-lg shadow-black/20 backdrop-blur-xl sm:px-6">
        <Link href="/" className="text-base font-bold tracking-tight text-white sm:text-lg">
          Proceda
        </Link>

        <div className="hidden items-center gap-0.5 lg:flex">
          {navLinks.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className="rounded-full px-3.5 py-1.5 text-sm text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            >
              {label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden lg:block">
            <LanguageSwitcher variant="hero" />
          </div>
          <BookingCtaButton size="sm">{ctaLabel}</BookingCtaButton>
          <HeroMobileNav
            menuLabel={menuLabel}
            closeLabel={closeLabel}
            languageLabel={languageLabel}
            navLinks={navLinks}
            ctaLabel={ctaLabel}
          />
        </div>
      </nav>
    </header>
  );
}
