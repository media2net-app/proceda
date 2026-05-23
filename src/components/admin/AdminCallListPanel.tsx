"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useAdminVertical } from "@/context/AdminVerticalContext";
import type { CallListEntry } from "@/lib/outreach/outreach-call-list";

export function AdminCallListPanel() {
  const t = useTranslations("adminCallList");
  const locale = useLocale();
  const { vertical } = useAdminVertical();
  const [entries, setEntries] = useState<CallListEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/outreach/call-list?branch=${encodeURIComponent(vertical)}&locale=${locale}`,
        { cache: "no-store" },
      );
      if (res.ok) {
        const data = (await res.json()) as { entries: CallListEntry[] };
        setEntries(data.entries ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [vertical, locale]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading && entries.length === 0) {
    return <div className="h-24 animate-pulse rounded-xl bg-[#F2F4F7]" />;
  }

  return (
    <section className="rounded-xl border border-[#EAECF0] bg-white p-5 shadow-xs">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-[#101828]">{t("title")}</h2>
          <p className="mt-1 text-sm text-[#667085]">{t("subtitle")}</p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-lg border border-[#D0D5DD] px-3 py-1.5 text-xs font-semibold text-[#344054]"
        >
          {t("refresh")}
        </button>
      </div>

      {entries.length === 0 ? (
        <p className="mt-4 text-sm text-[#667085]">{t("empty")}</p>
      ) : (
        <ul className="scroll-touch mt-4 max-h-64 space-y-2 overflow-y-auto">
          {entries.map((e) => (
            <li
              key={e.businessId}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#EAECF0] bg-[#F9FAFB] px-3 py-2 text-sm"
            >
              <div>
                <span className="font-semibold text-[#101828]">{e.businessName}</span>
                <span className="ml-2 text-xs text-[#667085]">{e.city}</span>
                {e.leadQuality === "hot" ? (
                  <span className="ml-2 rounded-full bg-[#FEF3F2] px-1.5 py-0.5 text-[10px] font-bold text-[#B42318]">
                    HOT
                  </span>
                ) : null}
              </div>
              <a
                href={`tel:${e.phone}`}
                className="shrink-0 rounded-lg bg-[#7F56D9] px-3 py-1 text-xs font-semibold text-white"
              >
                {e.phone}
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
