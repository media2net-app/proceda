"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

const CARDS = [
  {
    href: "/dashboard-admin/product/marktonderzoek",
    titleKey: "cardMarktonderzoekTitle" as const,
    descKey: "cardMarktonderzoekDesc" as const,
    badgeKey: "cardMarktonderzoekBadge" as const,
    accent: true,
  },
] as const;

export function ProductOverviewView() {
  const t = useTranslations("product");

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#7F56D9]">
          {t("makelaardijLabel")}
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-[#101828]">{t("overviewTitle")}</h1>
        <p className="mt-2 text-sm text-[#667085]">{t("overviewSubtitle")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {CARDS.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className={`group rounded-xl border p-5 shadow-xs transition-shadow hover:shadow-md ${
              card.accent
                ? "border-[#D6BBFB] bg-gradient-to-br from-[#F9F5FF] to-white"
                : "border-[#EAECF0] bg-white hover:border-[#D0D5DD]"
            }`}
          >
            <span
              className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                card.accent
                  ? "bg-[#F4EBFF] text-[#6941C6]"
                  : "bg-[#F2F4F7] text-[#475467]"
              }`}
            >
              {t(card.badgeKey)}
            </span>
            <h2 className="mt-3 text-lg font-semibold text-[#101828] group-hover:text-[#6941C6]">
              {t(card.titleKey)}
            </h2>
            <p className="mt-2 text-sm text-[#667085]">{t(card.descKey)}</p>
            <span className="mt-4 inline-block text-sm font-semibold text-[#7F56D9]">
              {t("openPage")} →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
