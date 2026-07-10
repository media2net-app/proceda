"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useLocale } from "next-intl";
import { usePathname } from "@/i18n/navigation";

const locales = [
  { code: "nl" as const, label: "Nederlands", flag: "🇳🇱" },
  { code: "en" as const, label: "English", flag: "🇬🇧" },
  { code: "ro" as const, label: "Română", flag: "🇷🇴" },
];

type LanguageSwitcherProps = {
  variant?: "default" | "hero";
};

export default function LanguageSwitcher({ variant = "default" }: LanguageSwitcherProps) {
  const locale = useLocale();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const current = locales.find((l) => l.code === locale) ?? locales[0];
  const isHero = variant === "hero";

  useEffect(() => {
    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const triggerClass = isHero
    ? "flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 py-1.5 text-sm text-white backdrop-blur-sm transition-colors hover:bg-white/15"
    : "flex items-center gap-1.5 rounded-lg border border-[#D0D5DD] bg-white px-2.5 py-1.5 text-sm text-[#344054] shadow-xs transition-colors hover:bg-[#F9FAFB]";

  const menuClass = isHero
    ? "absolute right-0 top-[calc(100%+0.5rem)] z-50 min-w-[10.5rem] overflow-hidden rounded-xl border border-white/10 bg-[#141414] py-1 shadow-xl shadow-black/40"
    : "absolute right-0 top-[calc(100%+0.5rem)] z-50 min-w-[10.5rem] overflow-hidden rounded-xl border border-[#EAECF0] bg-white py-1 shadow-lg";

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={triggerClass}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`Language: ${current.label}`}
      >
        <span className="text-base leading-none" aria-hidden>
          {current.flag}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 opacity-60 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {open ? (
        <ul role="listbox" aria-label="Select language" className={menuClass}>
          {locales.map(({ code, label, flag }) => {
            const active = locale === code;
            return (
              <li key={code} role="option" aria-selected={active}>
                <a
                  href={`/${code}${pathname}`}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                    active
                      ? isHero
                        ? "bg-white/10 font-medium text-white"
                        : "bg-[#F9F5FF] font-medium text-[#6941C6]"
                      : isHero
                        ? "text-white/75 hover:bg-white/10 hover:text-white"
                        : "text-[#344054] hover:bg-[#F9FAFB]"
                  }`}
                >
                  <span className="text-base leading-none" aria-hidden>
                    {flag}
                  </span>
                  {label}
                </a>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
