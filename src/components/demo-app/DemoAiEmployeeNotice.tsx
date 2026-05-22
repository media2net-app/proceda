"use client";

import { useState } from "react";
import type { DemoAiInsight } from "@/lib/demo-app/types";

export function DemoAiEmployeeNotice({
  insight,
  primaryColor,
}: {
  insight: DemoAiInsight;
  primaryColor: string;
}) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <section
      className="mb-6 overflow-hidden rounded-2xl border border-[#475467] bg-[#1D2939] shadow-sm"
      aria-label="Melding AI-medewerker"
    >
      <div className="relative p-5 sm:p-6">
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-[#98A2B3] hover:bg-white/10 hover:text-[#E4E7EC]"
          aria-label="Melding sluiten"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18 18 6M6 6l12 12"
            />
          </svg>
        </button>

        <div className="pr-8">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white"
              style={{ backgroundColor: primaryColor }}
            >
              AI-medewerker
            </span>
            <span className="rounded-full border border-[#475467] bg-[#344054] px-2 py-0.5 text-[11px] font-medium text-[#E4E7EC]">
              Prognose & analyse
            </span>
            <span className="rounded-full border border-[#475467] bg-[#344054] px-2 py-0.5 text-[11px] font-medium text-[#D0D5DD]">
              Betrouwbaarheid: {insight.confidence}
            </span>
          </div>

          <h2 className="mt-3 text-base font-semibold text-[#F9FAFB] sm:text-lg">
            {insight.headline}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#D0D5DD]">
            {insight.summary}
          </p>
          <p className="mt-2 text-xs text-[#98A2B3]">
            {insight.agentName} · {insight.generatedAt}
          </p>

          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {insight.items.map((item) => (
              <li
                key={item.id}
                className="rounded-xl border border-[#475467] bg-[#344054] p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-[#F9FAFB]">
                    {item.title}
                  </p>
                  {item.metric && (
                    <span className="shrink-0 rounded-md border border-[#475467] bg-[#1D2939] px-1.5 py-0.5 text-[10px] font-semibold text-[#E4E7EC]">
                      {item.metric}
                    </span>
                  )}
                </div>
                <p className="mt-1.5 text-xs leading-snug text-[#98A2B3]">
                  {item.detail}
                </p>
              </li>
            ))}
          </ul>

          <p className="mt-4 text-[11px] text-[#667085]">
            Demo: AI analyseert markt, concurrentie en uw aanbod — tijdens een gesprek
            tonen we dit live in uw maatwerk portaal.
          </p>
        </div>
      </div>
    </section>
  );
}
