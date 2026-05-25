"use client";

import { useMemo } from "react";
import { Link } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  DEFAULT_DEAL_VALUE_EUR,
  getSalesLeads,
  getSalesLeadsPipelineValueEur,
  salesLeadDemoAppPath,
  salesLeadDemoShareUrl,
  type SalesLead,
  type SalesLeadStatus,
} from "@/lib/admin/sales-leads";
import { useClipboard } from "@/hooks/use-clipboard";

function formatEur(value: number, locale: string) {
  return new Intl.NumberFormat(locale === "nl" ? "nl-NL" : "en-US", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

const STATUS_STYLE: Record<
  SalesLeadStatus,
  { bg: string; text: string; ring?: string }
> = {
  demo_ready_present: {
    bg: "bg-[#F4EBFF]",
    text: "text-[#6941C6]",
    ring: "ring-[#9E77ED]",
  },
  hot: { bg: "bg-[#FEF3F2]", text: "text-[#B42318]" },
  contacted: { bg: "bg-[#EFF8FF]", text: "text-[#175CD3]" },
  proposal: { bg: "bg-[#FFFAEB]", text: "text-[#B54708]" },
  won: { bg: "bg-[#ECFDF3]", text: "text-[#027A48]" },
  lost: { bg: "bg-[#F2F4F7]", text: "text-[#475467]" },
};

const QUALITY_STYLE = {
  hot: "bg-[#FEF3F2] text-[#B42318]",
  warm: "bg-[#FFFAEB] text-[#B54708]",
  cold: "bg-[#F2F4F7] text-[#475467]",
};

function StatusBadge({
  status,
  label,
}: {
  status: SalesLeadStatus;
  label: string;
}) {
  const s = STATUS_STYLE[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${s.bg} ${s.text} ${s.ring ?? "ring-transparent"}`}
    >
      {label}
    </span>
  );
}

function LeadDemoActions({
  lead,
  locale,
  t,
}: {
  lead: SalesLead;
  locale: string;
  t: ReturnType<typeof useTranslations<"adminLeads">>;
}) {
  const { copied, copy } = useClipboard();
  const demoPath = salesLeadDemoAppPath(locale, lead.demoSlug);
  const shareUrl = salesLeadDemoShareUrl(locale, lead.demoSlug);
  const justCopied = copied === lead.id || copied === true;

  return (
    <div className="flex min-w-[11rem] flex-col items-end gap-2">
      <Link
        href={demoPath}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full rounded-lg bg-[#7F56D9] px-3 py-2 text-center text-xs font-semibold text-white hover:bg-[#6941C6]"
      >
        {t("openDemo")}
      </Link>
      <button
        type="button"
        onClick={() => void copy(shareUrl, lead.id)}
        className={`w-full rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
          justCopied
            ? "border-[#ABEFC6] bg-[#ECFDF3] text-[#027A48]"
            : "border-[#D6BBFB] bg-[#F9F5FF] text-[#6941C6] hover:bg-[#F4EBFF]"
        }`}
      >
        {justCopied ? t("copiedDemoLink") : t("copyDemoLink")}
      </button>
      <p
        className="max-w-[14rem] truncate text-left text-[10px] text-[#98A2B3]"
        title={shareUrl}
      >
        {shareUrl}
      </p>
      <Link
        href="/dashboard-admin/mail"
        className="text-xs font-semibold text-[#6941C6] hover:underline"
      >
        {t("openMail")}
      </Link>
    </div>
  );
}

function LeadRow({
  lead,
  locale,
  t,
}: {
  lead: SalesLead;
  locale: string;
  t: ReturnType<typeof useTranslations<"adminLeads">>;
}) {
  const statusLabel = t(`status_${lead.status}`);
  const qualityLabel = t(`quality_${lead.quality}`);

  return (
    <tr className="hover:bg-[#F9FAFB]">
      <td className="px-4 py-4">
        <p className="font-semibold text-[#101828]">{lead.companyName}</p>
        {lead.contactName && (
          <p className="text-sm text-[#667085]">{lead.contactName}</p>
        )}
        {lead.email && (
          <a
            href={`mailto:${lead.email}`}
            className="text-sm text-[#6941C6] hover:underline"
          >
            {lead.email}
          </a>
        )}
      </td>
      <td className="px-4 py-4">
        <StatusBadge status={lead.status} label={statusLabel} />
        <p className="mt-2 text-xs text-[#667085]">{lead.nextAction}</p>
      </td>
      <td className="px-4 py-4">
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${QUALITY_STYLE[lead.quality]}`}
        >
          {qualityLabel}
        </span>
      </td>
      <td className="px-4 py-4 font-semibold text-[#101828]">
        {formatEur(lead.dealValueEur, locale)}
      </td>
      <td className="px-4 py-4 text-sm text-[#667085]">
        {t(`branch_${lead.branchId}`)}
      </td>
      <td className="px-4 py-4 text-right">
        <LeadDemoActions lead={lead} locale={locale} t={t} />
      </td>
    </tr>
  );
}

