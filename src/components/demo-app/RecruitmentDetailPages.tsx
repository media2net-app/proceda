"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import {
  recruitmentAppHref,
  recruitmentDetailHref,
} from "@/lib/demo-app/recruitment-nav";
import {
  AiReasonSteps,
  DemoDetailTabs,
  MatchFactorBreakdown,
  RecruitmentAiPanel,
  SkillScoreBars,
} from "./RecruitmentAiBlocks";
import { RecruitmentAiChatPanel } from "./RecruitmentAiChatPanel";
import { RecruitmentAiDraftComposer } from "./RecruitmentAiDraftComposer";
import { DemoPageHeader, useDemoAction } from "./demo-ui";
import { useRecruitmentPortal } from "./RecruitmentPortalContext";

function DetailBackLink({
  slug,
  segment,
  label,
}: {
  slug: string;
  segment: string;
  label: string;
}) {
  return (
    <Link
      href={recruitmentAppHref(slug, segment)}
      className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-[#667085] hover:text-[#344054]"
    >
      ← {label}
    </Link>
  );
}

function NotFound({ slug, segment, label }: { slug: string; segment: string; label: string }) {
  return (
    <div className="rounded-xl border border-[#EAECF0] bg-white p-8 text-center">
      <p className="text-[#667085]">Item niet gevonden in deze demo.</p>
      <Link
        href={recruitmentAppHref(slug, segment)}
        className="mt-4 inline-block text-sm font-semibold text-[#7F56D9]"
      >
        Terug naar {label}
      </Link>
    </div>
  );
}

const CANDIDATE_STATUS_CLASS = {
  new: "bg-[#EFF8FF] text-[#175CD3]",
  active: "bg-[#ECFDF3] text-[#027A48]",
  placed: "bg-[#F2F4F7] text-[#475467]",
  wait: "bg-[#FFFAEB] text-[#B54708]",
};

export function RecruitmentCandidateDetailPage({ id }: { id: string }) {
  const { brand, slug, data } = useRecruitmentPortal();
  const detail = data.candidateDetails[id];
  const { run, Toast } = useDemoAction();
  const [tab, setTab] = useState<"profiel" | "ai" | "matches" | "tijdlijn">("profiel");
  const primary = brand.primaryColor;

  if (!detail) {
    return (
      <NotFound slug={slug} segment="kandidaten" label="kandidaten" />
    );
  }

  const matches = detail.topMatchIds
    .map((mid) => data.matchDetails[mid])
    .filter(Boolean);

  return (
    <>
      <DetailBackLink slug={slug} segment="kandidaten" label="Kandidaten" />
      <DemoPageHeader
        brand={brand}
        title={detail.name}
        subtitle={`${detail.sector} · ${detail.status}`}
        action={
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              CANDIDATE_STATUS_CLASS[detail.statusStyle]
            }`}
          >
            {detail.status}
          </span>
        }
      />

      <div className="mb-6">
        <DemoDetailTabs
          tabs={[
            { id: "profiel", label: "Profiel" },
            { id: "ai", label: "AI-analyse" },
            { id: "matches", label: "Matches" },
            { id: "tijdlijn", label: "Tijdlijn" },
          ]}
          active={tab}
          onChange={setTab}
          primaryColor={primary}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {tab === "profiel" && (
            <>
              <section className="rounded-xl border border-[#EAECF0] bg-white p-5 shadow-xs">
                <h3 className="text-sm font-semibold text-[#101828]">Contact</h3>
                <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-[#667085]">E-mail</dt>
                    <dd className="font-medium">{detail.email}</dd>
                  </div>
                  <div>
                    <dt className="text-[#667085]">Telefoon</dt>
                    <dd className="font-medium">{detail.phone}</dd>
                  </div>
                  <div>
                    <dt className="text-[#667085]">Beschikbaarheid</dt>
                    <dd className="font-medium">{detail.availability}</dd>
                  </div>
                  <div>
                    <dt className="text-[#667085]">Ervaring</dt>
                    <dd className="font-medium">{detail.experienceYears} jaar</dd>
                  </div>
                </dl>
              </section>
              <section className="rounded-xl border border-[#EAECF0] bg-white p-5 shadow-xs">
                <h3 className="text-sm font-semibold text-[#101828]">
                  Vaardigheden (AI-gescoord)
                </h3>
                <div className="mt-4">
                  <SkillScoreBars skills={detail.skills} primaryColor={primary} />
                </div>
              </section>
            </>
          )}

          {tab === "ai" && (
            <RecruitmentAiPanel title="Kandidaatprofiel — AI-samenvatting" primaryColor={primary}>
              <p className="text-sm leading-relaxed text-[#D0D5DD]">
                {detail.aiSummary}
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase text-[#12B76A]">
                    Sterktes
                  </p>
                  <ul className="mt-2 list-inside list-disc text-sm text-[#E4E7EC]">
                    {detail.aiStrengths.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-[#FDB022]">
                    Aandachtspunten
                  </p>
                  <ul className="mt-2 list-inside list-disc text-sm text-[#E4E7EC]">
                    {detail.aiRisks.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <button
                type="button"
                onClick={() => run("AI heeft intake-vragen gegenereerd")}
                className="mt-4 rounded-lg px-4 py-2 text-sm font-semibold text-white"
                style={{ backgroundColor: primary }}
              >
                Genereer intake-vragen
              </button>
            </RecruitmentAiPanel>
          )}

          {tab === "matches" && (
            <div className="space-y-3">
              {matches.length === 0 ? (
                <p className="text-sm text-[#667085]">
                  Nog geen actieve AI-matches — AI zoekt zodra CV compleet is.
                </p>
              ) : (
                matches.map((m) => (
                  <Link
                    key={m.id}
                    href={recruitmentDetailHref(slug, "matching", m.id)}
                    className="block rounded-xl border border-[#EAECF0] bg-white p-4 shadow-xs transition-shadow hover:shadow-md"
                  >
                    <div className="flex justify-between gap-3">
                      <div>
                        <p className="font-semibold text-[#101828]">
                          {m.vacancyTitle}
                        </p>
                        <p className="mt-1 text-sm text-[#667085]">{m.reason}</p>
                      </div>
                      <span
                        className="shrink-0 rounded-full px-3 py-1 text-sm font-bold text-white"
                        style={{ backgroundColor: primary }}
                      >
                        {m.score}%
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}

          {tab === "tijdlijn" && (
            <ul className="space-y-3">
              {detail.timeline.map((e) => (
                <li
                  key={e.id}
                  className="rounded-xl border border-[#EAECF0] bg-white p-4 shadow-xs"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-[#101828]">{e.title}</p>
                    {e.aiGenerated && (
                      <span className="rounded bg-[#F4EBFF] px-1.5 py-0.5 text-[10px] font-bold text-[#6941C6]">
                        AI
                      </span>
                    )}
                    <span className="text-xs text-[#98A2B3]">{e.at}</span>
                  </div>
                  <p className="mt-1 text-sm text-[#667085]">{e.detail}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <aside className="space-y-4">
          <RecruitmentAiChatPanel
            context={{ kind: "candidate", id }}
            primaryColor={primary}
          />
          <div
            className="rounded-xl border border-[#EAECF0] bg-white p-5 text-center shadow-xs"
          >
            <p className="text-xs font-semibold uppercase text-[#667085]">
              Groeipotentieel
            </p>
            <p
              className="mt-2 text-4xl font-bold"
              style={{ color: primary }}
            >
              {detail.growthScore}%
            </p>
            <p className="mt-1 text-xs text-[#667085]">AI-prognose retentie</p>
          </div>
          <section className="rounded-xl border border-[#EAECF0] bg-[#FFFAEB] p-4 shadow-xs">
            <p className="text-xs font-semibold text-[#B54708]">Consultant</p>
            <p className="mt-2 text-sm text-[#344054]">{detail.consultantNote}</p>
          </section>
          <button
            type="button"
            onClick={() => run("Intake ingepland in agenda")}
            className="w-full rounded-lg py-2.5 text-sm font-semibold text-white"
            style={{ backgroundColor: primary }}
          >
            Plan intake
          </button>
        </aside>
      </div>
      {Toast}
    </>
  );
}

export function RecruitmentVacancyDetailPage({ id }: { id: string }) {
  const { brand, slug, data } = useRecruitmentPortal();
  const detail = data.vacancyDetails[id];
  const { run, Toast } = useDemoAction();
  const primary = brand.primaryColor;

  if (!detail) {
    return <NotFound slug={slug} segment="vacatures" label="vacatures" />;
  }

  const shortlist = detail.shortlistCandidateIds
    .map((cid) => data.candidateDetails[cid])
    .filter(Boolean);

  return (
    <>
      <DetailBackLink slug={slug} segment="vacatures" label="Vacatures" />
      <DemoPageHeader
        brand={brand}
        title={detail.title}
        subtitle={`${detail.client} · ${detail.location}`}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-[#EAECF0] bg-white p-4 shadow-xs">
          <p className="text-xs text-[#667085]">Uren</p>
          <p className="font-semibold">{detail.hoursPerWeek}</p>
        </div>
        <div className="rounded-xl border border-[#EAECF0] bg-white p-4 shadow-xs">
          <p className="text-xs text-[#667085]">Start</p>
          <p className="font-semibold">{detail.startDate}</p>
        </div>
        <div className="rounded-xl border border-[#FECDCA] bg-[#FEF3F2] p-4 shadow-xs">
          <p className="text-xs text-[#B42318]">SLA 48u</p>
          <p className="font-semibold text-[#B42318]">{detail.slaHours}u resterend</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <RecruitmentAiPanel title="Werkgever-intake (AI-samenvatting)" primaryColor={primary}>
            <p className="text-sm leading-relaxed text-[#D0D5DD]">
              {detail.aiIntakeSummary}
            </p>
            <button
              type="button"
              onClick={() => run("Volledig transcript geopend")}
              className="mt-4 text-sm font-semibold text-[#E9D7FE] underline"
            >
              Bekijk transcript (18 min) →
            </button>
          </RecruitmentAiPanel>

          <section className="rounded-xl border border-[#EAECF0] bg-white p-5 shadow-xs">
            <h3 className="text-sm font-semibold text-[#101828]">Functie</h3>
            <p className="mt-2 text-sm leading-relaxed text-[#344054]">
              {detail.description}
            </p>
          </section>

          <section className="rounded-xl border border-[#EAECF0] bg-white p-5 shadow-xs">
            <h3 className="text-sm font-semibold text-[#101828]">
              Eisen — AI vs kandidatenpool
            </h3>
            <ul className="mt-4 space-y-2">
              {detail.requirements.map((r) => (
                <li
                  key={r.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[#F9FAFB] px-3 py-2 text-sm"
                >
                  <span>
                    {r.label}
                    {r.required && (
                      <span className="ml-2 text-xs text-[#B42318]">verplicht</span>
                    )}
                  </span>
                  <span className="font-semibold text-[#027A48]">
                    {r.met ?? 0} kandidaten voldoen
                  </span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => run("AI zoekt extra kandidaten in pool")}
              className="mt-4 rounded-lg border border-[#D0D5DD] px-4 py-2 text-sm font-semibold text-[#344054] hover:bg-[#F9FAFB]"
            >
              AI: verbreed zoekopdracht
            </button>
          </section>
        </div>

        <aside className="space-y-4">
          <RecruitmentAiChatPanel
            context={{ kind: "vacancy", id }}
            primaryColor={primary}
          />
          <section className="rounded-xl border border-[#EAECF0] bg-white p-5 shadow-xs">
            <h3 className="text-sm font-semibold text-[#101828]">AI-shortlist</h3>
            <ul className="mt-3 space-y-2">
              {shortlist.map((c) => (
                <li key={c.id}>
                  <Link
                    href={recruitmentDetailHref(slug, "kandidaten", c.id)}
                    className="flex items-center justify-between rounded-lg border border-[#EAECF0] px-3 py-2 text-sm hover:bg-[#F9FAFB]"
                  >
                    <span className="font-medium">{c.name}</span>
                    <span style={{ color: primary }}>{c.growthScore}%</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
          <button
            type="button"
            onClick={() => run("Shortlist gedeeld met werkgever")}
            className="w-full rounded-lg py-2.5 text-sm font-semibold text-white"
            style={{ backgroundColor: primary }}
          >
            Deel shortlist
          </button>
        </aside>
      </div>
      {Toast}
    </>
  );
}

export function RecruitmentMatchDetailPage({ id }: { id: string }) {
  const { brand, slug, data } = useRecruitmentPortal();
  const detail = data.matchDetails[id];
  const { run, Toast } = useDemoAction();
  const [showMotivation, setShowMotivation] = useState(true);
  const primary = brand.primaryColor;

  if (!detail) {
    return <NotFound slug={slug} segment="matching" label="matching" />;
  }

  return (
    <>
      <DetailBackLink slug={slug} segment="matching" label="AI matching" />
      <DemoPageHeader
        brand={brand}
        title={`${detail.candidateName} → ${detail.vacancyTitle}`}
        subtitle={`${detail.sector} · ${detail.score}% totaalmatch`}
        action={
          <span
            className="rounded-full px-4 py-1.5 text-lg font-bold text-white"
            style={{ backgroundColor: primary }}
          >
            {detail.score}%
          </span>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <Link
          href={recruitmentDetailHref(slug, "kandidaten", detail.candidateId)}
          className="rounded-lg border border-[#D0D5DD] bg-white px-3 py-1.5 text-sm font-semibold text-[#344054] hover:bg-[#F9FAFB]"
        >
          Kandidaatdossier →
        </Link>
        <Link
          href={recruitmentDetailHref(slug, "vacatures", detail.vacancyId)}
          className="rounded-lg border border-[#D0D5DD] bg-white px-3 py-1.5 text-sm font-semibold text-[#344054] hover:bg-[#F9FAFB]"
        >
          Vacature →
        </Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <div className="grid gap-6 lg:grid-cols-2">
            <RecruitmentAiPanel
              title="Waarom deze match? (stap voor stap)"
              primaryColor={primary}
            >
              <AiReasonSteps steps={detail.reasonSteps} />
            </RecruitmentAiPanel>

            <RecruitmentAiPanel
              title="Score-opbouw — geen zwarte doos"
              primaryColor={primary}
            >
              <MatchFactorBreakdown factors={detail.factors} primaryColor={primary} />
            </RecruitmentAiPanel>
          </div>

          <section className="rounded-xl border border-[#EAECF0] bg-white p-5 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-[#101828]">
                Motivatie voor werkgever (AI-concept)
              </h3>
              <button
                type="button"
                onClick={() => setShowMotivation((v) => !v)}
                className="text-sm font-semibold text-[#6941C6]"
              >
                {showMotivation ? "Verberg" : "Toon"}
              </button>
            </div>
            {showMotivation && (
              <div className="mt-4">
                <RecruitmentAiDraftComposer
                  subject={`Motivatie — ${detail.candidateName}`}
                  body={detail.motivationDraft}
                  primaryColor={primary}
                />
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => run("Motivatie gekopieerd naar ATS")}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-white"
                style={{ backgroundColor: primary }}
              >
                Naar ATS + mail
              </button>
            </div>
            {detail.atsNote && (
              <p className="mt-3 text-xs text-[#667085]">{detail.atsNote}</p>
            )}
          </section>

          <p className="rounded-lg border border-[#FEDF89] bg-[#FFFAEB] px-4 py-3 text-sm text-[#7A2E0E]">
            <strong>Tip consultant:</strong> {detail.consultantTip}
          </p>
        </div>

        <RecruitmentAiChatPanel
          context={{ kind: "match", id }}
          primaryColor={primary}
          className="xl:sticky xl:top-6 xl:self-start"
        />
      </div>
      {Toast}
    </>
  );
}

const FOLLOWUP_GENERATED_DRAFT: Record<string, { subject: string; body: string }> = {
  f3: {
    subject: "Bevestiging gesprek morgen 10:00",
    body: `Beste team Logistiek Partners,

Graag bevestig ik ons telefonisch overleg morgen om 10:00. Ik neem een korte shortlist mee van kandidaten die voldoen aan jullie heftruck-eis.

Tot morgen,

Het team van Hiebami`,
  },
};

export function RecruitmentFollowUpDetailPage({ id }: { id: string }) {
  const { brand, slug, data } = useRecruitmentPortal();
  const detail = data.followUpDetails[id];
  const { run, Toast } = useDemoAction();
  const [draftGenerated, setDraftGenerated] = useState(false);
  const primary = brand.primaryColor;

  if (!detail) {
    return <NotFound slug={slug} segment="opvolging" label="opvolging" />;
  }

  return (
    <>
      <DetailBackLink slug={slug} segment="opvolging" label="Opvolging 48u" />
      <DemoPageHeader
        brand={brand}
        title={detail.party}
        subtitle={`${detail.type === "werkgever" ? "Werkgever" : "Kandidaat"} · wacht ${detail.waitingSince}`}
      />

      <div className="mb-6 rounded-xl border border-[#FECDCA] bg-[#FEF3F2] px-4 py-3 text-sm text-[#B42318]">
        <strong>48u-belofte:</strong> {detail.slaDeadline}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {detail.draftReady || draftGenerated ? (
            <section className="rounded-xl border border-[#EAECF0] bg-white p-5 shadow-xs">
              <RecruitmentAiDraftComposer
                key={draftGenerated ? `${id}-generated` : id}
                subject={
                  draftGenerated && FOLLOWUP_GENERATED_DRAFT[id]
                    ? FOLLOWUP_GENERATED_DRAFT[id].subject
                    : detail.subject
                }
                body={
                  draftGenerated && FOLLOWUP_GENERATED_DRAFT[id]
                    ? FOLLOWUP_GENERATED_DRAFT[id].body
                    : detail.draftBody
                }
                primaryColor={primary}
                autoPlay
              />
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => run("Mail verstuurd via Hostinger")}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-white"
                  style={{ backgroundColor: primary }}
                >
                  Verstuur nu
                </button>
                <button
                  type="button"
                  onClick={() => run("Concept opgeslagen")}
                  className="rounded-lg border border-[#D0D5DD] px-4 py-2 text-sm font-semibold text-[#344054]"
                >
                  Bewerk concept
                </button>
              </div>
            </section>
          ) : (
            <section className="rounded-xl border border-dashed border-[#D0D5DD] bg-[#F9FAFB] p-8 text-center">
              <p className="text-sm text-[#667085]">
                AI genereert concept zodra gesprek bevestigd is.
              </p>
              <button
                type="button"
                onClick={() => {
                  setDraftGenerated(true);
                  run("AI genereert conceptmail…");
                }}
                className="mt-4 rounded-lg px-4 py-2 text-sm font-semibold text-white"
                style={{ backgroundColor: primary }}
              >
                Genereer concept
              </button>
            </section>
          )}
        </div>

        <aside className="space-y-4">
          <RecruitmentAiChatPanel
            context={{ kind: "followup", id }}
            primaryColor={primary}
          />
          <RecruitmentAiPanel
            title="Personalisatie door AI"
            primaryColor={primary}
          >
            <ul className="list-inside list-disc text-sm text-[#D0D5DD]">
              {detail.aiPersonalization.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </RecruitmentAiPanel>
          <p className="text-sm text-[#667085]">{detail.action}</p>
          {detail.relatedVacancyId && (
            <Link
              href={recruitmentDetailHref(slug, "vacatures", detail.relatedVacancyId)}
              className="block text-sm font-semibold"
              style={{ color: primary }}
            >
              Gerelateerde vacature →
            </Link>
          )}
          {detail.relatedCandidateId && (
            <Link
              href={recruitmentDetailHref(
                slug,
                "kandidaten",
                detail.relatedCandidateId,
              )}
              className="block text-sm font-semibold"
              style={{ color: primary }}
            >
              Kandidaatdossier →
            </Link>
          )}
        </aside>
      </div>
      {Toast}
    </>
  );
}
