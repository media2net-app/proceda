"use client";

import {
  Activity,
  Bot,
  ChevronRight,
  Link2,
  Play,
  Server,
  Shield,
} from "lucide-react";
import {
  INTEGRATION_LOGOS,
  integrationLogoUrl,
} from "@/lib/integration-logos";

function LogoMarqueeRow({ copy, ariaHidden }: { copy: number; ariaHidden?: boolean }) {
  return (
    <div
      className="flex shrink-0 items-center gap-10 pr-10 sm:gap-14 sm:pr-14"
      aria-hidden={ariaHidden || undefined}
    >
      {INTEGRATION_LOGOS.map((logo) => (
        <img
          key={`${copy}-${logo.slug}`}
          src={integrationLogoUrl(logo.slug)}
          alt={logo.name}
          width={120}
          height={28}
          loading="lazy"
          decoding="async"
          className="h-7 w-auto max-w-[7.5rem] shrink-0 object-contain opacity-45 brightness-0 invert"
        />
      ))}
    </div>
  );
}

export function AgentLogoMarquee() {
  return (
    <div className="agent-marquee-mask mt-14 overflow-hidden border-y border-white/[0.06] py-8">
      <div className="agent-marquee-track">
        <LogoMarqueeRow copy={0} />
        <LogoMarqueeRow copy={1} ariaHidden />
      </div>
    </div>
  );
}

