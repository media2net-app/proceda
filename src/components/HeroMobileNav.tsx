"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Menu, X } from "lucide-react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { BookingCtaButton } from "@/components/booking/BookingCtaButton";

type NavLink = { href: string; label: string };

type HeroMobileNavProps = {
  menuLabel: string;
  closeLabel: string;
  languageLabel?: string;
  navLinks: NavLink[];
  ctaLabel: string;
};

export default function HeroMobileNav({
  menuLabel,
  closeLabel,
  languageLabel = "Language",
  navLinks,
  ctaLabel,
}: HeroMobileNavProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    if (open) window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const overlay = mounted
    ? createPortal(
        <>
          <button
            type="button"
            aria-label={closeLabel}
            onClick={() => setOpen(false)}
            className={`fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
              open ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          />
          <aside
            id="hero-mobile-nav"
            role="dialog"
            aria-modal="true"
            aria-label={menuLabel}
            aria-hidden={!open}
            className={`fixed right-0 top-0 z-[201] flex h-full w-[min(100vw,22rem)] flex-col border-l border-white/10 bg-[#0A0A0A] shadow-2xl transition-transform duration-300 ease-out lg:hidden ${
              open ? "translate-x-0" : "pointer-events-none translate-x-full"
            }`}
          >
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-5">
              <span className="text-lg font-bold text-white">Proceda</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                aria-label={closeLabel}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
              {navLinks.map(({ href, label }) => (
                <a
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-4 py-3.5 text-base font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                >
                  {label}
                </a>
              ))}

              <div className="my-3 border-t border-white/10 pt-4">
                <p className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-white/40">
                  {languageLabel}
                </p>
                <div className="px-4">
                  <LanguageSwitcher variant="hero" />
                </div>
              </div>

              <BookingCtaButton
                onClick={() => setOpen(false)}
                className="mx-1 mt-auto w-[calc(100%-0.5rem)]"
              >
                {ctaLabel}
              </BookingCtaButton>
            </nav>
          </aside>
        </>,
        document.body,
      )
    : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/15 lg:hidden"
        aria-expanded={open}
        aria-controls="hero-mobile-nav"
        aria-label={menuLabel}
      >
        <Menu className="h-5 w-5" />
      </button>
      {overlay}
    </>
  );
}
