"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useAdminVertical } from "@/context/AdminVerticalContext";
import { AdminActionQueue } from "@/components/admin/AdminActionQueue";
import { AdminOutboundFunnel } from "@/components/admin/AdminOutboundFunnel";
import { AdminCohortPanel } from "@/components/admin/AdminCohortPanel";
import { AdminCallListPanel } from "@/components/admin/AdminCallListPanel";
import { AdminMailHealthPanel } from "@/components/admin/AdminMailHealthPanel";
import { AdminUtmPanel } from "@/components/admin/AdminUtmPanel";
import { AdminWaitlistPanel } from "@/components/admin/AdminWaitlistPanel";
import type { OutreachLeadScoreRow } from "@/lib/outreach/outreach-lead-score";

type LiveMini = {
  activeNow: number;
  bookingIntent: number;
  outreachVisitors: number;
};

type AuditEntry = {
  id: string;
  action: string;
  businessId?: string;
  createdAt: string;
};

function AdminLiveMini() {
  const t = useTranslations("adminCommandCenter");
  const [data, setData] = useState<LiveMini | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(
          "/api/admin/analytics/live?period=all&outreach=1",
          { cache: "no-store" },
        );
        if (!res.ok) return;
        const json = (await res.json()) as {
          visitorsNow?: number;
          bookingNow?: number;
          activeVisitors?: { leadName?: string | null; bookingActive?: boolean }[];
        };
        if (cancelled) return;
        setData({
          activeNow: json.visitorsNow ?? 0,
          bookingIntent: json.bookingNow ?? 0,
          outreachVisitors: json.activeVisitors?.filter((v) => v.leadName).length ?? 0,
        });
      } catch {
        /* ignore */
      }
    }
    void load();
    const id = setInterval(load, 8000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return (
    <section className="rounded-xl border border-[#EAECF0] bg-white p-5 shadow-xs">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-[#101828]">{t("liveTitle")}</h2>
          <p className="mt-1 text-sm text-[#667085]">{t("liveSubtitle")}</p>
        </div>
        <Link
          href="/dashboard-admin/live-view?period=all&outreach=1"
          className="text-xs font-semibold text-[#6941C6] hover:underline"
        >
          {t("liveOpen")} →
        </Link>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-[#F9FAFB] px-3 py-2 text-center">
          <p className="text-2xl font-bold tabular-nums text-[#101828]">
            {data?.activeNow ?? "—"}
          </p>
          <p className="text-[10px] uppercase text-[#98A2B3]">{t("liveActive")}</p>
        </div>
        <div className="rounded-lg bg-[#F9FAFB] px-3 py-2 text-center">
          <p className="text-2xl font-bold tabular-nums text-[#B54708]">
            {data?.outreachVisitors ?? "—"}
          </p>
          <p className="text-[10px] uppercase text-[#98A2B3]">{t("liveOutreach")}</p>
        </div>
        <div className="rounded-lg bg-[#F9FAFB] px-3 py-2 text-center">
          <p className="text-2xl font-bold tabular-nums text-[#6941C6]">
            {data?.bookingIntent ?? "—"}
          </p>
          <p className="text-[10px] uppercase text-[#98A2B3]">{t("liveBooking")}</p>
        </div>
      </div>
    </section>
  );
}

function AdminLeadScorePanel() {
  const t = useTranslations("adminCommandCenter");
  const locale = useLocale();
  const { vertical } = useAdminVertical();
  const [rows, setRows] = useState<OutreachLeadScoreRow[]>([]);

  const load = useCallback(async () => {
    const res = await fetch(
      `/api/admin/outreach/lead-scores?branch=${encodeURIComponent(vertical)}&locale=${locale}&limit=15`,
      { cache: "no-store" },
    );
    if (res.ok) {
      const data = (await res.json()) as { rows: OutreachLeadScoreRow[] };
      setRows(data.rows ?? []);
    }
  }, [vertical, locale]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section className="rounded-xl border border-[#EAECF0] bg-white p-5 shadow-xs">
      <h2 className="text-lg font-semibold text-[#101828]">{t("scoresTitle")}</h2>
      <p className="mt-1 text-sm text-[#667085]">{t("scoresSubtitle")}</p>
      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-[#98A2B3]">{t("scoresEmpty")}</p>
      ) : (
        <div className="table-scroll mt-4">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead className="text-xs uppercase text-[#667085]">
              <tr>
                <th className="pb-2 pr-3">{t("colLead")}</th>
                <th className="pb-2 pr-3">{t("colScore")}</th>
                <th className="pb-2 pr-3">{t("colSignals")}</th>
                <th className="pb-2">{t("colTouch")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAECF0]">
              {rows.map((row) => (
                <tr key={row.businessId}>
                  <td className="py-2 pr-3 font-medium text-[#101828]">
                    {row.businessName}
                  </td>
                  <td className="py-2 pr-3 tabular-nums font-bold text-[#6941C6]">
                    {row.outreachScore}
                  </td>
                  <td className="py-2 pr-3 text-xs text-[#667085]">
                    {row.signals.join(", ") || "—"}
                  </td>
                  <td className="py-2 text-xs text-[#98A2B3]">
                    {row.lastTouchAt
                      ? new Date(row.lastTouchAt).toLocaleDateString("nl-NL")
                      : "—"}
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

function AdminComplianceMini() {
  const t = useTranslations("adminCommandCenter");
  const { vertical } = useAdminVertical();
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [suppressed, setSuppressed] = useState(0);

  useEffect(() => {
    void (async () => {
      const [auditRes, supRes] = await Promise.all([
        fetch("/api/admin/outreach/compliance?view=audit", { cache: "no-store" }),
        fetch(
          `/api/admin/outreach/compliance?view=suppression&branch=${encodeURIComponent(vertical)}`,
          { cache: "no-store" },
        ),
      ]);
      if (auditRes.ok) {
        const data = (await auditRes.json()) as { entries: AuditEntry[] };
        setEntries(data.entries?.slice(0, 6) ?? []);
      }
      if (supRes.ok) {
        const data = (await supRes.json()) as { leads: unknown[] };
        setSuppressed(data.leads?.length ?? 0);
      }
    })();
  }, [vertical]);

  return (
    <section className="rounded-xl border border-[#EAECF0] bg-[#F9FAFB] p-5">
      <h2 className="text-lg font-semibold text-[#101828]">{t("complianceTitle")}</h2>
      <p className="mt-1 text-sm text-[#667085]">
        {t("suppressedCount", { count: suppressed })}
      </p>
      <ul className="mt-3 space-y-1 text-xs text-[#667085]">
        {entries.map((e) => (
          <li key={e.id}>
            {e.action}
            {e.businessId ? ` · ${e.businessId.slice(0, 8)}…` : ""} ·{" "}
            {new Date(e.createdAt).toLocaleString("nl-NL", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function AdminCommandCenter() {
  const t = useTranslations("adminCommandCenter");
  const { verticalLabel } = useAdminVertical();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-[#101828]">
          {t("title")} · {verticalLabel}
        </h1>
        <p className="mt-1 text-sm text-[#667085]">{t("subtitle")}</p>
      </div>

      <AdminActionQueue />

      <div className="grid gap-6 xl:grid-cols-2">
        <AdminOutboundFunnel />
        <AdminLiveMini />
      </div>

      <AdminCohortPanel />

      <div className="grid gap-6 lg:grid-cols-2">
        <AdminLeadScorePanel />
        <AdminCallListPanel />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <AdminMailHealthPanel />
        <AdminUtmPanel />
      </div>

      <AdminWaitlistPanel />

      <AdminComplianceMini />
    </div>
  );
}
