"use client";

import { Link } from "@/i18n/navigation";
import {
  recruitmentAppHref,
  recruitmentDetailHref,
} from "@/lib/demo-app/recruitment-nav";
import { DemoAiEmployeeNotice } from "./DemoAiEmployeeNotice";
import { DemoPageHeader } from "./demo-ui";
import { useRecruitmentPortal } from "./RecruitmentPortalContext";

export default function RecruitmentDashboardContent() {
  const { brand, slug, data } = useRecruitmentPortal();
  const primary = brand.primaryColor;

  return (
    <>
      <DemoPageHeader
        brand={brand}
        title="Overzicht"
        subtitle="Vacatures, kandidaten en AI-ondersteuning — naast jullie ATS"
      />

      <DemoAiEmployeeNotice insight={data.aiInsight} primaryColor={primary} />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {data.kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-xl border border-[#EAECF0] bg-white p-4 shadow-xs"
          >
            <p className="text-sm font-medium text-[#667085]">{kpi.label}</p>
            <p className="mt-1.5 text-2xl font-semibold text-[#101828]">
              {kpi.value}
            </p>
            <p
              className={`mt-1 text-xs font-medium ${
                kpi.trendUp ? "text-[#12B76A]" : "text-[#F04438]"
              }`}
            >
              {kpi.trend} <span className="font-normal text-[#667085]">t.o.v. vorige week</span>
            </p>
          </div>
        ))}
      </div>

      <section className="mb-8 rounded-xl border border-[#EAECF0] bg-white shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EAECF0] px-4 py-4 sm:px-5">
          <div>
            <h2 className="text-base font-semibold text-[#101828]">
              AI-matchvoorstellen
            </h2>
            <p className="text-xs text-[#667085]">
              Met uitleg — geschikt om in jullie ATS te beoordelen
            </p>
          </div>
          <Link
            href={recruitmentAppHref(slug, "matching")}
            className="text-sm font-semibold"
            style={{ color: primary }}
          >
            Alle matches →
          </Link>
        </div>
        <ul className="divide-y divide-[#EAECF0]">
          {data.aiMatches.map((m) => (
            <li key={m.id}>
              <Link
                href={recruitmentDetailHref(slug, "matching", m.id)}
                className="block px-4 py-4 transition-colors hover:bg-[#F9FAFB] sm:px-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-[#101828]">
                      {m.candidateName}{" "}
                      <span className="font-normal text-[#667085]">→</span>{" "}
                      {m.vacancyTitle}
                    </p>
                    <p className="mt-1 text-sm text-[#667085]">{m.reason}</p>
                  </div>
                  <span
                    className="shrink-0 rounded-full px-2.5 py-1 text-xs font-bold text-white"
                    style={{ backgroundColor: primary }}
                  >
                    {m.score}% match
                  </span>
                </div>
                <p className="mt-2 text-xs font-semibold" style={{ color: primary }}>
                  Score-uitleg & motivatie →
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-[#FECDCA] bg-[#FEF3F2] shadow-xs">
        <div className="border-b border-[#FECDCA] px-4 py-4 sm:px-5">
          <h2 className="text-base font-semibold text-[#B42318]">
            48u-opvolging
          </h2>
          <p className="text-xs text-[#B42318]/80">
            Wie wacht op wie — conceptberichten klaar
          </p>
        </div>
        <ul className="divide-y divide-[#FECDCA]/60">
          {data.followUps.map((f) => (
            <li key={f.id}>
              <Link
                href={recruitmentDetailHref(slug, "opvolging", f.id)}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-white/60 sm:px-5"
              >
                <div>
                  <p className="text-sm font-semibold text-[#101828]">{f.party}</p>
                  <p className="text-xs text-[#667085]">
                    {f.type === "werkgever" ? "Werkgever" : "Kandidaat"} · wacht{" "}
                    {f.waitingSince}
                  </p>
                  <p className="mt-1 text-sm text-[#344054]">{f.action}</p>
                </div>
                {f.draftReady && (
                  <span className="rounded-lg border border-[#D0D5DD] bg-white px-3 py-1.5 text-xs font-semibold text-[#344054]">
                    Concept →
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </section>

    </>
  );
}
