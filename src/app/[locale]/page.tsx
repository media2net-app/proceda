import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import UspBar from "@/components/UspBar";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default async function HomePage() {
  const t = await getTranslations();
  const tNav = await getTranslations("nav");
  const tHero = await getTranslations("hero");
  const tApproach = await getTranslations("approach");
  const tHow = await getTranslations("howItWorks");
  const tContact = await getTranslations("contact");
  const tFooter = await getTranslations("footer");

  return (
    <div className="min-h-screen bg-white">
      <div className="flex min-h-screen flex-col">
        <section className="hero-purple-glow relative flex min-h-0 flex-1 flex-col overflow-hidden bg-[#1e1b4b]">
          <div className="hero-blur-glow" aria-hidden />
          <header className="relative z-10 shrink-0 border-b border-white/10">
            <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
              <Link href="/" className="text-xl font-bold tracking-tight text-white">
                Proceda
              </Link>
              <div className="flex items-center gap-4">
                <Link href="#hoe-werkt-het" className="text-sm font-medium text-white/90 hover:text-white">
                  {tNav("howItWorks")}
                </Link>
                <Link href="#diensten" className="text-sm font-medium text-white/90 hover:text-white">
                  {tNav("services")}
                </Link>
                <LanguageSwitcher />
                <Link
                  href="/login"
                  className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-[#312e81] transition-colors hover:bg-white/95"
                >
                  {tNav("login")}
                </Link>
              </div>
            </nav>
          </header>

          <div className="relative z-10 flex flex-1 flex-col">
            <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
              <div className="mx-auto max-w-4xl">
                <p className="text-sm font-medium uppercase tracking-widest text-white/70">
                  {tHero("tagline")}
                </p>
                <h1 className="mt-4 text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl">
                  {tHero("headline")}
                </h1>
                <p className="mx-auto mt-6 max-w-2xl text-lg text-white/90 md:text-xl">
                  {tHero("description")}
                </p>
                <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                  <Link
                    href="/login"
                    className="inline-flex rounded-xl bg-white px-6 py-3.5 text-base font-semibold text-[#312e81] shadow-lg transition-all hover:bg-white/95"
                  >
                    {tHero("ctaDashboard")}
                  </Link>
                  <Link
                    href="#contact"
                    className="inline-flex rounded-xl border-2 border-white/80 px-6 py-3.5 text-base font-semibold text-white transition-colors hover:bg-white/10"
                  >
                    {tHero("ctaContact")}
                  </Link>
                </div>
              </div>
            </div>
            <div className="relative z-10 flex flex-wrap items-center justify-center gap-8 border-t border-white/10 py-6 text-sm text-white/70">
              <span>{tHero("bar1")}</span>
              <span>{tHero("bar2")}</span>
              <span>{tHero("bar3")}</span>
            </div>
          </div>
        </section>

        <section className="shrink-0 border-y border-zinc-200 bg-white py-6 sm:py-8">
          <div className="mx-auto max-w-6xl px-6">
            <UspBar />
          </div>
        </section>
      </div>

      <section id="diensten" className="w-full bg-[#1e1b4b] py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
              {tApproach("title")}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80">
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
              <div key={key} className="rounded-2xl border border-white/10 bg-white/95 p-8 shadow-lg backdrop-blur-sm transition-shadow hover:shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1e1b4b]/20 text-white">
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
                  <h3 className="text-lg font-semibold text-zinc-900">{title}</h3>
                </div>
                <p className="mt-3 text-zinc-600">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="hoe-werkt-het" className="border-t border-zinc-200 bg-white py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 md:text-4xl">
              {tHow("title")}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-600">
              {tHow("subtitle")}
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#1e1b4b] text-xl font-bold text-white">1</div>
              <h3 className="mt-6 text-lg font-semibold text-zinc-900">{tHow("step1Title")}</h3>
              <p className="mt-2 text-zinc-600">{tHow("step1Desc")}</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#1e1b4b] text-xl font-bold text-white">2</div>
              <h3 className="mt-6 text-lg font-semibold text-zinc-900">{tHow("step2Title")}</h3>
              <p className="mt-2 text-zinc-600">{tHow("step2Desc")}</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#1e1b4b] text-xl font-bold text-white">3</div>
              <h3 className="mt-6 text-lg font-semibold text-zinc-900">{tHow("step3Title")}</h3>
              <p className="mt-2 text-zinc-600">{tHow("step3Desc")}</p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link
              href="#contact"
              className="inline-flex rounded-xl bg-[#1e1b4b] px-6 py-3.5 text-base font-semibold text-white shadow-lg transition-all hover:bg-[#312e81]"
            >
              {tHow("cta")}
            </Link>
          </div>
        </div>
      </section>

      <section id="contact" className="w-full border-t border-white/10 bg-[#1e1b4b] py-20 md:py-28">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
            {tContact("title")}
          </h2>
          <p className="mt-4 text-lg text-white/80">
            {tContact("description")}
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/login"
              className="inline-flex rounded-xl bg-white px-6 py-3.5 text-base font-semibold text-[#1e1b4b] shadow-lg transition-all hover:bg-white/95"
            >
              {tContact("ctaDashboard")}
            </Link>
            <a
              href={`mailto:${tContact("email")}`}
              className="inline-flex rounded-xl border-2 border-white/80 px-6 py-3.5 text-base font-semibold text-white transition-colors hover:bg-white/10"
            >
              {tContact("email")}
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-zinc-200 bg-zinc-900 py-12">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <Link href="/" className="text-lg font-bold text-white">
              Proceda
            </Link>
            <p className="text-sm text-zinc-400">{tFooter("tagline")}</p>
            <div className="flex gap-6">
              <Link href="/login" className="text-sm text-zinc-400 hover:text-white">
                {tFooter("login")}
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
