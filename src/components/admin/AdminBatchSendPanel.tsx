"use client";

import { useCallback, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useAdminVertical } from "@/context/AdminVerticalContext";

type BatchResult = {
  queued: number;
  sent: number;
  skipped: number;
  failed: number;
  dryRun: boolean;
};

export function AdminBatchSendPanel() {
  const t = useTranslations("adminBatchSend");
  const locale = useLocale();
  const { vertical } = useAdminVertical();
  const [limit, setLimit] = useState(50);
  const [delayMs, setDelayMs] = useState(2500);
  const [maxPerDomain, setMaxPerDomain] = useState(2);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<BatchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (dryRun: boolean) => {
      setRunning(true);
      setError(null);
      setResult(null);
      try {
        const res = await fetch(
          `/api/admin/outreach/batch-send?branch=${encodeURIComponent(vertical)}&locale=${locale}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ limit, delayMs, maxPerDomain, dryRun, abTest: true }),
          },
        );
        const data = (await res.json()) as BatchResult & { error?: string };
        if (!res.ok) {
          setError(data.error ?? t("error"));
          return;
        }
        setResult(data);
      } catch {
        setError(t("error"));
      } finally {
        setRunning(false);
      }
    },
    [vertical, locale, limit, delayMs, maxPerDomain, t],
  );

  return (
    <section className="rounded-xl border border-[#EAECF0] bg-white p-5 shadow-xs">
      <h2 className="text-lg font-semibold text-[#101828]">{t("title")}</h2>
      <p className="mt-1 text-sm text-[#667085]">{t("subtitle")}</p>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label className="text-xs text-[#667085]">
          {t("limit")}
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="mt-1 block rounded-lg border border-[#D0D5DD] px-2 py-1.5 text-sm"
          >
            <option value={10}>10</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </label>
        <label className="text-xs text-[#667085]">
          {t("delay")}
          <input
            type="number"
            min={500}
            step={500}
            value={delayMs}
            onChange={(e) => setDelayMs(Number(e.target.value))}
            className="mt-1 block w-24 rounded-lg border border-[#D0D5DD] px-2 py-1.5 text-sm"
          />
        </label>
        <label className="text-xs text-[#667085]">
          {t("maxPerDomain")}
          <input
            type="number"
            min={1}
            max={10}
            value={maxPerDomain}
            onChange={(e) => setMaxPerDomain(Number(e.target.value))}
            className="mt-1 block w-16 rounded-lg border border-[#D0D5DD] px-2 py-1.5 text-sm"
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={running}
          onClick={() => void run(true)}
          className="rounded-lg border border-[#D0D5DD] bg-white px-4 py-2 text-sm font-semibold text-[#344054] hover:bg-[#F9FAFB] disabled:opacity-60"
        >
          {running ? t("running") : t("dryRun")}
        </button>
        <button
          type="button"
          disabled={running}
          onClick={() => void run(false)}
          className="rounded-lg bg-[#7F56D9] px-4 py-2 text-sm font-semibold text-white hover:bg-[#6941C6] disabled:opacity-60"
        >
          {running ? t("running") : t("sendBatch")}
        </button>
      </div>

      {error ? <p className="mt-3 text-sm text-[#B42318]">{error}</p> : null}
      {result ? (
        <p className="mt-3 text-sm text-[#344054]">
          {result.dryRun ? t("dryRunResult", { n: result.queued }) : t("result", {
            sent: result.sent,
            skipped: result.skipped,
            failed: result.failed,
          })}
        </p>
      ) : null}
    </section>
  );
}
