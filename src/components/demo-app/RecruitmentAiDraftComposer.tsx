"use client";

import { useState } from "react";
import { useTypewriter } from "./useTypewriter";

export function RecruitmentAiDraftComposer({
  subject,
  body,
  primaryColor,
  autoPlay = true,
}: {
  subject: string;
  body: string;
  primaryColor: string;
  /** Start met type-effect bij openen */
  autoPlay?: boolean;
}) {
  const [generating, setGenerating] = useState(false);
  const [playKey, setPlayKey] = useState(autoPlay ? 1 : 0);
  const enabled = playKey > 0 && !generating;

  const { displayed, done } = useTypewriter(body, {
    enabled,
    speedMs: 10,
    delayMs: generating ? 0 : 400,
  });

  function regenerate() {
    setGenerating(true);
    setPlayKey(0);
    window.setTimeout(() => {
      setGenerating(false);
      setPlayKey((k) => k + 1);
    }, 900);
  }

  const showBody = generating ? "" : playKey === 0 ? "" : displayed;

  return (
    <div>
      <p className="text-xs font-semibold uppercase text-[#667085]">Onderwerp</p>
      <p className="mt-1 font-semibold text-[#101828]">{subject}</p>

      <div className="relative mt-4">
        {(generating || (enabled && !done)) && (
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-[#6941C6]">
            <span
              className="inline-block h-2 w-2 animate-pulse rounded-full"
              style={{ backgroundColor: primaryColor }}
            />
            AI schrijft concept…
          </div>
        )}
        <pre className="min-h-[12rem] whitespace-pre-wrap rounded-lg border border-[#EAECF0] bg-[#F9FAFB] p-4 text-sm leading-relaxed text-[#344054]">
          {showBody}
          {enabled && !done && !generating && (
            <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-[#7F56D9]" />
          )}
        </pre>
      </div>

      <button
        type="button"
        onClick={regenerate}
        disabled={generating}
        className="mt-3 text-sm font-semibold text-[#6941C6] hover:underline disabled:opacity-50"
      >
        ↻ Opnieuw genereren (live preview)
      </button>
    </div>
  );
}
