"use client";

import { useTranslations } from "next-intl";
import { BRANCHES } from "@/lib/bedrijven/branches";
import { useAdminVertical } from "@/context/AdminVerticalContext";
import {
  PLANNED_OUTREACH_VERTICALS,
  type OutreachBranchId,
} from "@/lib/bedrijven/outreach-branches";

export function AdminVerticalSelector({ compact = false }: { compact?: boolean }) {
  const t = useTranslations("adminVertical");
  const { vertical, setVertical, outreachBranchIds } = useAdminVertical();

  return (
    <div className={compact ? "" : "px-3 pb-2"}>
      {!compact && (
        <p className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-wide text-[#98A2B3]">
          {t("label")}
        </p>
      )}
      <div
        className={`flex gap-1 ${compact ? "flex-row flex-wrap" : "flex-col"}`}
        role="group"
        aria-label={t("label")}
      >
        {outreachBranchIds.map((id) => {
          const active = vertical === id;
          const label = BRANCHES[id as OutreachBranchId]?.name ?? id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setVertical(id)}
              className={`rounded-lg px-3 py-2 text-left text-sm font-semibold transition ${
                active
                  ? "bg-[#7F56D9] text-white shadow-xs"
                  : "bg-[#F2F4F7] text-[#475467] hover:bg-[#EAECF0] hover:text-[#101828]"
              } ${compact ? "min-w-[120px] flex-1" : "w-full"}`}
            >
              {label}
              {id === "installatie" && (
                <span
                  className={`ml-1.5 text-[10px] font-medium ${
                    active ? "text-[#E9D7FE]" : "text-[#98A2B3]"
                  }`}
                >
                  {t("pilot")}
                </span>
              )}
            </button>
          );
        })}

        {!compact && (
          <p className="mt-2 px-1 text-[10px] font-medium uppercase tracking-wide text-[#D0D5DD]">
            {t("plannedLabel")}
          </p>
        )}

        {PLANNED_OUTREACH_VERTICALS.map((item) => (
          <div
            key={item.id}
            role="presentation"
            aria-disabled="true"
            title={t("plannedHint")}
            className={`cursor-default select-none rounded-lg border border-dashed border-[#EAECF0] px-3 py-2 text-sm font-medium text-[#D0D5DD] ${
              compact ? "min-w-[120px] flex-1" : "w-full"
            }`}
          >
            {item.name}
            {!compact && (
              <span className="ml-1.5 text-[10px] text-[#E4E7EC]">
                {t("plannedBadge")}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
