"use client";

import { Link } from "@/i18n/navigation";
import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useAdminVertical } from "@/context/AdminVerticalContext";
import type { OutreachBranchId } from "@/lib/bedrijven/outreach-branches";

type VerticalSummary = {
  id: OutreachBranchId;
  name: string;
  businessCount: number;
  withEmail: number;
  demoReady: number;
  mail: {
    concept: number;
    sent: number;
    booked: number;
    followupReady: number;
    demoClicked: number;
  };
};

export function AdminVerticalHub() {
  const t = useTranslations("adminVertical");
  const { vertical, setVertical } = useAdminVertical();
  const [rows, setRows] = useState<VerticalSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/verticals");
      if (res.ok) {
        const data = (await res.json()) as { branches: VerticalSummary[] };
        setRows(data.branches ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, [load]);

  if (loading && rows.length === 0) {
    return (
      <p className="text-sm text-[#667085]">{t("loading")}</p>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-[#101828]">{t("hubTitle")}</h2>
        <p className="mt-1 text-sm text-[#667085]">{t("hubSubtitle")}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {rows.map((row) => {
          const active = vertical === row.id;
          return (
            <div
              key={row.id}
              className={`rounded-xl border p-5 shadow-xs transition ${
                active
                  ? "border-[#7F56D9] bg-[#F9F5FF] ring-1 ring-[#7F56D9]/25"
                  : "border-[#EAECF0] bg-white"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-[#101828]">{row.name}</h3>
                  {row.id === "installatie" && (
                    <span className="mt-1 inline-block rounded-full bg-[#FFFAEB] px-2 py-0.5 text-[10px] font-semibold text-[#B54708]">
                      {t("pilot")}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setVertical(row.id)}
                  className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold ${
                    active
                      ? "bg-[#7F56D9] text-white"
                      : "border border-[#D0D5DD] bg-white text-[#344054] hover:bg-[#F9FAFB]"
                  }`}
                >
                  {active ? t("active") : t("select")}
                </button>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-[#667085]">{t("businesses")}</dt>
                  <dd className="font-semibold tabular-nums text-[#101828]">
                    {row.businessCount}
                  </dd>
                </div>
                <div>
                  <dt className="text-[#667085]">{t("withEmail")}</dt>
                  <dd className="font-semibold tabular-nums text-[#101828]">
                    {row.withEmail}
                  </dd>
                </div>
                <div>
                  <dt className="text-[#667085]">{t("demoReady")}</dt>
                  <dd className="font-semibold tabular-nums text-[#101828]">
                    {row.demoReady}
                  </dd>
                </div>
                <div>
                  <dt className="text-[#667085]">{t("mailConcept")}</dt>
                  <dd className="font-semibold tabular-nums text-[#101828]">
                    {row.mail.concept}
                  </dd>
                </div>
                <div>
                  <dt className="text-[#667085]">{t("mailSent")}</dt>
                  <dd className="font-semibold tabular-nums text-[#101828]">
                    {row.mail.sent}
                  </dd>
                </div>
                <div>
                  <dt className="text-[#667085]">{t("followupReady")}</dt>
                  <dd className="font-semibold tabular-nums text-[#B54708]">
                    {row.mail.followupReady}
                  </dd>
                </div>
              </dl>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href="/dashboard-admin/bedrijven"
                  className="rounded-lg border border-[#D6BBFB] bg-white px-3 py-1.5 text-xs font-semibold text-[#6941C6] hover:bg-[#F4EBFF]"
                >
                  {t("goBedrijven")}
                </Link>
                <Link
                  href="/dashboard-admin/mail"
                  className="rounded-lg border border-[#D6BBFB] bg-white px-3 py-1.5 text-xs font-semibold text-[#6941C6] hover:bg-[#F4EBFF]"
                >
                  {t("goMail")}
                </Link>
                <Link
                  href="/dashboard-admin/huisstijl"
                  className="rounded-lg border border-[#D0D5DD] bg-white px-3 py-1.5 text-xs font-semibold text-[#344054] hover:bg-[#F9FAFB]"
                >
                  {t("goHuisstijl")}
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