export function AgentHeroMockup({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="agent-grid-bg relative mx-auto mt-16 max-w-5xl overflow-hidden rounded-2xl border border-white/10 bg-[#111111] p-1 shadow-2xl shadow-[#7F56D9]/10">
      <div className="rounded-xl border border-white/[0.06] bg-[#0d0d0d] p-4 sm:p-6">
        <div className="mb-4 flex items-center gap-2 border-b border-white/[0.06] pb-4">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-500/80" />
          <span className="ml-3 text-xs text-white/40">command.proceda.local</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-[1fr_1.4fr]">
          <div className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-wider text-[#B692F6]">{title}</p>
            <p className="text-sm text-white/50">{subtitle}</p>
            {["Intake Agent", "Email Agent", "Knowledge Agent", "Creative QA"].map((agent, i) => (
              <div
                key={agent}
                className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2.5"
              >
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#7F56D9]/20 text-[#B692F6]">
                    <Bot className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-xs font-medium text-white/80">{agent}</span>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    i < 3 ? "bg-emerald-500/15 text-emerald-400" : "bg-white/10 text-white/40"
                  }`}
                >
                  {i < 3 ? "Live" : "Fase 2"}
                </span>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs text-white/40">Runs vandaag</span>
              <Activity className="h-4 w-4 text-[#B692F6]" />
            </div>
            <div className="flex h-24 items-end gap-1.5">
              {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-sm bg-gradient-to-t from-[#7F56D9] to-[#B692F6]/60"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                { l: "Success", v: "94%" },
                { l: "Pending", v: "12" },
                { l: "Avg", v: "2.1m" },
              ].map(({ l, v }) => (
                <div key={l} className="rounded-lg bg-white/[0.03] px-2 py-2 text-center">
                  <p className="text-sm font-bold text-white">{v}</p>
                  <p className="text-[10px] text-white/40">{l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

type PlatformItem = {
  id: string;
  label: string;
  title: string;
  description: string;
  cta: string;
};

export function AgentPlatformSection({ items }: { items: PlatformItem[] }) {
  const icons = [Link2, Bot, Shield, Server];

  return (
    <div className="space-y-6">
      {items.map((item, i) => {
        const Icon = icons[i] ?? Bot;
        const reversed = i % 2 === 1;
        return (
          <article
            key={item.id}
            className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111111]/80"
          >
            <div
              className={`grid lg:grid-cols-2 ${reversed ? "lg:[direction:rtl]" : ""}`}
            >
              <div className={`flex flex-col justify-center p-8 sm:p-10 lg:[direction:ltr] ${reversed ? "lg:order-2" : ""}`}>
                <p className="text-xs font-semibold uppercase tracking-widest text-[#B692F6]">
                  {item.label}
                </p>
                <h3 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                  {item.title}
                </h3>
                <p className="mt-4 text-sm leading-relaxed text-white/55 sm:text-base">
                  {item.description}
                </p>
                <a
                  href={`#${item.id}`}
                  className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-[#B692F6] hover:text-white"
                >
                  {item.cta}
                  <ChevronRight className="h-4 w-4" />
                </a>
              </div>
              <div className={`agent-grid-bg relative min-h-[220px] border-white/[0.06] p-6 lg:min-h-[280px] lg:[direction:ltr] ${reversed ? "border-r lg:border-r-0 lg:border-l" : "border-t lg:border-l lg:border-t-0"}`}>
                <div className="flex h-full flex-col justify-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#7F56D9]/20 text-[#B692F6]">
                    <Icon className="h-8 w-8" />
                  </div>
                  <div className="mx-auto mt-6 w-full max-w-xs space-y-2">
                    {[1, 2, 3].map((n) => (
                      <div
                        key={n}
                        className="h-2 rounded-full bg-white/[0.06]"
                        style={{ width: `${100 - n * 15}%`, marginLeft: n === 2 ? "auto" : undefined, marginRight: n === 2 ? "auto" : undefined }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

type ProcessStep = { title: string; description: string };

export function AgentProcessSection({
  steps,
  stat,
  statLabel,
  quote,
  quoteAuthor,
}: {
  steps: ProcessStep[];
  stat: string;
  statLabel: string;
  quote: string;
  quoteAuthor: string;
}) {
  return (
    <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
      <div className="space-y-4">
        {steps.map((step, i) => (
          <article
            key={step.title}
            className="rounded-2xl border border-white/[0.08] bg-[#111111]/60 p-6"
          >
            <p className="text-xs font-bold text-[#B692F6]">0{i + 1}</p>
            <h3 className="mt-2 text-lg font-semibold text-white">{step.title}</h3>
            <p className="mt-2 text-sm text-white/55">{step.description}</p>
          </article>
        ))}
      </div>
      <div className="flex flex-col gap-6">
        <div className="rounded-2xl border border-[#7F56D9]/30 bg-[#7F56D9]/10 p-8">
          <p className="text-4xl font-bold text-white">{stat}</p>
          <p className="mt-2 text-sm text-white/55">{statLabel}</p>
        </div>
        <blockquote className="rounded-2xl border border-white/[0.08] bg-[#111111]/60 p-6">
          <p className="text-sm leading-relaxed text-white/80">&ldquo;{quote}&rdquo;</p>
          <footer className="mt-4 text-xs text-white/45">{quoteAuthor}</footer>
        </blockquote>
      </div>
    </div>
  );
}

type Capability = { title: string; description: string; badge?: string };

export function AgentCapabilities({
  items,
  securityTitle,
  securityDesc,
}: {
  items: Capability[];
  securityTitle: string;
  securityDesc: string;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {items.map((item) => (
        <article
          key={item.title}
          className="rounded-2xl border border-white/[0.08] bg-[#111111]/60 p-6"
        >
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-white">{item.title}</h3>
            {item.badge ? (
              <span className="rounded-full bg-[#7F56D9]/20 px-2 py-0.5 text-[10px] font-semibold uppercase text-[#B692F6]">
                {item.badge}
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-sm text-white/55">{item.description}</p>
        </article>
      ))}
      <article className="rounded-2xl border border-[#7F56D9]/25 bg-gradient-to-br from-[#7F56D9]/15 to-transparent p-6 sm:col-span-2">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#7F56D9]/30">
            <Shield className="h-5 w-5 text-[#B692F6]" />
          </div>
          <div>
            <h3 className="font-semibold text-white">{securityTitle}</h3>
            <p className="mt-2 text-sm text-white/55">{securityDesc}</p>
          </div>
        </div>
      </article>
    </div>
  );
}

type Stat = { value: string; label: string; sub?: string };

export function AgentStatsGrid({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid gap-px overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.08] sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="bg-[#0A0A0A] p-8">
          <p className="text-3xl font-bold tracking-tight text-white sm:text-4xl">{stat.value}</p>
          <p className="mt-2 text-sm font-medium text-white/80">{stat.label}</p>
          {stat.sub ? <p className="mt-1 text-xs text-white/40">{stat.sub}</p> : null}
        </div>
      ))}
    </div>
  );
}

type Testimonial = { quote: string; name: string; role: string };

export function AgentTestimonialGrid({ items }: { items: Testimonial[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <blockquote
          key={item.name}
          className="flex flex-col rounded-2xl border border-white/[0.08] bg-[#111111]/60 p-6"
        >
          <p className="flex-1 text-sm leading-relaxed text-white/75">&ldquo;{item.quote}&rdquo;</p>
          <footer className="mt-6 flex items-center gap-3 border-t border-white/[0.06] pt-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#7F56D9]/25 text-xs font-bold text-[#B692F6]">
              {item.name.charAt(0)}
            </span>
            <div>
              <p className="text-sm font-semibold text-white">{item.name}</p>
              <p className="text-xs text-white/45">{item.role}</p>
            </div>
          </footer>
        </blockquote>
      ))}
    </div>
  );
}

export function AgentFooterRich({
  columns,
  copyright,
}: {
  columns: { title: string; links: { label: string; href: string }[] }[];
  copyright: string;
}) {
  return (
    <footer className="border-t border-white/[0.08] bg-[#080808] px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <p className="text-lg font-bold text-white">Proceda</p>
            <p className="mt-3 max-w-xs text-sm text-white/45">
              AI-agents lokaal op jouw Mac Mini — 24/7 onder jouw regie.
            </p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <p className="text-xs font-semibold uppercase tracking-wider text-white/50">{col.title}</p>
              <ul className="mt-4 space-y-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-sm text-white/45 hover:text-white">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-12 border-t border-white/[0.06] pt-8 text-center text-xs text-white/30">
          {copyright}
        </p>
      </div>
    </footer>
  );
}

export function AgentDemoCard({
  label,
  title,
  subtitle,
  duration,
}: {
  label: string;
  title: string;
  subtitle: string;
  duration: string;
}) {
  return (
    <div className="agent-grid-bg overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111111]/80">
      <div className="grid lg:grid-cols-2">
        <div className="flex aspect-video items-center justify-center bg-black/40 lg:aspect-auto lg:min-h-[280px]">
          <button
            type="button"
            className="flex h-16 w-16 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-sm transition-transform hover:scale-105"
            aria-label={title}
          >
            <Play className="ml-1 h-6 w-6 fill-white" />
          </button>
        </div>
        <div className="flex flex-col justify-center p-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#B692F6]">{label}</p>
          <h3 className="mt-2 text-xl font-semibold text-white">{title}</h3>
          <p className="mt-2 text-sm text-white/55">{subtitle}</p>
          <p className="mt-4 text-xs text-white/35">{duration}</p>
        </div>
      </div>
    </div>
  );
}
