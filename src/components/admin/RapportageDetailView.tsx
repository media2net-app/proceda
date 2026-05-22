"use client";

import { Link } from "@/i18n/navigation";
import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  businessIdToDemoSlug,
  demoAppPublicPath,
  demoHomepagePublicPath,
} from "@/lib/bedrijven/demo-slug";
import type { Bedrijf } from "@/lib/bedrijven/types";
import type { BusinessReport } from "@/lib/bedrijven/business-report-types";
export function RapportageDetailView({ slug }: { slug: string }) {
  const t = useTranslations("adminRapportage");
  const locale = useLocale();

  const [business, setBusiness] = useState<Bedrijf | null>(null);
  const [report, setReport] = useState<BusinessReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [fullReport, setFullReport] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/bedrijven/rapport/${slug}`);
      if (!res.ok) {
        setBusiness(null);
        setReport(null);
        return;
      }
      const data = (await res.json()) as {
        business: Bedrijf;
        report: BusinessReport | null;
      };
      setBusiness(data.business);
      setReport(data.report);
    } catch {
      setError(t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [slug, t]);

  useEffect(() => {
    load();
  }, [load]);

  async function generateReport(deep = false) {
    setGenerating(true);
    setFullReport(deep);
    setError(null);
    try {
      const endpoint = deep
        ? `/api/bedrijven/full-report/${slug}`
        : `/api/bedrijven/rapport/${slug}`;
      const res = await fetch(endpoint, {
        method: "POST",
        signal: AbortSignal.timeout(deep ? 300000 : 180000),
      });
      const data = (await res.json()) as {
        report?: BusinessReport;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? t("generateError"));
      setReport(data.report ?? null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("generateError"));
    } finally {
      setGenerating(false);
      setFullReport(false);
    }
  }

  async function copyEmail() {
    if (!report?.ai.proposalEmailDraft) return;
    await navigator.clipboard.writeText(report.ai.proposalEmailDraft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-[#EAECF0] bg-white py-12 text-center text-sm text-[#667085] shadow-xs">
        {t("loading")}
      </div>
    );
  }

  if (!business) {
    return (
      <div className="rounded-xl border border-[#EAECF0] bg-white p-8 text-center shadow-xs">
        <p className="font-medium text-[#101828]">{t("notFound")}</p>
        <Link
          href="/dashboard-admin/rapportage"
          className="mt-4 inline-block text-sm font-semibold text-[#7F56D9] hover:underline"
        >
          ← {t("back")}
        </Link>
      </div>
    );
  }

  const websiteUrl = business.website!.startsWith("http")
    ? business.website!
    : `https://${business.website}`;

  const demoSlug = businessIdToDemoSlug(business.id);
  const demoHomepageUrl =
    report?.demoHomepageUrl?.includes("/demos/")
      ? report.demoHomepageUrl.startsWith(`/${locale}/`)
        ? report.demoHomepageUrl
        : demoHomepagePublicPath(demoSlug, locale)
      : report?.demoHomepageUrl;

  const demoAppUrl =
    report?.demoAppUrl?.includes("/demos/")
      ? report.demoAppUrl.startsWith(`/${locale}/`)
        ? report.demoAppUrl
        : demoAppPublicPath(demoSlug, locale)
      : report?.demoAppUrl ?? demoAppPublicPath(demoSlug, locale);

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard-admin/rapportage"
        className="inline-flex text-sm font-semibold text-[#7F56D9] hover:underline"
      >
        ← {t("back")}
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#101828]">{business.name}</h1>
          <p className="mt-1 text-sm text-[#667085]">
            {business.address} · {business.city}, {business.province}
          </p>
          <p className="mt-1 text-sm text-[#667085]">
            {t(`categories.${business.category}` as "categories.horeca")} ·{" "}
            {business.subcategory}
          </p>
          <a
            href={websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-sm font-medium text-[#7F56D9] hover:underline"
          >
            {websiteUrl} ↗
          </a>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => generateReport(false)}
            disabled={generating}
            className="rounded-lg border border-[#D6BBFB] bg-white px-4 py-2 text-sm font-semibold text-[#6941C6] hover:bg-[#F4EBFF] disabled:opacity-60"
          >
            {generating && !fullReport
              ? t("generating")
              : report
                ? t("regenerate")
                : t("generate")}
          </button>
          <button
            type="button"
            onClick={() => generateReport(true)}
            disabled={generating}
            className="rounded-lg bg-[#7F56D9] px-4 py-2 text-sm font-semibold text-white hover:bg-[#6941C6] disabled:opacity-60"
          >
            {generating && fullReport ? t("fullReportRunning") : t("fullReport")}
          </button>
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-lg border border-[#FECDCA] bg-[#FEF3F2] px-4 py-3 text-sm text-[#B42318]"
        >
          {error}
        </p>
      )}

      {generating && (
        <div className="rounded-xl border border-[#D6BBFB] bg-[#F9F5FF] p-4">
          <p className="text-sm font-medium text-[#6941C6]">
            {fullReport ? t("fullReportHint") : t("generatingHint")}
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#E9D7FE]">
            <div className="h-full w-2/3 animate-pulse rounded-full bg-[#7F56D9]" />
          </div>
        </div>
      )}

      {!report && !generating && (
        <div className="rounded-xl border border-dashed border-[#D0D5DD] bg-[#F9FAFB] p-6 text-center">
          <p className="text-sm text-[#667085]">{t("noReportYet")}</p>
        </div>
      )}

      {report && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-xl border-2 border-[#7F56D9] bg-[#F9F5FF] p-4 text-center shadow-xs sm:col-span-2 lg:col-span-1">
              <p className="text-xs font-semibold uppercase text-[#6941C6]">{t("overallScore")}</p>
              <p className="mt-2 text-4xl font-bold text-[#7F56D9]">{report.overallScore}</p>
              <p className="mt-1 text-xs font-semibold text-[#6941C6]">
                {t(`leadQuality.${report.leadQuality}`)}
              </p>
            </div>
            <div className="rounded-xl border border-[#EAECF0] bg-white p-4 shadow-xs lg:col-span-2">
              <p className="text-xs font-semibold uppercase text-[#667085]">{t("detectedServices")}</p>
              <p className="mt-2 text-sm text-[#475467]">
                {report.servicesSummary || report.detectedServices?.join(" · ") || "—"}
              </p>
              <p className="mt-3 text-xs font-semibold uppercase text-[#667085]">{t("primaryAppType")}</p>
              <p className="mt-1 text-lg font-semibold text-[#101828]">
                {t(`appTypes.${report.primaryAppType}`)}
              </p>
            </div>
            <div className="rounded-xl border border-[#EAECF0] bg-white p-4 text-center shadow-xs">
              <p className="text-xs font-semibold uppercase text-[#667085]">{t("seoScore")}</p>
              <p className="mt-2 text-3xl font-bold text-[#7F56D9]">{report.seoScore}</p>
            </div>
            <div className="rounded-xl border border-[#EAECF0] bg-white p-4 text-center shadow-xs">
              <p className="text-xs font-semibold uppercase text-[#667085]">{t("modernityScore")}</p>
              <p className="mt-2 text-3xl font-bold text-[#7F56D9]">{report.modernityScore}</p>
            </div>
          </div>

          <div className="rounded-xl border border-[#EAECF0] bg-white p-4 shadow-xs">
            <p className="text-xs font-semibold uppercase text-[#667085]">{t("responseTime")}</p>
            <p className="mt-1 text-lg font-semibold text-[#101828]">
              {(report.responseTimeMs / 1000).toFixed(1)}s
            </p>
          </div>

          {(demoHomepageUrl || demoAppUrl) && (
            <div className="space-y-4">
              {demoHomepageUrl && (
                <div className="rounded-xl border-2 border-[#7F56D9] bg-[#F9F5FF] p-5 shadow-xs">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-base font-semibold text-[#101828]">
                        {t("demoHomepage")}
                      </h2>
                      <p className="mt-1 text-sm text-[#475467]">{t("demoHomepageSub")}</p>
                      {report.deepScrape && (
                        <p className="mt-2 text-xs text-[#667085]">
                          {t("deepScrapeMeta", {
                            pages: report.deepScrape.pagesScraped,
                            colors: report.deepScrape.brandColors.join(", "),
                          })}
                        </p>
                      )}
                    </div>
                    <a
                      href={demoHomepageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg bg-[#7F56D9] px-4 py-2 text-sm font-semibold text-white hover:bg-[#6941C6]"
                    >
                      {t("openDemoHomepage")} ↗
                    </a>
                  </div>
                  <div className="mt-4 overflow-hidden rounded-lg border border-[#D6BBFB] bg-white">
                    <iframe
                      title={t("demoHomepage")}
                      src={demoHomepageUrl}
                      className="h-[420px] w-full border-0"
                    />
                  </div>
                </div>
              )}

              {demoAppUrl && (
                <div className="rounded-xl border-2 border-[#E85B2B] bg-[#FFF4ED] p-5 shadow-xs">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-base font-semibold text-[#101828]">
                        {t("demoApp")}
                      </h2>
                      <p className="mt-1 text-sm text-[#475467]">{t("demoAppSub")}</p>
                    </div>
                    <a
                      href={demoAppUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg bg-[#E85B2B] px-4 py-2 text-sm font-semibold text-white hover:bg-[#d94e1f]"
                    >
                      {t("openDemoApp")} ↗
                    </a>
                  </div>
                  <div className="mt-4 overflow-hidden rounded-lg border border-[#FDBA74] bg-white">
                    <iframe
                      title={t("demoApp")}
                      src={demoAppUrl}
                      className="h-[520px] w-full border-0"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-[#EAECF0] bg-white p-5 shadow-xs">
              <h2 className="text-base font-semibold text-[#101828]">{t("screenshot")}</h2>
              {report.screenshotPath ? (
                <div className="relative mt-4 overflow-hidden rounded-lg border border-[#EAECF0]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/bedrijven/screenshot/${slug}`}
                    alt={`${business.name} homepage`}
                    className="h-auto w-full"
                  />
                </div>
              ) : (
                <p className="mt-3 text-sm text-[#667085]">{t("screenshotFailed")}</p>
              )}
            </div>

            <div className="rounded-xl border border-[#EAECF0] bg-white p-5 shadow-xs">
              <h2 className="text-base font-semibold text-[#101828]">{t("companyInfo")}</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div>
                  <dt className="text-[#667085]">{t("pageTitle")}</dt>
                  <dd className="font-medium text-[#101828]">{report.pageTitle ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-[#667085]">{t("email")}</dt>
                  <dd className="font-medium text-[#101828]">
                    {business.email ?? report.extractedEmail ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[#667085]">{t("phone")}</dt>
                  <dd className="font-medium text-[#101828]">{business.phone ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-[#667085]">{t("services")}</dt>
                  <dd className="text-[#475467]">{report.ai.servicesOffered}</dd>
                </div>
                <div>
                  <dt className="text-[#667085]">{t("summary")}</dt>
                  <dd className="text-[#475467]">{report.ai.companySummary}</dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="rounded-xl border border-[#EAECF0] bg-white p-5 shadow-xs">
            <h2 className="text-base font-semibold text-[#101828]">{t("aiTitle")}</h2>
            <p className="mt-1 text-xs text-[#667085]">
              {t("aiSubtitle")} · {report.ai.model}
            </p>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div>
                <h3 className="text-sm font-semibold text-[#6941C6]">{t("webApps")}</h3>
                <ul className="mt-2 list-inside list-disc space-y-1.5 text-sm text-[#475467]">
                  {report.ai.webApplicationIdeas.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#6941C6]">{t("automation")}</h3>
                <ul className="mt-2 list-inside list-disc space-y-1.5 text-sm text-[#475467]">
                  {report.ai.automationOpportunities.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-semibold text-[#6941C6]">{t("processes")}</h3>
              <ul className="mt-2 list-inside list-disc space-y-1.5 text-sm text-[#475467]">
                {report.ai.processImprovements.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="rounded-xl border border-[#D6BBFB] bg-[#F9F5FF] p-5 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-[#101828]">{t("emailDraft")}</h2>
              <button
                type="button"
                onClick={copyEmail}
                className="rounded-lg border border-[#D6BBFB] bg-white px-3 py-1.5 text-xs font-semibold text-[#6941C6] hover:bg-[#F4EBFF]"
              >
                {copied ? t("copied") : t("copyEmail")}
              </button>
            </div>
            <pre className="mt-4 whitespace-pre-wrap rounded-lg border border-[#EAECF0] bg-white p-4 font-sans text-sm leading-relaxed text-[#344054]">
              {report.ai.proposalEmailDraft}
            </pre>
          </div>

          <p className="text-xs text-[#98A2B3]">
            {t("generatedAt")}: {new Date(report.generatedAt).toLocaleString()}
          </p>
        </>
      )}
    </div>
  );
}
