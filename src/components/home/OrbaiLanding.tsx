import { Mail, MessageSquare, Sparkles, TrendingUp, Zap } from "lucide-react";
import { getTranslations } from "next-intl/server";
import {
  AgentCapabilities,
  AgentDemoCard,
  AgentFooterRich,
  AgentPlatformSection,
  AgentProcessSection,
  AgentStatsGrid,
  AgentTestimonialGrid,
} from "./agent/AgentSections";
import HeroSection from "./HeroSection";
import { OrbaiFaq } from "./orbai/OrbaiInteractive";
import { BookingFooterCta } from "@/components/booking/BookingFooterCta";

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#B692F6]">{children}</p>
  );
}

function SectionHeader({
  eyebrow,
  title,
  subtitle,
  className = "text-center",
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <div className={`mx-auto max-w-3xl ${className}`}>
      <SectionEyebrow>{eyebrow}</SectionEyebrow>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-[2.75rem] lg:leading-tight">
        {title}
      </h2>
      {subtitle ? <p className="mt-4 text-base text-white/55 sm:text-lg">{subtitle}</p> : null}
    </div>
  );
}

export default async function OrbaiLanding() {
  const t = await getTranslations("home.orbai");

  const faqItems = t.raw("faq.items") as { q: string; a: string }[];
  const testimonials = t.raw("customers.items") as Array<{ quote: string; name: string; role: string }>;
  const platformItems = t.raw("platform.items") as Array<{
    id: string;
    label: string;
    title: string;
    description: string;
    cta: string;
  }>;
  const capabilities = t.raw("capabilities.items") as Array<{
    title: string;
    description: string;
    badge?: string;
  }>;
  const stats = t.raw("statsGrid") as Array<{ value: string; label: string; sub?: string }>;
  const footerColumns = t.raw("footer.columns") as Array<{
    title: string;
    links: { label: string; href: string }[];
  }>;

  const processSteps = (["step1", "step2", "step3"] as const).map((key) => ({
    title: t(`process.${key}Title`),
    description: t(`process.${key}Desc`),
  }));

  const services = [
    { icon: TrendingUp, key: "strategy" },
    { icon: MessageSquare, key: "content" },
    { icon: Mail, key: "chatbots" },
    { icon: Zap, key: "automation" },
  ] as const;

  return (
    <main className="relative flex-1 bg-[#0A0A0A] text-white">
      <HeroSection
        eyebrow={t("hero.eyebrow")}
        title={t("hero.title")}
        subtitle={t("hero.subtitle")}
        localBadge={t("hero.localBadge")}
        ctaPrimary={t("hero.ctaPrimary")}
        ctaSecondary={t("hero.ctaSecondary")}
        mockupTitle={t("mockup.title")}
        mockupSubtitle={t("mockup.subtitle")}
      />

      {/* Demo preview */}
      <section className="px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <AgentDemoCard
            label={t("demo.label")}
            title={t("demo.title")}
            subtitle={t("demo.subtitle")}
            duration={t("demo.duration")}
          />
        </div>
      </section>

      {/* Platform */}
      <section id="platform" className="scroll-mt-28 px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <SectionHeader
            eyebrow={t("platform.label")}
            title={t("platform.title")}
            subtitle={t("platform.subtitle")}
          />
          <div className="mt-14">
            <AgentPlatformSection items={platformItems} />
          </div>
        </div>
      </section>

      {/* Process */}
      <section id="process" className="scroll-mt-28 border-y border-white/[0.06] px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <SectionHeader
            eyebrow={t("process.label")}
            title={t("process.title")}
            subtitle={t("process.subtitle")}
          />
          <div className="mt-14">
            <AgentProcessSection
              steps={processSteps}
              stat={t("process.stat")}
              statLabel={t("process.statLabel")}
              quote={testimonials[0]?.quote ?? t("hero.quote")}
              quoteAuthor={
                testimonials[0]
                  ? `${testimonials[0].name}, ${testimonials[0].role}`
                  : t("hero.quoteAuthor")
              }
            />
          </div>
        </div>
      </section>

      {/* Services / Agents */}
      <section id="services" className="scroll-mt-28 px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <SectionHeader
            eyebrow={t("services.label")}
            title={t("services.title")}
            subtitle={t("services.subtitle")}
          />
          <div className="mt-14 grid gap-4 sm:grid-cols-2">
            {services.map(({ icon: Icon, key }) => (
              <article
                key={key}
                className="rounded-2xl border border-white/[0.08] bg-[#111111]/60 p-6 transition-colors hover:border-white/15"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#7F56D9]/20 text-[#B692F6]">
                    <Icon className="h-5 w-5" aria-hidden />
                  </div>
                  <h3 className="text-lg font-semibold text-white">{t(`services.${key}Title`)}</h3>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-white/55">
                  {t(`services.${key}Desc`)}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section id="features" className="scroll-mt-28 border-y border-white/[0.06] bg-[#080808] px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <SectionHeader
            eyebrow={t("capabilities.label")}
            title={t("capabilities.title")}
            subtitle={t("capabilities.subtitle")}
          />
          <div className="mt-14">
            <AgentCapabilities
              items={capabilities}
              securityTitle={t("capabilities.securityTitle")}
              securityDesc={t("capabilities.securityDesc")}
            />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <SectionHeader
            eyebrow={t("stats.label")}
            title={t("stats.title")}
            subtitle={t("stats.subtitle")}
          />
          <div className="mt-14">
            <AgentStatsGrid stats={stats} />
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="customers" className="scroll-mt-28 px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <SectionHeader
            eyebrow={t("customers.label")}
            title={t("customers.title")}
            subtitle={t("customers.subtitle")}
          />
          <div className="mt-14">
            <AgentTestimonialGrid items={testimonials} />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="contact" className="scroll-mt-28 px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl">
          <SectionHeader
            eyebrow={t("faq.label")}
            title={t("faq.title")}
            subtitle={t("faq.subtitle")}
          />
          <div className="mt-14">
            <OrbaiFaq items={faqItems} />
          </div>
          <p className="mt-8 text-center text-sm text-white/45">
            {t("faq.contact")}{" "}
            <a href="mailto:hello@proceda.nl" className="font-semibold text-[#B692F6] hover:underline">
              hello@proceda.nl
            </a>
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-8 pt-4">
        <div className="mx-auto max-w-4xl rounded-3xl border border-white/[0.08] bg-gradient-to-b from-[#7F56D9]/20 to-[#111111] px-8 py-16 text-center">
          <Sparkles className="mx-auto h-8 w-8 text-[#B692F6]" aria-hidden />
          <h2 className="mt-4 text-2xl font-semibold text-white sm:text-3xl">{t("footer.ctaTitle")}</h2>
          <p className="mx-auto mt-3 max-w-lg text-white/55">{t("footer.ctaSubtitle")}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <BookingFooterCta label={t("hero.ctaPrimary")} />
          </div>
        </div>
      </section>

      <AgentFooterRich columns={footerColumns} copyright={t("footer.copyright")} />
    </main>
  );
}
