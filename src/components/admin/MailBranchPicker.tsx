"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  ADMIN_VERTICAL_ALL,
  useAdminVertical,
} from "@/context/AdminVerticalContext";
import { BRANCHES, type ScrapeBranchId } from "@/lib/bedrijven/branches";
import type { OutreachBranchId } from "@/lib/bedrijven/outreach-branches";
import type { AdminVerticalHubRow } from "@/lib/admin/vertical-summary-types";
import { useMailAdminUrl } from "./use-mail-admin-url";

export function MailBranchPicker() {
  const t = useTranslations("adminMail");
  const { vertical, setVertical, outreachBranchIds } = useAdminVertical();
  const { setUrl } = useMailAdminUrl();
  const [rows, setRows] = useState<AdminVerticalHubRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/verticals", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { rows: AdminVerticalHubRow[] };
      setRows(data.rows ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, [load]);

  const activeRows = rows.filter(
    (r) => r.status === "active" && outreachBranchIds.includes(r.id as OutreachBranchId),
  );

  if (loading && activeRows.length === 0) {
    return (
      <p className="text-sm text-[#667085]">{t("branchPickerLoading")}</p>
    );
  }

  return (
    <div className="rounded-xl border border-[#EAECF0] bg-white p-4 shadow-xs">
      <p className="text-sm font-semibold text-[#101828]">{t("branchPickerTitle")}</p>
      <p className="mt-1 text-xs text-[#667085]">{t("branchPickerHint")}</p>
      <div className="scrollbar-hide-x -mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-0.5">
        {activeRows.map((row) => {
          const active =
            vertical !== ADMIN_VERTICAL_ALL && vertical === row.id;
          const label =
            BRANCHES[row.id as ScrapeBranchId]?.name ?? row.name;
          return (
            <button
              key={row.id}
              type="button"
              onClick={() => {
                const id = row.id as OutreachBranchId;
                setVertical(id);
                setUrl({ branch: id, page: 1 });
              }}
              className={`flex shrink-0 flex-col rounded-lg border px-3 py-2 text-left transition ${
                active
                  ? "border-[#7F56D9] bg-[#F9F5FF] ring-1 ring-[#7F56D9]/25"
                  : "border-[#EAECF0] bg-[#F9FAFB] hover:border-[#D6BBFB] hover:bg-white"
              }`}
            >
              <span
                className={`text-sm font-semibold ${active ? "text-[#6941C6]" : "text-[#101828]"}`}
              >
                {label}
              </span>
              <span className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] text-[#667085]">
                <span>
                  {t("branchConceptCount", { count: row.mail.pool })}
                </span>
                {row.mail.concept > 0 ? (
                  <>
                    <span className="text-[#D0D5DD]">·</span>
                    <span>
                      {t("branchDraftCount", { count: row.mail.concept })}
                    </span>
                  </>
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
