"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type { LeadTimeline } from "@/lib/outreach/lead-timeline";
import type { OutreachPipelineStatus } from "@/lib/mail/types";

const PIPELINE_OPTIONS: OutreachPipelineStatus[] = [
  "lead",
  "contacted",
  "meeting",
  "proposal",
  "won",
  "lost",
];

export function AdminLeadTimeline({ businessId }: { businessId: string }) {
  const t = useTranslations("adminLeadTimeline");
  const [data, setData] = useState<LeadTimeline | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/outreach/lead/${encodeURIComponent(businessId)}/timeline`,
        { cache: "no-store" },
      );
      if (res.ok) setData((await res.json()) as LeadTimeline);
      else setData(null);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function updatePipeline(status: OutreachPipelineStatus) {
    setSaving(true);
    try {
      const res = await fetch(
        `/api/admin/outreach/lead/${encodeURIComponent(businessId)}/pipeline`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pipelineStatus: status }),
        },
      );
      if (res.ok) await load();
    } finally {
      setSaving(false);
    }
  }

  if (loading && !data) {
    return (
      <div className="mt-4 h-20 animate-pulse rounded-lg bg-[#F2F4F7]" />
    );
  }

  if (!data) return null;

  return (
    <div className="mt-4 rounded-lg border border-[#EAECF0] bg-[#F9FAFB] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-[#101828]">{t("title")}</h3>
        <label className="flex items-center gap-2 text-xs text-[#667085]">
          {t("pipeline")}
          <select
            value={data.pipelineStatus}
            disabled={saving}
            onChange={(e) =>
              void updatePipeline(e.target.value as OutreachPipelineStatus)
            }
            className="rounded-lg border border-[#D0D5DD] bg-white px-2 py-1.5 text-xs font-semibold text-[#344054]"
          >
            {PIPELINE_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {t(`pipeline_${s}`)}
              </option>
            ))}
          </select>
        </label>
      </div>
      {data.sendBatch ? (
        <p className="mt-1 text-[10px] text-[#98A2B3]">
          {t("batch", { id: data.sendBatch })}
        </p>
      ) : null}
      {data.entries.length === 0 ? (
        <p className="mt-3 text-xs text-[#98A2B3]">{t("empty")}</p>
      ) : (
        <ol className="scroll-touch mt-3 max-h-48 space-y-2 overflow-y-auto">
          {data.entries.map((entry) => (
            <li
              key={entry.id}
              className="flex gap-2 border-l-2 border-[#D6BBFB] pl-3 text-xs"
            >
              <time className="shrink-0 tabular-nums text-[#98A2B3]">
                {new Date(entry.at).toLocaleString("nl-NL", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </time>
              <span className="min-w-0 text-[#344054]">
                <span className="font-medium text-[#101828]">{entry.label}</span>
                {entry.detail ? (
                  <span className="block truncate text-[#667085]">
                    {entry.detail}
                  </span>
                ) : null}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
