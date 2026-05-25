"use client";

import { Link } from "@/i18n/navigation";
import { recruitmentDetailHref } from "@/lib/demo-app/recruitment-nav";
import { DemoPageHeader } from "./demo-ui";
import { useRecruitmentPortal } from "./RecruitmentPortalContext";

export function RecruitmentCandidatesPage() {
  const { brand, slug, data } = useRecruitmentPortal();

  return (
    <>
      <DemoPageHeader
        brand={brand}
        title="Kandidaten"
        subtitle="Klik een dossier — AI-profiel, matches en tijdlijn"
      />
      <div className="overflow-hidden rounded-xl border border-[#EAECF0] bg-white shadow-xs">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-[#F9FAFB] text-xs font-semibold uppercase text-[#667085]">
            <tr>
              <th className="px-4 py-3">Naam</th>
              <th className="px-4 py-3">Sector</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Taal</th>
              <th className="px-4 py-3">Groeipotentieel</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EAECF0]">
            {data.candidates.map((c) => (
              <tr key={c.id} className="hover:bg-[#F9FAFB]">
                <td className="px-4 py-3 font-medium text-[#101828]">{c.name}</td>
                <td className="px-4 py-3 text-[#667085]">{c.sector}</td>
                <td className="px-4 py-3">{c.status}</td>
                <td className="px-4 py-3 text-[#667085]">{c.language}</td>
                <td className="px-4 py-3 font-semibold" style={{ color: brand.primaryColor }}>
                  {c.growthScore}%
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={recruitmentDetailHref(slug, "kandidaten", c.id)}
                    className="text-sm font-semibold"
                    style={{ color: brand.primaryColor }}
                  >
                    Dossier →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function RecruitmentVacanciesPage() {
  const { brand, slug, data } = useRecruitmentPortal();

  return (
    <>
      <DemoPageHeader
        brand={brand}
        title="Vacatures & opdrachten"
        subtitle="Intake, eisen en AI-shortlist per opdracht"
      />
      <div className="grid gap-4 md:grid-cols-2">
        {data.vacancies.map((v) => (
          <Link
            key={v.id}
            href={recruitmentDetailHref(slug, "vacatures", v.id)}
            className="rounded-xl border border-[#EAECF0] bg-white p-5 shadow-xs transition-shadow hover:shadow-md"
          >
            <p className="text-xs font-semibold uppercase text-[#667085]">
              {v.sector} · {v.location}
            </p>
            <h2 className="mt-1 text-lg font-semibold text-[#101828]">{v.title}</h2>
            <p className="mt-1 text-sm text-[#667085]">{v.client}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-[#EFF8FF] px-2 py-0.5 font-semibold text-[#175CD3]">
                {v.candidates} kandidaten
              </span>
              <span
                className={`rounded-full px-2 py-0.5 font-semibold ${
                  v.urgency === "Hoog"
                    ? "bg-[#FEF3F2] text-[#B42318]"
                    : "bg-[#F2F4F7] text-[#475467]"
                }`}
              >
                {v.urgency}
              </span>
              <span className="rounded-full bg-[#ECFDF3] px-2 py-0.5 font-semibold text-[#027A48]">
                SLA {v.slaHours}u
              </span>
            </div>
            <p
              className="mt-4 text-sm font-semibold"
              style={{ color: brand.primaryColor }}
            >
              Bekijk intake & shortlist →
            </p>
          </Link>
        ))}
      </div>
    </>
  );
}

export function RecruitmentMatchingPage() {
  const { brand, slug, data } = useRecruitmentPortal();

  return (
    <>
      <DemoPageHeader
        brand={brand}
        title="AI matching"
        subtitle="Open een match voor score-uitleg en motivatie-concept"
      />
      <div className="space-y-4">
        {data.aiMatches.map((m) => (
          <Link
            key={m.id}
            href={recruitmentDetailHref(slug, "matching", m.id)}
            className="block rounded-xl border border-[#EAECF0] bg-white p-5 shadow-xs transition-shadow hover:shadow-md"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-lg font-semibold text-[#101828]">
                  {m.candidateName}
                </p>
                <p className="text-sm text-[#667085]">{m.vacancyTitle}</p>
              </div>
              <span
                className="rounded-full px-3 py-1 text-sm font-bold text-white"
                style={{ backgroundColor: brand.primaryColor }}
              >
                {m.score}%
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-[#344054]">{m.reason}</p>
            <p
              className="mt-3 text-sm font-semibold"
              style={{ color: brand.primaryColor }}
            >
              Waarom deze score? →
            </p>
          </Link>
        ))}
      </div>
    </>
  );
}

export function RecruitmentFollowUpPage() {
  const { brand, slug, data } = useRecruitmentPortal();

  return (
    <>
      <DemoPageHeader
        brand={brand}
        title="Opvolging 48u"
        subtitle="Conceptmails met AI-personalisatie — klik om te versturen"
      />
      <ul className="space-y-3">
        {data.followUps.map((f) => (
          <li key={f.id}>
            <Link
              href={recruitmentDetailHref(slug, "opvolging", f.id)}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#EAECF0] bg-white p-4 shadow-xs transition-shadow hover:shadow-md"
            >
              <div>
                <p className="font-semibold text-[#101828]">{f.party}</p>
                <p className="text-sm text-[#667085]">
                  {f.type === "werkgever" ? "Werkgever" : "Kandidaat"} · wacht{" "}
                  {f.waitingSince}
                </p>
                <p className="mt-1 text-sm text-[#344054]">{f.action}</p>
              </div>
              <span
                className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                  f.draftReady
                    ? "text-white"
                    : "border border-[#D0D5DD] text-[#344054]"
                }`}
                style={
                  f.draftReady ? { backgroundColor: brand.primaryColor } : undefined
                }
              >
                {f.draftReady ? "Concept bekijken" : "Open"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
