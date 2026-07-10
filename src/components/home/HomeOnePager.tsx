import {
  Bot,
  CheckCircle2,
  Link2,
  Mail,
  MessageSquare,
  Palette,
  Shield,
  Sparkles,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
const AGENT_ICONS = {
  intake: Sparkles,
  email: Mail,
  knowledge: MessageSquare,
  qa: Palette,
} as const;

export default async function HomeOnePager() {
  const t = await getTranslations("home");

  const agents = [
    { id: "intake" as const, phase: "1" as const },
    { id: "email" as const, phase: "1" as const },
    { id: "knowledge" as const, phase: "1" as const },
    { id: "qa" as const, phase: "2" as const },
  ];

  const skills = [
    { id: "intake" as const, agent: "intake" as const },
    { id: "email" as const, agent: "email" as const },
    { id: "knowledge" as const, agent: "knowledge" as const },
    { id: "qa" as const, agent: "qa" as const },
  ];

  const layers = [
    { icon: Link2, title: t("layers.connectorsTitle"), desc: t("layers.connectorsDesc") },
    { icon: Bot, title: t("layers.agentsTitle"), desc: t("layers.agentsDesc") },
    { icon: Shield, title: t("layers.governanceTitle"), desc: t("layers.governanceDesc") },
  ];

  const steps = [
    { n: "1", title: t("how.step1Title"), desc: t("how.step1Desc") },
    { n: "2", title: t("how.step2Title"), desc: t("how.step2Desc") },
    { n: "3", title: t("how.step3Title"), desc: t("how.step3Desc") },
  ];

  return (
    <main className="relative z-10 flex-1">
      {/* Hero */}
      <section className="mx-auto max-w-5xl px-6 pb-16 pt-12 text-center sm:pb-20 sm:pt-16">
        <p className="text-sm font-semibold uppercase tracking-widest text-[#6941C6]">
          {t("hero.eyebrow")}
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-[#101828] sm:text-5xl sm:leading-tight">
          {t("hero.headline")}
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-[#475467]">
          {t("hero.description")}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a
            href="mailto:hello@proceda.nl"
            className="inline-flex items-center rounded-lg bg-[#7F56D9] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#6941C6]"
          >
            {t("hero.ctaBookCall")}
          </a>
        </div>
      </section>

      {/* Three layers */}
      <section className="border-y border-[#EAECF0] bg-white">
        <div className="mx-auto max-w-5xl px-6 py-14 sm:py-16">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-[#101828] sm:text-3xl">{t("layers.title")}</h2>
            <p className="mt-2 text-[#475467]">{t("layers.subtitle")}</p>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {layers.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-xl border border-[#EAECF0] bg-[#F9FAFB] p-6"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F4EBFF] text-[#7F56D9]">
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-[#101828]">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#475467]">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Agents */}
      <section id="agents" className="mx-auto max-w-5xl scroll-mt-20 px-6 py-14 sm:py-16">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-[#101828] sm:text-3xl">{t("agents.title")}</h2>
          <p className="mt-2 text-[#475467]">{t("agents.subtitle")}</p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {agents.map(({ id, phase }) => {
            const Icon = AGENT_ICONS[id];
            const isPhase2 = phase === "2";
            return (
              <article
                key={id}
                className={`rounded-xl border p-5 transition-shadow hover:shadow-md ${
                  isPhase2
                    ? "border-dashed border-[#D0D5DD] bg-[#F9FAFB]/80"
                    : "border-[#EAECF0] bg-white"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                        isPhase2 ? "bg-[#F2F4F7] text-[#667085]" : "bg-[#F4EBFF] text-[#7F56D9]"
                      }`}
                    >
                      <Icon className="h-5 w-5" aria-hidden />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#101828]">{t(`agents.${id}Name`)}</h3>
                      <span
                        className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                          isPhase2
                            ? "bg-[#F2F4F7] text-[#475467]"
                            : "bg-[#ECFDF3] text-[#027A48]"
                        }`}
                      >
                        {isPhase2 ? t("agents.phase2") : t("agents.phase1")}
                      </span>
                    </div>
                  </div>
                  {!isPhase2 && (
                    <span className="flex items-center gap-1 text-xs font-medium text-[#027A48]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#12B76A]" aria-hidden />
                      {t("agents.live")}
                    </span>
                  )}
                </div>
                <p className="mt-3 text-sm leading-relaxed text-[#475467]">{t(`agents.${id}Hook`)}</p>
              </article>
            );
          })}
        </div>
      </section>

      {/* Skills */}
      <section id="skills" className="border-y border-[#EAECF0] bg-white">
        <div className="mx-auto max-w-5xl scroll-mt-20 px-6 py-14 sm:py-16">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-[#101828] sm:text-3xl">{t("skills.title")}</h2>
            <p className="mt-2 text-[#475467]">{t("skills.subtitle")}</p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {skills.map(({ id, agent }) => (
              <div
                key={id}
                className="rounded-xl border border-[#EAECF0] bg-[#F9FAFB] p-5"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-[#6941C6]">
                  {t(`agents.${agent}Name`)}
                </p>
                <ul className="mt-3 space-y-2">
                  {(t.raw(`skills.${id}Items`) as string[]).map((skill) => (
                    <li key={skill} className="flex items-center gap-2 text-sm text-[#344054]">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-[#7F56D9]" aria-hidden />
                      {skill}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="hoe-werkt-het" className="mx-auto max-w-5xl scroll-mt-20 px-6 py-14 sm:py-16">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-[#101828] sm:text-3xl">{t("how.title")}</h2>
        </div>
        <ol className="mt-10 space-y-6">
          {steps.map(({ n, title, desc }) => (
            <li
              key={n}
              className="flex gap-4 rounded-xl border border-[#EAECF0] bg-white p-5 sm:items-start"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F4EBFF] text-sm font-bold text-[#6941C6]">
                {n}
              </span>
              <div>
                <h3 className="font-semibold text-[#101828]">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-[#475467]">{desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* CTA */}
      <section className="border-t border-[#EAECF0] bg-gradient-to-b from-[#F9F5FF] to-[#f8f9fc]">
        <div className="mx-auto max-w-3xl px-6 py-14 text-center sm:py-16">
          <h2 className="text-2xl font-semibold text-[#101828] sm:text-3xl">{t("cta.title")}</h2>
          <p className="mt-3 text-[#475467]">{t("cta.description")}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href="mailto:hello@proceda.nl"
              className="inline-flex items-center rounded-lg bg-[#7F56D9] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#6941C6]"
            >
              {t("hero.ctaBookCall")}
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#EAECF0] py-6 text-center text-sm text-[#667085]">
        <p>{t("footer")}</p>
      </footer>
    </main>
  );
}
