"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useAdminVertical } from "@/context/AdminVerticalContext";

type DueItem = {
  businessId: string;
  businessName: string;
  email: string;
  sequenceStep: number;
  sequenceNextAt: string;
};

type RunResult = {
  processed: number;
  sent: number;
  skipped: number;
  failed: number;
};

export function AdminSequencePanel() {
  const t = useTranslations("adminSequence");
  const locale = useLocale();
  const { vertical } = useAdminVertical();
  const [due, setDue] = useState<DueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/outreach/sequences?branch=${encodeURIComponent(vertical)}`,
        { cache: "no-store" },
      );
      if (res.ok) {
        const data = (await res.json()) as { due: DueItem[] };
        setDue(data.due ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [vertical]);

  useEffect(() => {
    void load();
  }, [load]);

  async function runSequences(dryRun: boolean) {
    setRunning(true);
    setResult(null);
    try {
      const res = await fetch(
        `/api/admin/outreach/sequences?branch=${encodeURIComponent(vertical)}&locale=${locale}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dryRun }),
        },
      );
      const data = (await res.json()) as RunResult;
      if (res.ok) {
        setResult(data);
        await load();
      }
    } finally {
      setRunning(false);
    }
  }

  if (loading && due.length === 0) {
    return <div className="h-20 animate-pulse rounded-xl bg-[#F2F4F7]" />;
  }

  return (
    <section className="rounded-xl border border-[#EAECF0] bg-white p-5 shadow-xs">
      <h2 className="text-lg font-semibold text-[#101828]">{t("title")}</h2>
      <p className="mt-1 text-sm text-[#667085]">
        {t("subtitle", { count: due.length })}
      </p>

      {due.length > 0 ? (
        <ul className="mt-3 max-h-32 space-y-1 overflow-y-auto text-xs text-[#344054]">
          {due.slice(0, 8).map((item) => (
            <li key={item.businessId}>
              {item.businessName} · stap {item.sequenceStep} ·{" "}
              {new Date(item.sequenceNextAt).toLocaleDateString("nl-NL")}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-[#98A2B3]">{t("empty")}</p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={running || due.length === 0}
          onClick={() => void runSequences(true)}
          className="rounded-lg border border-[#D0D5DD] px-3 py-1.5 text-xs font-semibold text-[#344054] disabled:opacity-50"
        >
          {t("dryRun")}
        </button>
        <button
          type="button"
          disabled={running || due.length === 0}
          onClick={() => void runSequences(false)}
          className="rounded-lg bg-[#B54708] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
        >
          {running ? t("running") : t("runNow")}
        </button>
      </div>

      {result ? (
        <p className="mt-2 text-xs text-[#667085]">
          {t("result", {
            sent: result.sent,
            skipped: result.skipped,
            failed: result.failed,
          })}
        </p>
      ) : null}
    </section>
  );
}
