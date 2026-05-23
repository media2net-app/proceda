"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useAdminVertical } from "@/context/AdminVerticalContext";

type UtmRow = {
  utmCampaign: string;
  sessions: number;
  bookingActive: number;
  mailTokens: number;
};

type ReplyStats = {
  sent: number;
  replies: number;
  replyRate: number;
  medianResponseHours: number | null;
};

export function AdminUtmPanel() {
  const t = useTranslations("adminUtm");
  const { vertical } = useAdminVertical();
  const [rows, setRows] = useState<UtmRow[]>([]);
  const [reply, setReply] = useState<ReplyStats | null>(null);

  const load = useCallback(async () => {
    const [utmRes, replyRes] = await Promise.all([
      fetch(`/api/admin/outreach/utm-stats?branch=${encodeURIComponent(vertical)}`, {
        cache: "no-store",
      }),
      fetch(`/api/admin/outreach/reply-stats?branch=${encodeURIComponent(vertical)}`, {
        cache: "no-store",
      }),
    ]);
    if (utmRes.ok) {
      const data = (await utmRes.json()) as { rows: UtmRow[] };
      setRows(data.rows ?? []);
    }
    if (replyRes.ok) setReply((await replyRes.json()) as ReplyStats);
  }, [vertical]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section className="rounded-xl border border-[#EAECF0] bg-white p-5 shadow-xs">
      <h2 className="text-lg font-semibold text-[#101828]">{t("title")}</h2>
      {reply ? (
        <p className="mt-1 text-sm text-[#667085]">
          {t("replyRate", {
            rate: reply.replyRate,
            replies: reply.replies,
            sent: reply.sent,
          })}
        </p>
      ) : null}
      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-[#98A2B3]">{t("empty")}</p>
      ) : (
        <div className="table-scroll mt-4">
          <table className="w-full min-w-[400px] text-left text-sm">
            <thead className="text-xs uppercase text-[#667085]">
              <tr>
                <th className="pb-2 pr-3">{t("colCampaign")}</th>
                <th className="pb-2 pr-3">{t("colSessions")}</th>
                <th className="pb-2">{t("colEngaged")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAECF0]">
              {rows.map((row) => (
                <tr key={row.utmCampaign}>
                  <td className="py-2 pr-3 font-mono text-xs">{row.utmCampaign}</td>
                  <td className="py-2 pr-3 tabular-nums">{row.sessions}</td>
                  <td className="py-2 tabular-nums">{row.bookingActive}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
