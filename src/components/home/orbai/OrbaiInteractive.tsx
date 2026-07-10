"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Check, Minus } from "lucide-react";

export function OrbaiMarquee({ items }: { items: string[] }) {
  const doubled = [...items, ...items];
  return (
    <div className="orbai-marquee-mask overflow-hidden py-4">
      <div className="orbai-marquee-track flex w-max gap-3">
        {doubled.map((item, i) => (
          <span
            key={`${item}-${i}`}
            className="shrink-0 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 backdrop-blur-sm"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

type FaqItem = { q: string; a: string };

export function OrbaiFaq({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="space-y-3">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div
            key={item.q}
            className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm"
          >
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
              aria-expanded={isOpen}
            >
              <span className="font-semibold text-white">{item.q}</span>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#7F56D9]/20 text-[#B692F6]">
                {isOpen ? "−" : "+"}
              </span>
            </button>
            {isOpen ? (
              <div className="border-t border-white/10 px-6 pb-5 pt-2 text-sm leading-relaxed text-white/60">
                {item.a}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

type PricingPlan = {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  popular?: boolean;
  cta: string;
};

export function OrbaiPricing({
  plans,
  monthlyLabel,
  yearlyLabel,
  yearlyDiscount,
}: {
  plans: PricingPlan[];
  monthlyLabel: string;
  yearlyLabel: string;
  yearlyDiscount: string;
}) {
  const [yearly, setYearly] = useState(false);

  return (
    <div>
      <div className="mb-10 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => setYearly(false)}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            !yearly ? "bg-white text-[#101828]" : "text-white/60 hover:text-white"
          }`}
        >
          {monthlyLabel}
        </button>
        <button
          type="button"
          onClick={() => setYearly(true)}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            yearly ? "bg-white text-[#101828]" : "text-white/60 hover:text-white"
          }`}
        >
          {yearlyLabel}
          <span className="rounded-full bg-[#7F56D9]/30 px-2 py-0.5 text-xs font-semibold text-[#B692F6]">
            {yearlyDiscount}
          </span>
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {plans.map((plan) => {
          const price = yearly ? plan.price.replace(/^\d+/, (n) => String(Math.round(Number(n) * 0.7))) : plan.price;
          return (
            <article
              key={plan.id}
              className={`relative flex flex-col rounded-3xl border p-8 ${
                plan.popular
                  ? "border-[#7F56D9] bg-[#7F56D9]/10 shadow-lg shadow-[#7F56D9]/20"
                  : "border-white/10 bg-white/5"
              }`}
            >
              {plan.popular ? (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#7F56D9] px-3 py-1 text-xs font-semibold text-white">
                  Popular
                </span>
              ) : null}
              <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tight text-white">€{price}</span>
                <span className="text-white/50">{plan.period}</span>
              </div>
              <p className="mt-3 text-sm text-white/60">{plan.description}</p>
              <a
                href="mailto:hello@proceda.nl"
                className={`mt-6 block rounded-xl py-3 text-center text-sm font-semibold transition-colors ${
                  plan.popular
                    ? "bg-[#7F56D9] text-white hover:bg-[#6941C6]"
                    : "border border-white/20 bg-white/5 text-white hover:bg-white/10"
                }`}
              >
                {plan.cta}
              </a>
              <ul className="mt-6 flex-1 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-white/80">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#B692F6]" aria-hidden />
                    {f}
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>
    </div>
  );
}

type CarouselItem = {
  id: string;
  title: string;
  description: string;
  stat1Value: string;
  stat1Label: string;
  stat2Value: string;
  stat2Label: string;
  image?: string;
};

export function OrbaiProjectsCarousel({ items }: { items: CarouselItem[] }) {
  const [index, setIndex] = useState(0);
  const item = items[index] ?? items[0];

  if (!item) return null;

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm">
      <div className="flex gap-2 border-b border-white/10 p-4">
        {items.map((p, i) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setIndex(i)}
            className={`rounded-lg px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
              i === index ? "bg-white/10 text-white" : "text-white/50 hover:text-white/80"
            }`}
          >
            {p.id}
          </button>
        ))}
      </div>
      <div className="grid gap-8 p-8 text-white lg:grid-cols-2 lg:items-center lg:p-12">
        <div>
          <p className="text-sm font-semibold text-[#B692F6]">{String(index + 1).padStart(2, "0")}</p>
          <h3 className="mt-2 text-2xl font-bold sm:text-3xl">{item.title}</h3>
          <p className="mt-4 text-white/70">{item.description}</p>
          <div className="mt-8 flex gap-8">
            <div>
              <p className="text-3xl font-bold">{item.stat1Value}</p>
              <p className="mt-1 text-sm text-white/60">{item.stat1Label}</p>
            </div>
            <div>
              <p className="text-3xl font-bold">{item.stat2Value}</p>
              <p className="mt-1 text-sm text-white/60">{item.stat2Label}</p>
            </div>
          </div>
        </div>
        {item.image ? (
          <div className="overflow-hidden rounded-2xl border border-white/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.image} alt="" className="aspect-video w-full object-cover" />
          </div>
        ) : (
          <div className="flex aspect-video items-center justify-center rounded-2xl border border-white/10 bg-white/5">
            <span className="text-6xl font-bold text-white/10">P</span>
          </div>
        )}
      </div>
    </div>
  );
}

type Testimonial = {
  quote: string;
  name: string;
  role: string;
};

export function OrbaiTestimonials({ items }: { items: Testimonial[] }) {
  const [index, setIndex] = useState(0);
  const current = items[index] ?? items[0];
  if (!current) return null;

  return (
    <div>
      <blockquote className="text-xl font-medium leading-relaxed text-white sm:text-2xl">
        &ldquo;{current.quote}&rdquo;
      </blockquote>
      <div className="mt-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#7F56D9]/30 text-sm font-bold text-[#B692F6]">
            {current.name.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-white">{current.name}</p>
            <p className="text-sm text-white/50">{current.role}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setIndex((i) => (i - 1 + items.length) % items.length)}
            className="rounded-full border border-white/15 p-2 text-white/70 hover:bg-white/10 hover:text-white"
            aria-label="Previous"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => setIndex((i) => (i + 1) % items.length)}
            className="rounded-full border border-white/15 p-2 text-white/70 hover:bg-white/10 hover:text-white"
            aria-label="Next"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

type TeamMember = { name: string; role: string };

export function OrbaiTeamCarousel({ members }: { members: TeamMember[] }) {
  const [offset, setOffset] = useState(0);
  const visible = 4;

  return (
    <div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setOffset((o) => Math.max(0, o - 1))}
          className="rounded-full border border-white/15 p-2 text-white/70 hover:bg-white/10 hover:text-white"
          aria-label="Previous"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => setOffset((o) => Math.min(members.length - visible, o + 1))}
          className="rounded-full border border-white/15 p-2 text-white/70 hover:bg-white/10 hover:text-white"
          aria-label="Next"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
      <div className="mt-6 overflow-hidden">
        <div
          className="flex gap-4 transition-transform duration-300"
          style={{ transform: `translateX(-${offset * (100 / visible)}%)` }}
        >
          {members.map((m) => (
            <div
              key={m.name}
              className="w-[calc(25%-12px)] min-w-[calc(25%-12px)] shrink-0 rounded-2xl border border-white/10 bg-white/5 p-6 text-center"
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#7F56D9]/40 to-[#6941C6]/20 text-xl font-bold text-[#B692F6]">
                {m.name.charAt(0)}
              </div>
              <p className="mt-4 font-semibold text-white">{m.name}</p>
              <p className="mt-1 text-sm text-white/50">{m.role}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function OrbaiComparison({
  usLabel,
  themLabel,
  usItems,
  themItems,
  cta,
}: {
  usLabel: string;
  themLabel: string;
  usItems: string[];
  themItems: string[];
  cta: string;
}) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="rounded-3xl border-2 border-[#7F56D9] bg-[#7F56D9]/10 p-8">
        <h3 className="text-xl font-bold text-white">{usLabel}</h3>
        <ul className="mt-6 space-y-3">
          {usItems.map((item) => (
            <li key={item} className="flex items-center gap-2 text-sm text-white/80">
              <Check className="h-4 w-4 shrink-0 text-[#B692F6]" aria-hidden />
              {item}
            </li>
          ))}
        </ul>
        <a
          href="mailto:hello@proceda.nl"
          className="mt-8 inline-block rounded-xl bg-[#7F56D9] px-6 py-3 text-sm font-semibold text-white hover:bg-[#6941C6]"
        >
          {cta}
        </a>
      </div>
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
        <h3 className="text-xl font-bold text-white/50">{themLabel}</h3>
        <ul className="mt-6 space-y-3">
          {themItems.map((item) => (
            <li key={item} className="flex items-center gap-2 text-sm text-white/40">
              <Minus className="h-4 w-4 shrink-0" aria-hidden />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