export function AdminLeadsView() {
  const t = useTranslations("adminLeads");
  const locale = useLocale();
  const leads = useMemo(() => getSalesLeads(), []);
  const pipelineEur = useMemo(() => getSalesLeadsPipelineValueEur(leads), [leads]);
  const presentCount = leads.filter(
    (l) => l.status === "demo_ready_present",
  ).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-[#101828]">{t("title")}</h1>
        <p className="mt-1 text-sm text-[#667085]">{t("subtitle")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-[#EAECF0] bg-white p-4 shadow-xs">
          <p className="text-sm font-medium text-[#667085]">{t("kpiTotal")}</p>
          <p className="mt-1 text-2xl font-semibold text-[#101828]">
            {leads.length}
          </p>
        </div>
        <div className="rounded-xl border border-[#D6BBFB] bg-[#F9F5FF] p-4 shadow-xs">
          <p className="text-sm font-medium text-[#6941C6]">{t("kpiPresent")}</p>
          <p className="mt-1 text-2xl font-semibold text-[#6941C6]">
            {presentCount}
          </p>
          <p className="mt-1 text-xs text-[#7F56D9]">{t("kpiPresentSub")}</p>
        </div>
        <div className="rounded-xl border border-[#EAECF0] bg-white p-4 shadow-xs">
          <p className="text-sm font-medium text-[#667085]">{t("kpiPipeline")}</p>
          <p className="mt-1 text-2xl font-semibold text-[#101828]">
            {formatEur(pipelineEur, locale)}
          </p>
          <p className="mt-1 text-xs text-[#667085]">
            {t("kpiPipelineSub", { deal: formatEur(DEFAULT_DEAL_VALUE_EUR, locale) })}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#EAECF0] bg-white shadow-xs">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-[#F9FAFB] text-xs font-semibold uppercase text-[#667085]">
            <tr>
              <th className="px-4 py-3">{t("colCompany")}</th>
              <th className="px-4 py-3">{t("colStatus")}</th>
              <th className="px-4 py-3">{t("colQuality")}</th>
              <th className="px-4 py-3">{t("colValue")}</th>
              <th className="px-4 py-3">{t("colBranch")}</th>
              <th className="px-4 py-3 text-right">{t("colActions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EAECF0]">
            {leads.map((lead) => (
              <LeadRow key={lead.id} lead={lead} locale={locale} t={t} />
            ))}
          </tbody>
        </table>
      </div>

      {leads[0]?.notes && (
        <section className="rounded-xl border border-[#EAECF0] bg-[#F9FAFB] p-5">
          <h2 className="text-sm font-semibold text-[#101828]">
            {t("notesTitle", { company: leads[0].companyName })}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#344054]">
            {leads[0].notes}
          </p>
        </section>
      )}
    </div>
  );
}
