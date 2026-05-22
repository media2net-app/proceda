import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import HeroSection from "@/components/HeroSection";
import UspBar from "@/components/UspBar";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import HeroMobileNav from "@/components/HeroMobileNav";

export default async function HomePage() {
  const tNav = await getTranslations("nav");
  const tHero = await getTranslations("hero");
  const tImpact = await getTranslations("impact");
  const tPortfolio = await getTranslations("portfolio");
  const tApproach = await getTranslations("approach");
  const tHow = await getTranslations("howItWorks");
  const tContact = await getTranslations("contact");
  const tFooter = await getTranslations("footer");
  const linePoints = (series: number[]) =>
    series
      .map((value, index) => `${(index / (series.length - 1)) * 100},${100 - value}`)
      .join(" ");
  const dashboardExamples = [
    {
      key: "sales",
      title: tPortfolio("salesTitle"),
      desc: tPortfolio("salesDesc"),
      kpis: [
        { label: tPortfolio("salesKpi1"), value: tPortfolio("salesKpi1Value"), trend: "+6.1%" },
        { label: tPortfolio("salesKpi2"), value: tPortfolio("salesKpi2Value"), trend: "+12.4%" },
      ],
      series: [22, 28, 34, 31, 44, 52, 48, 63, 72, 68],
      rows: [
        { name: tPortfolio("salesRow1Name"), amount: tPortfolio("salesRow1Amount"), status: tPortfolio("salesRow1Status") },
        { name: tPortfolio("salesRow2Name"), amount: tPortfolio("salesRow2Amount"), status: tPortfolio("salesRow2Status") },
        { name: tPortfolio("salesRow3Name"), amount: tPortfolio("salesRow3Amount"), status: tPortfolio("salesRow3Status") },
      ],
    },
    {
      key: "support",
      title: tPortfolio("supportTitle"),
      desc: tPortfolio("supportDesc"),
      kpis: [
        { label: tPortfolio("supportKpi1"), value: tPortfolio("supportKpi1Value"), trend: "-23%" },
        { label: tPortfolio("supportKpi2"), value: tPortfolio("supportKpi2Value"), trend: "+9.8%" },
      ],
      series: [68, 64, 61, 58, 49, 46, 43, 38, 36, 32],
      rows: [
        { name: tPortfolio("supportRow1Name"), amount: tPortfolio("supportRow1Amount"), status: tPortfolio("supportRow1Status") },
        { name: tPortfolio("supportRow2Name"), amount: tPortfolio("supportRow2Amount"), status: tPortfolio("supportRow2Status") },
        { name: tPortfolio("supportRow3Name"), amount: tPortfolio("supportRow3Amount"), status: tPortfolio("supportRow3Status") },
      ],
    },
    {
      key: "ops",
      title: tPortfolio("opsTitle"),
      desc: tPortfolio("opsDesc"),
      kpis: [
        { label: tPortfolio("opsKpi1"), value: tPortfolio("opsKpi1Value"), trend: "-14%" },
        { label: tPortfolio("opsKpi2"), value: tPortfolio("opsKpi2Value"), trend: "+4.2%" },
      ],
      series: [30, 34, 33, 37, 45, 50, 55, 62, 66, 74],
      rows: [
        { name: tPortfolio("opsRow1Name"), amount: tPortfolio("opsRow1Amount"), status: tPortfolio("opsRow1Status") },
        { name: tPortfolio("opsRow2Name"), amount: tPortfolio("opsRow2Amount"), status: tPortfolio("opsRow2Status") },
        { name: tPortfolio("opsRow3Name"), amount: tPortfolio("opsRow3Amount"), status: tPortfolio("opsRow3Status") },
      ],
    },
    {
      key: "finance",
      title: tPortfolio("financeTitle"),
      desc: tPortfolio("financeDesc"),
      kpis: [
        { label: tPortfolio("financeKpi1"), value: tPortfolio("financeKpi1Value"), trend: "-8.7%" },
        { label: tPortfolio("financeKpi2"), value: tPortfolio("financeKpi2Value"), trend: "+2.9%" },
      ],
      series: [44, 42, 39, 41, 46, 52, 58, 60, 64, 69],
      rows: [
        { name: tPortfolio("financeRow1Name"), amount: tPortfolio("financeRow1Amount"), status: tPortfolio("financeRow1Status") },
        { name: tPortfolio("financeRow2Name"), amount: tPortfolio("financeRow2Amount"), status: tPortfolio("financeRow2Status") },
        { name: tPortfolio("financeRow3Name"), amount: tPortfolio("financeRow3Amount"), status: tPortfolio("financeRow3Status") },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-white text-[#101828]">
      <div className="flex min-h-screen flex-col">
        <HeroSection>
          <header className="relative z-20 shrink-0 border-b border-white/10">
            <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
              <Link href="/" className="text-xl font-bold tracking-tight text-white">
                Proceda
              </Link>
              <div className="hidden items-center gap-4 sm:flex">
                <Link href="#hoe-werkt-het" className="text-sm font-medium text-white/80 hover:text-white">
                  {tNav("howItWorks")}
                </Link>
                <Link href="#diensten" className="text-sm font-medium text-white/80 hover:text-white">
                  {tNav("services")}
                </Link>
                <LanguageSwitcher variant="hero" />
                <Link
                  href="/login"
                  className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#101828] transition-colors hover:bg-white/90"
                >
                  {tNav("login")}
                </Link>
              </div>
              <HeroMobileNav
                menuLabel={tNav("menu")}
                closeLabel={tNav("closeMenu")}
                howItWorks={tNav("howItWorks")}
                services={tNav("services")}
                loginLabel={tNav("login")}
              />
            </nav>
          </header>

          <div className="relative z-10 px-6 pb-16 pt-14 text-center md:pt-20">
            <div className="mx-auto max-w-5xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium text-white/90 backdrop-blur-sm">
                <span className="rounded-full bg-white/20 px-2 py-0.5">{tHero("newBadge")}</span>
                <span>{tHero("bar1")}</span>
              </div>
              <h1 className="mx-auto mt-6 max-w-4xl text-4xl font-bold tracking-tight text-white md:text-6xl">
                {tHero("headline")}
              </h1>
              <p className="mx-auto mt-6 max-w-3xl text-lg text-white/80 md:text-xl">
                {tHero("description")}
              </p>
              <p className="mx-auto mt-4 max-w-3xl text-sm text-white/60 md:text-base">
                {tHero("nameMeaning")}
              </p>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/login"
                  className="inline-flex rounded-xl bg-white px-6 py-3.5 text-base font-semibold text-[#101828] shadow-lg transition-all hover:bg-white/90"
                >
                  {tHero("ctaDashboard")}
                </Link>
                <Link
                  href="#contact"
                  className="inline-flex rounded-xl border border-white/30 bg-white/10 px-6 py-3.5 text-base font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20"
                >
                  {tHero("ctaContact")}
                </Link>
              </div>
            </div>
          </div>

          <div className="relative z-10 px-6 pb-16 pt-4 md:pb-20">
            <div className="mx-auto max-w-5xl overflow-hidden rounded-2xl border border-white/20 bg-white shadow-2xl">
              <img
                src="/hero-dashboard-demo.png"
                alt={tHero("demoAlt")}
                className="h-auto w-full object-cover"
              />
            </div>
          </div>
        </HeroSection>

        <section className="shrink-0 border-y border-[#EAECF0] bg-[#F9FAFB] py-6 sm:py-8">
          <div className="mx-auto max-w-6xl px-6">
            <UspBar />
          </div>
        </section>
      </div>

      <section id="diensten" className="w-full bg-white py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-[#101828] md:text-4xl">
              {tApproach("title")}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-[#667085]">
              {tApproach("intro")}
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {[
              { key: "ai", title: tApproach("aiTitle"), desc: tApproach("aiDesc"), icon: "lightbulb" },
              { key: "concept", title: tApproach("conceptTitle"), desc: tApproach("conceptDesc"), icon: "code" },
              { key: "robust", title: tApproach("robustTitle"), desc: tApproach("robustDesc"), icon: "shield" },
              { key: "fast", title: tApproach("fastTitle"), desc: tApproach("fastDesc"), icon: "lightning" },
            ].map(({ key, title, desc, icon }) => (
              <div key={key} className="rounded-2xl border border-[#EAECF0] bg-white p-8 shadow-lg backdrop-blur-sm transition-shadow hover:shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F9F5FF] text-[#7F56D9]">
                    {icon === "lightbulb" && (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    )}
                    {icon === "code" && (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                    )}
                    {icon === "shield" && (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    )}
                    {icon === "lightning" && (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-[#101828]">{title}</h3>
                </div>
                <p className="mt-3 text-[#667085]">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-[#EAECF0] bg-[#F9FAFB] py-20 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-[#101828] md:text-4xl">
              {tImpact("title")}
            </h2>
            <p className="mt-4 text-lg text-[#667085]">{tImpact("subtitle")}</p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              { label: tImpact("roiLabel"), value: tImpact("roiValue"), desc: tImpact("roiDesc") },
              { label: tImpact("timeLabel"), value: tImpact("timeValue"), desc: tImpact("timeDesc") },
              { label: tImpact("insightLabel"), value: tImpact("insightValue"), desc: tImpact("insightDesc") },
            ].map(({ label, value, desc }) => (
              <div key={label} className="rounded-2xl border border-[#EAECF0] bg-white p-6 shadow-sm">
                <p className="text-sm font-medium text-[#6941C6]">{label}</p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-[#101828]">{value}</p>
                <p className="mt-3 text-sm text-[#667085]">{desc}</p>
              </div>
            ))}
          </div>

          <p className="mt-5 text-center text-xs text-[#667085]">{tImpact("note")}</p>
        </div>
      </section>

      <section className="border-t border-[#EAECF0] bg-[#F9FAFB] py-20 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-[#101828] md:text-4xl">
              {tPortfolio("title")}
            </h2>
            <p className="mt-4 text-lg text-[#667085]">{tPortfolio("subtitle")}</p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {dashboardExamples.map(({ key, title, desc, kpis, series, rows }) => (
              <article
                key={key}
                className="rounded-2xl border border-[#EAECF0] bg-white p-6 shadow-lg transition-colors hover:border-[#EAECF0]"
              >
                <div className="rounded-xl border border-[#EAECF0] bg-white p-4">
                  <div className="grid grid-cols-2 gap-3">
                    {kpis.map((kpi) => (
                      <div key={kpi.label} className="rounded-lg border border-[#EAECF0] bg-[#F9FAFB] p-3">
                        <p className="text-[11px] text-[#667085]">{kpi.label}</p>
                        <p className="mt-1 text-lg font-bold text-[#101828]">{kpi.value}</p>
                        <p className="text-[11px] text-[#12B76A]">{kpi.trend}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 overflow-hidden rounded-lg border border-[#EAECF0] bg-[#F9FAFB] p-3">
                    <svg viewBox="0 0 100 100" className="h-20 w-full" preserveAspectRatio="none" aria-hidden>
                      <polyline
                        points={linePoints(series)}
                        fill="none"
                        stroke="#7F56D9"
                        strokeWidth="2"
                        vectorEffect="non-scaling-stroke"
                      />
                    </svg>
                  </div>

                  <div className="mt-4 overflow-hidden rounded-lg border border-[#EAECF0]">
                    <table className="w-full text-left text-xs">
                      <tbody>
                        {rows.map((row) => (
                          <tr key={row.name} className="border-b border-[#EAECF0] last:border-b-0">
                            <td className="px-2 py-2 text-[#344054]">{row.name}</td>
                            <td className="px-2 py-2 text-[#667085]">{row.amount}</td>
                            <td className="px-2 py-2 text-[#027A48]">{row.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <h3 className="mt-5 text-xl font-semibold text-[#101828]">{title}</h3>
                <p className="mt-2 text-sm text-[#667085]">{desc}</p>
                <Link
                  href="/login"
                  className="mt-5 inline-flex rounded-lg border border-[#EAECF0] px-4 py-2 text-sm font-semibold text-[#101828] transition-colors hover:bg-[#7F56D9]/10"
                >
                  {tPortfolio("viewDemo")}
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="hoe-werkt-het" className="border-t border-[#EAECF0] bg-[#F9FAFB] py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-[#101828] md:text-4xl">
              {tHow("title")}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-[#667085]">
              {tHow("subtitle")}
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#7F56D9] text-xl font-bold text-white">1</div>
              <h3 className="mt-6 text-lg font-semibold text-[#101828]">{tHow("step1Title")}</h3>
              <p className="mt-2 text-[#667085]">{tHow("step1Desc")}</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#7F56D9] text-xl font-bold text-white">2</div>
              <h3 className="mt-6 text-lg font-semibold text-[#101828]">{tHow("step2Title")}</h3>
              <p className="mt-2 text-[#667085]">{tHow("step2Desc")}</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#7F56D9] text-xl font-bold text-white">3</div>
              <h3 className="mt-6 text-lg font-semibold text-[#101828]">{tHow("step3Title")}</h3>
              <p className="mt-2 text-[#667085]">{tHow("step3Desc")}</p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link
              href="#contact"
              className="inline-flex rounded-xl bg-[#7F56D9] px-6 py-3.5 text-base font-semibold text-white shadow-lg transition-all hover:bg-[#6941C6]"
            >
              {tHow("cta")}
            </Link>
          </div>
        </div>
      </section>

      <section id="contact" className="w-full border-t border-[#EAECF0] bg-white py-20 md:py-28">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-[#101828] md:text-4xl">
            {tContact("title")}
          </h2>
          <p className="mt-4 text-lg text-[#667085]">
            {tContact("description")}
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/login"
              className="inline-flex rounded-xl bg-[#7F56D9] px-6 py-3.5 text-base font-semibold text-white shadow-lg transition-all hover:bg-[#6941C6]"
            >
              {tContact("ctaDashboard")}
            </Link>
            <a
              href={`mailto:${tContact("email")}`}
              className="inline-flex rounded-xl border-2 border-[#EAECF0] px-6 py-3.5 text-base font-semibold text-[#101828] transition-colors hover:bg-[#7F56D9]/10"
            >
              {tContact("email")}
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#EAECF0] bg-[#F9FAFB] py-12">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <Link href="/" className="text-lg font-bold text-[#101828]">
              Proceda
            </Link>
            <p className="text-sm text-[#667085]">{tFooter("tagline")}</p>
            <div className="flex gap-6">
              <Link href="/login" className="text-sm text-[#667085] hover:text-[#101828]">
                {tFooter("login")}
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
