"use client";

import { Link } from "@/i18n/navigation";
import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useAdminVertical } from "@/context/AdminVerticalContext";
import type { OutreachActionQueue } from "@/lib/outreach/outreach-action-queue";

const typeStyles: Record<
  OutreachActionQueue["items"][0]["type"],
  string
> = {
  followup: "bg-[#F9F5FF] text-[#6941C6] border-[#D6BBFB]",
  call: "bg-[#FFFAEB] text-[#B54708] border-[#FEDF89]",
  reply: "bg-[#ECFDF3] text-[#027A48] border-[#ABEFC6]",
  post_call: "bg-[#EFF8FF] text-[#175CD3] border-[#B2DDFF]",
};

export function AdminActionQueue() {
  const t = useTranslations("adminActions");
  const locale = useLocale();
  const { vertical } = useAdminVertical();
  const [data, setData] = useState<OutreachActionQueue | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/outreach/actions?branch=${encodeURIComponent(vertical)}&locale=${locale}`,
        { cache: "no-store" },
      );
      if (res.ok) setData((await res.json()) as OutreachActionQueue);
    } finally {
      setLoading(false);
    }
  }, [vertical, locale]);

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), 90_000);
    return () => clearInterval(id);
  }, [load]);

  if (loading && !data) {
    return (
      <div className="h-32 animate-pulse rounded-xl bg-[#F2F4F7]" />
    );
  }

  if (!data) return null;

  const total =
    data.counts.followup +
    data.counts.call +
    data.counts.reply +
    data.counts.post_call;

  return (
    <section className="rounded-xl border border-[#EAECF0] bg-white p-5 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-[#101828]">{t("title")}</h2>
          <p className="mt-1 text-sm text-[#667085]">
            {total === 0 ? t("empty") : t("subtitle", { count: total })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border border-[#D6BBFB] bg-[#F9F5FF] px-2 py-0.5 font-semibold text-[#6941C6]">
            {t("countFollowup", { n: data.counts.followup })}
          </span>
          <span className="rounded-full border border-[#FEDF89] bg-[#FFFAEB] px-2 py-0.5 font-semibold text-[#B54708]">
            {t("countCall", { n: data.counts.call })}
          </span>
          <span className="rounded-full border border-[#ABEFC6] bg-[#ECFDF3] px-2 py-0.5 font-semibold text-[#027A48]">
            {t("countReply", { n: data.counts.reply })}
          </span>
        </div>
      </div>

      {data.items.length === 0 ? (
        <p className="mt-4 text-sm text-[#98A2B3]">{t("allClear")}</p>
      ) : (
        <ul className="mt-4 max-h-64 space-y-2 overflow-y-auto">
          {data.items.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                className="flex items-start gap-3 rounded-lg border border-[#EAECF0] bg-[#F9FAFB] px-3 py-2.5 transition hover:border-[#D6BBFB] hover:bg-[#F9F5FF]"
              >
                <span
                  className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${typeStyles[item.type]}`}
                >
                  {t(`type_${item.type}`)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-[#101828]">
                    {item.businessName}
                  </span>
                  <span className="block text-xs text-[#667085]">{item.reason}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
