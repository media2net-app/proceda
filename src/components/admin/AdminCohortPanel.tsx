"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useAdminVertical } from "@/context/AdminVerticalContext";
import type { CohortRow } from "@/lib/outreach/outreach-cohort-stats";

export function AdminCohortPanel() {
  const t = useTranslations("adminCohort");
  const { vertical } = useAdminVertical();
  const [rows, setRows] = useState<CohortRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/outreach/cohorts?branch=${encodeURIComponent(vertical)}`,
        { cache: "no-store" },
      );
      if (res.ok) {
        const data = (await res.json()) as { cohorts: CohortRow[] };
        setRows(data.cohorts ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [vertical]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading && rows.length === 0) {
    return <div className="h-24 animate-pulse rounded-xl bg-[#F2F4F7]" />;
  }

  if (rows.length === 0) {
    return (
      <section className="rounded-xl border border-dashed border-[#D0D5DD] bg-[#F9FAFB] p-5">
        <h2 className="text-lg font-semibold text-[#101828]">{t("title")}</h2>
        <p className="mt-1 text-sm text-[#667085]">{t("empty")}</p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-[#EAECF0] bg-white p-5 shadow-xs">
      <h2 className="text-lg font-semibold text-[#101828]">{t("title")}</h2>
      <p className="mt-1 text-sm text-[#667085]">{t("subtitle")}</p>
      <div className="table-scroll mt-4">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className="text-xs uppercase text-[#667085]">
            <tr>
              <th className="pb-2 pr-4">{t("colBatch")}</th>
              <th className="pb-2 pr-4">{t("colSent")}</th>
              <th className="pb-2 pr-4">{t("colOpen")}</th>
              <th className="pb-2 pr-4">{t("colBooked")}</th>
              <th className="pb-2 pr-4">{t("colWon")}</th>
              <th className="pb-2">{t("colBookRate")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EAECF0]">
            {rows.map((row) => (
              <tr key={row.sendBatch} className="text-[#344054]">
                <td className="py-2 pr-4 font-mono text-xs">{row.sendBatch}</td>
                <td className="py-2 pr-4 tabular-nums">{row.sent}</td>
                <td className="py-2 pr-4 tabular-nums">
                  {row.opened}{" "}
                  <span className="text-[#98A2B3]">({row.openRate}%)</span>
                </td>
                <td className="py-2 pr-4 tabular-nums">{row.booked}</td>
                <td className="py-2 pr-4 tabular-nums text-[#027A48]">
                  {row.won}
                </td>
                <td className="py-2 tabular-nums font-semibold text-[#6941C6]">
                  {row.bookRate}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
