"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { BRANCHES } from "@/lib/bedrijven/branches";
import {
  ADMIN_VERTICAL_ALL,
  useAdminVertical,
} from "@/context/AdminVerticalContext";
import type { OutreachBranchId } from "@/lib/bedrijven/outreach-branches";

export function AdminVerticalSelector() {
  const t = useTranslations("adminVertical");
  const { vertical, setVertical, outreachBranchIds } = useAdminVertical();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const label =
    vertical === ADMIN_VERTICAL_ALL
      ? t("allBranches")
      : (BRANCHES[vertical as OutreachBranchId]?.name ?? vertical);

  return (
    <div ref={rootRef} className="relative">
      <p className="mb-1 px-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#98A2B3]">
        {t("label")}
      </p>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-[#D0D5DD] bg-white px-2.5 py-1.5 text-left text-xs font-semibold text-[#344054] shadow-xs hover:bg-[#F9FAFB]"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="truncate">{label}</span>
        <svg
          className={`h-4 w-4 shrink-0 text-[#98A2B3] transition ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {open ? (
        <ul
          role="listbox"
          className="absolute left-0 right-0 z-50 mt-1 max-h-56 overflow-y-auto rounded-lg border border-[#EAECF0] bg-white py-1 shadow-lg"
        >
          <li>
            <button
              type="button"
              role="option"
              aria-selected={vertical === ADMIN_VERTICAL_ALL}
              onClick={() => {
                setVertical(ADMIN_VERTICAL_ALL);
                setOpen(false);
              }}
              className={`w-full px-2.5 py-1.5 text-left text-xs font-semibold ${
                vertical === ADMIN_VERTICAL_ALL
                  ? "bg-[#F9F5FF] text-[#6941C6]"
                  : "text-[#344054] hover:bg-[#F9FAFB]"
              }`}
            >
              {t("allBranches")}
            </button>
          </li>
          {outreachBranchIds.map((id) => {
            const active = vertical === id;
            const name = BRANCHES[id as OutreachBranchId]?.name ?? id;
            return (
              <li key={id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    setVertical(id);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-2 px-2.5 py-1.5 text-left text-xs font-medium ${
                    active
                      ? "bg-[#F9F5FF] font-semibold text-[#6941C6]"
                      : "text-[#344054] hover:bg-[#F9FAFB]"
                  }`}
                >
                  <span className="truncate">{name}</span>
                  {id === "installatie" ? (
                    <span className="shrink-0 text-[9px] text-[#98A2B3]">
                      {t("pilot")}
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
