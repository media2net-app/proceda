"use client";

import { useLocale } from "next-intl";
import { usePathname } from "@/i18n/navigation";

const locales = [
  { code: "nl" as const, label: "NL" },
  { code: "en" as const, label: "EN" },
  { code: "ro" as const, label: "RO" },
];

type LanguageSwitcherProps = {
  variant?: "default" | "hero";
};

export default function LanguageSwitcher({ variant = "default" }: LanguageSwitcherProps) {
  const locale = useLocale();
  const pathname = usePathname();

  const isHero = variant === "hero";

  return (
    <div
      className={
        isHero
          ? "flex items-center gap-1 rounded-lg border border-white/20 bg-white/10 px-1 py-0.5 backdrop-blur-sm"
          : "flex items-center gap-1 rounded-lg border border-[#D0D5DD] bg-white px-1 py-0.5 shadow-xs"
      }
    >
      {locales.map(({ code, label }) => (
        <a
          key={code}
          href={`/${code}${pathname}`}
          className={`rounded-md px-2 py-1 text-sm font-medium transition-colors ${
            locale === code
              ? isHero
                ? "bg-white/20 text-white"
                : "bg-[#F9F5FF] text-[#6941C6]"
              : isHero
                ? "text-white/70 hover:bg-white/10 hover:text-white"
                : "text-[#667085] hover:bg-[#F9FAFB] hover:text-[#101828]"
          }`}
          aria-current={locale === code ? "true" : undefined}
        >
          {label}
        </a>
      ))}
    </div>
  );
}
