"use client";

import { Link } from "@/i18n/navigation";
import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { hasAutoMailerContact, hasCallListContact } from "@/lib/bedrijven/contact-utils";
import type { ScrapeBranchId } from "@/lib/bedrijven/branches";
import type { AdminKpiStats } from "@/lib/bedrijven/kpi-stats";
import type { Bedrijf } from "@/lib/bedrijven/types";

function KpiTile({
  label,
  value,
  sub,
  accent = false,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`min-w-[140px] flex-1 rounded-xl border p-4 shadow-xs ${
        accent
          ? "border-[#D6BBFB] bg-gradient-to-br from-[#F9F5FF] to-white"
          : "border-[#EAECF0] bg-white"
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-[#667085]">{label}</p>
      <p
        className={`mt-1 text-2xl font-bold tabular-nums ${
          accent ? "text-[#7F56D9]" : "text-[#101828]"
        }`}
      >
        {value}
      </p>
      {sub && <p className="mt-1 text-xs text-[#667085]">{sub}</p>}
    </div>
  );
}

function pct(part: number, total: number): string {
  if (total <= 0) return "0%";
  return `${Math.round((part / total) * 1000) / 10}%`;
}

type Props = {
  businesses: Bedrijf[];
  branchId: ScrapeBranchId;
  showNational: boolean;
};

export function BusinessesOutreachKpi({
  businesses,
  branchId,
  showNational,
}: Props) {
  const t = useTranslations("adminBusinesses");
  const [national, setNational] = useState<AdminKpiStats | null>(null);
  const [mailConfigured, setMailConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    if (!showNational) {
      setNational(null);
      return;
    }
    const q = new URLSearchParams({ branch: branchId });
    fetch(`/api/bedrijven/kpi?${q}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setNational(data as AdminKpiStats));
  }, [showNational, branchId]);

  useEffect(() => {
    fetch("/api/mail/status")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setMailConfigured(!!data?.configured));
  }, []);

  const local = useMemo(() => {
    let withEmail = 0;
    let withPhone = 0;
    for (const b of businesses) {
      if (hasAutoMailerContact(b)) withEmail++;
      if (hasCallListContact(b)) withPhone++;
    }
    return { total: businesses.length, withEmail, withPhone };
  }, [businesses]);

  const total = showNational && national ? national.totalBusinesses : local.total;
  const withEmail =
    showNational && national ? national.outreach.withEmail : local.withEmail;
  const withPhone =
    showNational && national ? national.outreach.withPhone : local.withPhone;
  const autoMailer =
    showNational && national
      ? national.outreach.autoMailerQualified
      : local.withEmail;
  const noChannel =
    showNational && national ? national.outreach.noOutreachChannel : null;

  return (
    <div className="mb-6 rounded-xl border border-[#D6BBFB] bg-gradient-to-br from-[#F9F5FF]/80 to-white p-5 shadow-xs">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-[#101828]">{t("outreachTitle")}</h2>
          <p className="mt-1 text-sm text-[#667085]">{t("outreachSubtitle")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {mailConfigured !== null && (
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                mailConfigured
                  ? "bg-[#ECFDF3] text-[#027A48]"
                  : "bg-[#FFF4ED] text-[#C4320A]"
              }`}
            >
              {mailConfigured ? t("smtpReady") : t("smtpMissing")}
            </span>
          )}
          <Link
            href="/dashboard-admin/mail"
            className="rounded-lg bg-[#7F56D9] px-3 py-1.5 text-sm font-semibold text-white shadow-xs hover:bg-[#6941C6]"
          >
            {t("openMail")} →
          </Link>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <KpiTile label={t("kpiTotal")} value={total.toLocaleString("nl-NL")} />
        <KpiTile
          accent
          label={t("kpiWithEmail")}
          value={withEmail.toLocaleString("nl-NL")}
          sub={t("kpiWithEmailSub", {
            pct: pct(withEmail, total),
            total: total.toLocaleString("nl-NL"),
          })}
        />
        <KpiTile
          label={t("kpiAutoMailer")}
          value={autoMailer.toLocaleString("nl-NL")}
          sub={t("kpiAutoMailerSub")}
        />
        <KpiTile
          label={t("kpiWithPhone")}
          value={withPhone.toLocaleString("nl-NL")}
          sub={t("kpiWithPhoneSub", { pct: pct(withPhone, total) })}
        />
        {noChannel != null && noChannel > 0 && (
          <KpiTile
            label={t("kpiNoContact")}
            value={noChannel.toLocaleString("nl-NL")}
            sub={t("kpiNoContactSub")}
          />
        )}
      </div>

      <p className="mt-3 text-xs text-[#667085]">{t("outreachMailNote")}</p>
    </div>
  );
}
