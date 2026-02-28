"use client";

import { useLocale } from "next-intl";
import { usePathname } from "@/i18n/navigation";

const locales = [
  { code: "nl" as const, label: "NL" },
  { code: "en" as const, label: "EN" },
  { code: "ro" as const, label: "RO" },
];

export default function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-1 rounded-lg border border-white/20 bg-white/5 px-1 py-0.5">
      {locales.map(({ code, label }) => (
        <a
          key={code}
          href={`/${code}${pathname}`}
          className={`rounded-md px-2 py-1 text-sm font-medium transition-colors ${
            locale === code
              ? "bg-white/20 text-white"
              : "text-white/80 hover:text-white hover:bg-white/10"
          }`}
          aria-current={locale === code ? "true" : undefined}
        >
          {label}
        </a>
      ))}
    </div>
  );
}
