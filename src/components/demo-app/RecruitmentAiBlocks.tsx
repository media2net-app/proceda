"use client";

import type {
  RecruitmentAiReasonStep,
  RecruitmentScoreFactor,
  RecruitmentSkillScore,
} from "@/lib/demo-app/types";

export function RecruitmentAiBadge({
  primaryColor,
  label = "AI",
}: {
  primaryColor: string;
  label?: string;
}) {
  return (
    <span
      className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
      style={{ backgroundColor: primaryColor }}
    >
      {label}
    </span>
  );
}

export function RecruitmentAiPanel({
  title,
  children,
  primaryColor,
}: {
  title: string;
  children: React.ReactNode;
  primaryColor: string;
}) {
  return (
    <section className="rounded-xl border border-[#475467] bg-[#1D2939] p-5 text-[#F9FAFB] shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <RecruitmentAiBadge primaryColor={primaryColor} label="Proceda AI" />
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      {children}
    </section>
  );
}

export function SkillScoreBars({
  skills,
  primaryColor,
}: {
  skills: RecruitmentSkillScore[];
  primaryColor: string;
}) {
  return (
    <ul className="space-y-3">
      {skills.map((s) => (
        <li key={s.label}>
          <div className="flex justify-between text-sm">
            <span className="font-medium text-[#101828]">{s.label}</span>
            <span className="font-semibold" style={{ color: primaryColor }}>
              {s.score}%
            </span>
          </div>
          {s.note && (
            <p className="text-xs text-[#667085]">{s.note}</p>
          )}
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#F2F4F7]">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${s.score}%`, backgroundColor: primaryColor }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function MatchFactorBreakdown({
  factors,
  primaryColor,
}: {
  factors: RecruitmentScoreFactor[];
  primaryColor: string;
}) {
  return (
    <ul className="space-y-4">
      {factors.map((f) => (
        <li
          key={f.label}
          className="rounded-lg border border-[#475467] bg-[#344054] p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-[#F9FAFB]">
              {f.label}{" "}
              <span className="font-normal text-[#98A2B3]">({f.weight}%)</span>
            </p>
            <span className="text-lg font-bold text-white">{f.score}%</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#1D2939]">
            <div
              className="h-full rounded-full"
              style={{ width: `${f.score}%`, backgroundColor: primaryColor }}
            />
          </div>
          <p className="mt-2 text-xs leading-relaxed text-[#D0D5DD]">
            {f.explanation}
          </p>
        </li>
      ))}
    </ul>
  );
}

export function AiReasonSteps({ steps }: { steps: RecruitmentAiReasonStep[] }) {
  return (
    <ol className="relative space-y-4 border-l-2 border-[#475467] pl-6">
      {steps.map((s) => (
        <li key={s.step} className="relative">
          <span className="absolute -left-[1.65rem] flex h-6 w-6 items-center justify-center rounded-full bg-[#7F56D9] text-xs font-bold text-white">
            {s.step}
          </span>
          <p className="text-sm font-semibold text-[#F9FAFB]">{s.title}</p>
          <p className="mt-1 text-xs leading-relaxed text-[#98A2B3]">
            {s.detail}
          </p>
        </li>
      ))}
    </ol>
  );
}

export function DemoDetailTabs<T extends string>({
  tabs,
  active,
  onChange,
  primaryColor,
}: {
  tabs: { id: T; label: string }[];
  active: T;
  onChange: (id: T) => void;
  primaryColor: string;
}) {
  return (
    <div className="flex flex-wrap gap-1 rounded-lg border border-[#D0D5DD] bg-white p-1 shadow-xs">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${
            active === tab.id ? "text-white" : "text-[#667085] hover:bg-[#F9FAFB]"
          }`}
          style={
            active === tab.id ? { backgroundColor: primaryColor } : undefined
          }
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
