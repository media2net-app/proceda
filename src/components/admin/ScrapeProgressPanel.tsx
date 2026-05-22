"use client";

type ScrapeProgressPanelProps = {
  active: boolean;
  percent: number;
  statusMessage: string;
  phase: string;
  log: string[];
  enrichingDone: number;
  enrichingTotal: number;
  labels: {
    title: string;
    discovering: string;
    enriching: string;
    done: string;
    logTitle: string;
  };
};

export function ScrapeProgressPanel({
  active,
  percent,
  statusMessage,
  phase,
  log,
  enrichingDone,
  enrichingTotal,
  labels,
}: ScrapeProgressPanelProps) {
  if (!active && log.length === 0) return null;

  const phaseLabel =
    phase === "enriching"
      ? labels.enriching
      : phase === "discovering"
        ? labels.discovering
        : phase === "done"
          ? labels.done
          : "";

  const displayPercent = Math.min(100, Math.max(0, Math.round(percent)));

  return (
    <div
      className="mb-6 rounded-xl border border-[#D6BBFB] bg-[#F9F5FF] p-4 shadow-xs"
      role="status"
      aria-live="polite"
      aria-busy={active}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-[#6941C6]">{labels.title}</p>
        <span className="text-sm font-medium text-[#7F56D9]">{displayPercent}%</span>
      </div>

      <div className="h-2.5 overflow-hidden rounded-full bg-[#E9D7FE]">
        <div
          className="h-full rounded-full bg-[#7F56D9] transition-all duration-500 ease-out"
          style={{ width: `${displayPercent}%` }}
        />
      </div>

      <p className="mt-2 text-sm text-[#475467]">
        {statusMessage || phaseLabel}
        {phase === "enriching" && enrichingTotal > 0 && (
          <span className="text-[#667085]">
            {" "}
            ({enrichingDone}/{enrichingTotal})
          </span>
        )}
      </p>

      {log.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#667085]">
            {labels.logTitle}
          </p>
          <div className="max-h-40 overflow-y-auto rounded-lg border border-[#EAECF0] bg-white px-3 py-2 font-mono text-xs leading-relaxed text-[#344054]">
            {log.map((line, i) => (
              <div key={`${i}-${line.slice(0, 24)}`} className="py-0.5">
                {line}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
