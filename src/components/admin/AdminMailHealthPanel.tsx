"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useAdminVertical } from "@/context/AdminVerticalContext";
import type { MailHealthReport } from "@/lib/mail/mail-health";

export function AdminMailHealthPanel() {
  const t = useTranslations("adminMailHealth");
  const { vertical } = useAdminVertical();
  const [data, setData] = useState<MailHealthReport | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(
      `/api/admin/outreach/mail-health?branch=${encodeURIComponent(vertical)}`,
      { cache: "no-store" },
    );
    if (res.ok) setData((await res.json()) as MailHealthReport);
  }, [vertical]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!data) {
    return <div className="h-24 animate-pulse rounded-xl bg-[#F2F4F7]" />;
  }

  return (
    <section className="rounded-xl border border-[#EAECF0] bg-white p-5 shadow-xs">
      <h2 className="text-lg font-semibold text-[#101828]">{t("title")}</h2>
      <p className="mt-1 text-sm text-[#667085]">
        {t("subtitle", {
          sent: data.sentToday,
          cap: data.dailyCap,
          domain: data.fromDomain ?? "—",
        })}
      </p>
      <ul className="mt-4 space-y-2">
        {data.checklist.map((item) => (
          <li
            key={item.id}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
              item.ok ? "bg-[#ECFDF3] text-[#027A48]" : "bg-[#FFFAEB] text-[#B54708]"
            }`}
          >
            <span>{item.ok ? "✓" : "!"}</span>
            {item.label}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-[#98A2B3]">{data.dns.dkimHint}</p>
      {data.recentBounces.length > 0 ? (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase text-[#667085]">{t("recentBounces")}</p>
          <ul className="mt-2 space-y-1 text-xs text-[#344054]">
            {data.recentBounces.map((b) => (
              <li key={`${b.email}-${b.createdAt}`} className="rounded-lg bg-[#FEF3F2] px-2 py-1.5">
                <span className="font-medium">{b.email}</span>
                {b.reason ? (
                  <span className="text-[#B42318]"> · {b.reason.slice(0, 60)}</span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
