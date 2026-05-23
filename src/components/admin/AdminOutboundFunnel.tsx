"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useAdminVertical } from "@/context/AdminVerticalContext";
import type { OutreachFunnelStats } from "@/lib/outreach/outreach-funnel-stats";

export function AdminOutboundFunnel() {
  const t = useTranslations("adminFunnel");
  const locale = useLocale();
  const { vertical } = useAdminVertical();
  const [data, setData] = useState<OutreachFunnelStats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/outreach/funnel?branch=${encodeURIComponent(vertical)}&locale=${locale}`,
        { cache: "no-store" },
      );
      if (res.ok) setData((await res.json()) as OutreachFunnelStats);
    } finally {
      setLoading(false);
    }
  }, [vertical, locale]);

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), 60_000);
    return () => clearInterval(id);
  }, [load]);

  if (loading && !data) {
    return (
      <div className="h-24 animate-pulse rounded-xl bg-[#F2F4F7]" />
    );
  }

  if (!data) return null;

  return (
    <section className="rounded-xl border border-[#EAECF0] bg-white p-5 shadow-xs">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-[#101828]">{t("title")}</h2>
          <p className="mt-1 text-sm text-[#667085]">{t("subtitle")}</p>
        </div>
        <p className="text-xs text-[#98A2B3]">
          {t("sentToBooked", { rate: data.rates.sentToBooked })}
        </p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        {data.steps.map((step) => (
          <div
            key={step.id}
            className="rounded-lg border border-[#EAECF0] bg-[#F9FAFB] px-3 py-3"
          >
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#98A2B3]">
              {step.label}
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-[#101828]">
              {step.count}
            </p>
            {step.rateFromSent != null && step.id !== "demo_ready" && step.id !== "draft" ? (
              <p className="mt-0.5 text-[10px] text-[#667085]">
                {t("ofSent", { rate: step.rateFromSent })}
              </p>
            ) : step.rateFromPrev != null ? (
              <p className="mt-0.5 text-[10px] text-[#667085]">
                {t("ofPrev", { rate: step.rateFromPrev })}
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
