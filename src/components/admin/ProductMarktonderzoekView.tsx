"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import {
  MARKTONDERZOEK_INSIGHTS,
  MARKTONDERZOEK_META,
  MARKTONDERZOEK_MODULES,
  countFeaturesByPriority,
  type FeaturePriority,
  type MarktonderzoekFeature,
} from "@/lib/product/marktonderzoek-data";

const PRIORITY_STYLE: Record<
  FeaturePriority,
  { badge: string; labelKey: "priorityMust" | "priorityShould" | "priorityCould" }
> = {
  must: { badge: "bg-[#FEF3F2] text-[#B42318] border-[#FECDCA]", labelKey: "priorityMust" },
  should: { badge: "bg-[#FFF4ED] text-[#C4320A] border-[#FEDF89]", labelKey: "priorityShould" },
  could: { badge: "bg-[#F2F4F7] text-[#475467] border-[#EAECF0]", labelKey: "priorityCould" },
};

const PROCEDA_STYLE = {
  demo: "bg-[#ECFDF3] text-[#027A48] border-[#ABEFC6]",
  planned: "bg-[#EFF8FF] text-[#175CD3] border-[#B2DDFF]",
  gap: "bg-[#F9F5FF] text-[#6941C6] border-[#D6BBFB]",
} as const;

function FeatureRow({
  feature,
  t,
}: {
  feature: MarktonderzoekFeature;
  t: ReturnType<typeof useTranslations<"product">>;
}) {
  const p = PRIORITY_STYLE[feature.priority];
  return (
    <li className="rounded-xl border border-[#EAECF0] bg-white p-4 shadow-xs">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h4 className="text-sm font-semibold text-[#101828]">{feature.title}</h4>
        <div className="flex flex-wrap gap-1.5">
          <span
            className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${p.badge}`}
          >
            {t(p.labelKey)}
          </span>
          {feature.procedaStatus && (
            <span
              className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                PROCEDA_STYLE[feature.procedaStatus]
              }`}
            >
              {t(`proceda_${feature.procedaStatus}`)}
            </span>
          )}
        </div>
      </div>
      <p className="mt-2 text-sm text-[#475467]">{feature.description}</p>
      {feature.marketRefs && feature.marketRefs.length > 0 && (
        <p className="mt-2 text-xs text-[#667085]">
          <span className="font-medium text-[#344054]">{t("marketLabel")}: </span>
          {feature.marketRefs.join(" · ")}
        </p>
      )}
    </li>
  );
}

export function ProductMarktonderzoekView() {
  const t = useTranslations("product");
  const counts = countFeaturesByPriority();

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-2">
        <Link
          href="/dashboard-admin/product"
          className="text-sm font-medium text-[#7F56D9] hover:text-[#6941C6]"
        >
          ← {t("backToProduct")}
        </Link>
      </div>

      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#7F56D9]">
          {t("makelaardijLabel")}
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-[#101828]">
          {MARKTONDERZOEK_META.title}
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-[#667085]">
          {MARKTONDERZOEK_META.subtitle}
        </p>
        <p className="mt-2 text-xs text-[#98A2B3]">
          {t("updated")}: {MARKTONDERZOEK_META.updatedAt}
        </p>
      </div>

      <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-[#FECDCA] bg-[#FEF3F2] p-4">
          <p className="text-xs font-semibold text-[#B42318]">{t("priorityMust")}</p>
          <p className="mt-1 text-2xl font-bold text-[#7A271A]">{counts.must}</p>
          <p className="text-xs text-[#B42318]">{t("mustHint")}</p>
        </div>
        <div className="rounded-xl border border-[#FEDF89] bg-[#FFFAEB] p-4">
          <p className="text-xs font-semibold text-[#B54708]">{t("priorityShould")}</p>
          <p className="mt-1 text-2xl font-bold text-[#93370D]">{counts.should}</p>
        </div>
        <div className="rounded-xl border border-[#ABEFC6] bg-[#ECFDF3] p-4">
          <p className="text-xs font-semibold text-[#027A48]">{t("proceda_demo")}</p>
          <p className="mt-1 text-2xl font-bold text-[#05603A]">{counts.demo}</p>
          <p className="text-xs text-[#027A48]">{t("demoHint")}</p>
        </div>
        <div className="rounded-xl border border-[#D6BBFB] bg-[#F9F5FF] p-4">
          <p className="text-xs font-semibold text-[#6941C6]">{t("gapLabel")}</p>
          <p className="mt-1 text-2xl font-bold text-[#53389E]">{counts.gap}</p>
          <p className="text-xs text-[#6941C6]">{t("gapHint")}</p>
        </div>
      </div>

      <section className="mb-10">
        <h2 className="text-base font-semibold text-[#101828]">{t("insightsTitle")}</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {MARKTONDERZOEK_INSIGHTS.map((insight) => (
            <div
              key={insight.title}
              className="rounded-xl border border-[#EAECF0] bg-white p-4 shadow-xs"
            >
              <h3 className="text-sm font-semibold text-[#101828]">{insight.title}</h3>
              <p className="mt-2 text-sm text-[#475467]">{insight.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-base font-semibold text-[#101828]">{t("modulesTitle")}</h2>
        <p className="mt-1 text-sm text-[#667085]">{t("modulesSubtitle")}</p>
        <div className="mt-6 space-y-10">
          {MARKTONDERZOEK_MODULES.map((mod) => (
            <div key={mod.id}>
              <div className="mb-3 border-b border-[#EAECF0] pb-2">
                <h3 className="text-lg font-semibold text-[#101828]">{mod.title}</h3>
                <p className="text-sm text-[#667085]">{mod.summary}</p>
              </div>
              <ul className="space-y-3">
                {mod.features.map((f) => (
                  <FeatureRow key={f.id} feature={f} t={t} />
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-8 rounded-xl border border-[#D6BBFB] bg-gradient-to-br from-[#F9F5FF] to-white p-5">
        <h2 className="text-base font-semibold text-[#101828]">{t("mvpTitle")}</h2>
        <p className="mt-2 text-sm text-[#475467]">{t("mvpBody")}</p>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-[#344054]">
          <li>{t("mvpStep1")}</li>
          <li>{t("mvpStep2")}</li>
          <li>{t("mvpStep3")}</li>
          <li>{t("mvpStep4")}</li>
        </ol>
        <a
          href="/demos/schenkel-makelaardij/app"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex rounded-lg bg-[#7F56D9] px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-[#6941C6]"
        >
          {t("openDemo")}
        </a>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-[#101828]">{t("sourcesTitle")}</h2>
        <ul className="mt-2 space-y-1 text-sm">
          {MARKTONDERZOEK_META.sources.map((s) => (
            <li key={s.url}>
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#7F56D9] hover:underline"
              >
                {s.name}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
