"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useAdminVertical } from "@/context/AdminVerticalContext";

type WaitlistRow = {
  id: string;
  email: string;
  companyName?: string;
  locale: string;
  createdAt: string;
};

export function AdminWaitlistPanel() {
  const t = useTranslations("adminWaitlist");
  const { vertical } = useAdminVertical();
  const [rows, setRows] = useState<WaitlistRow[]>([]);

  const load = useCallback(async () => {
    const res = await fetch(
      `/api/admin/outreach/waitlist?branch=${encodeURIComponent(vertical)}&limit=30`,
      { cache: "no-store" },
    );
    if (res.ok) {
      const data = (await res.json()) as { entries: WaitlistRow[] };
      setRows(data.entries ?? []);
    }
  }, [vertical]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section className="rounded-xl border border-[#EAECF0] bg-white p-5 shadow-xs">
      <h2 className="text-lg font-semibold text-[#101828]">{t("title")}</h2>
      <p className="mt-1 text-sm text-[#667085]">{t("subtitle", { count: rows.length })}</p>
      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-[#98A2B3]">{t("empty")}</p>
      ) : (
        <div className="table-scroll mt-4">
          <table className="w-full min-w-[400px] text-left text-sm">
            <thead className="text-xs uppercase text-[#667085]">
              <tr>
                <th className="pb-2 pr-3">{t("colEmail")}</th>
                <th className="pb-2 pr-3">{t("colCompany")}</th>
                <th className="pb-2">{t("colDate")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAECF0]">
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="py-2 pr-3 font-medium text-[#101828]">{row.email}</td>
                  <td className="py-2 pr-3 text-[#667085]">{row.companyName ?? "—"}</td>
                  <td className="py-2 text-xs text-[#98A2B3]">
                    {new Date(row.createdAt).toLocaleDateString("nl-NL")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
