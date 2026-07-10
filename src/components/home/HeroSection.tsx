"use client";

import { Server } from "lucide-react";
import DigitalSerenity, { AnimatedWords } from "@/components/ui/digital-serenity-animated-landing-page";
import { GlassButton } from "@/components/ui/glass-button";
import { BookingCtaButton } from "@/components/booking/BookingCtaButton";
import { AgentHeroMockup, AgentLogoMarquee } from "./agent/AgentSections";

type HeroSectionProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  localBadge: string;
  ctaPrimary: string;
  ctaSecondary: string;
  mockupTitle: string;
  mockupSubtitle: string;
};

export default function HeroSection({
  eyebrow,
  title,
  subtitle,
  localBadge,
  ctaPrimary,
  ctaSecondary,
  mockupTitle,
  mockupSubtitle,
}: HeroSectionProps) {
  return (
    <DigitalSerenity className="px-6 pb-8 pt-28 sm:pb-12 sm:pt-36">
      <div className="relative mx-auto max-w-4xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#B692F6]">
          <AnimatedWords text={eyebrow} baseDelay={0} step={80} />
        </p>

        <h1 className="mt-4 text-4xl font-semibold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl">
          <AnimatedWords text={title} baseDelay={400} step={100} />
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-white/55 sm:text-xl">
          <AnimatedWords text={subtitle} baseDelay={900} step={60} />
        </p>

        <p
          className="mx-auto mt-6 inline-flex items-center gap-2 rounded-full border border-[#7F56D9]/30 bg-[#7F56D9]/10 px-4 py-2 text-sm text-[#B692F6] opacity-0"
          style={{ animation: "ds-word-appear 0.8s ease-out forwards", animationDelay: "1.6s" }}
        >
          <Server className="h-4 w-4 shrink-0" aria-hidden />
          {localBadge}
        </p>

        <div
          className="mt-8 flex flex-wrap items-center justify-center gap-3 opacity-0"
          style={{ animation: "ds-word-appear 0.8s ease-out forwards", animationDelay: "1.8s" }}
        >
          <BookingCtaButton showArrow>{ctaPrimary}</BookingCtaButton>
          <GlassButton href="#platform" variant="secondary">
            {ctaSecondary}
          </GlassButton>
        </div>
      </div>

      <div
        className="opacity-0"
        style={{ animation: "ds-word-appear 0.8s ease-out forwards", animationDelay: "2s" }}
      >
        <AgentLogoMarquee />
      </div>

      <div
        className="opacity-0"
        style={{ animation: "ds-word-appear 0.8s ease-out forwards", animationDelay: "2.2s" }}
      >
        <AgentHeroMockup title={mockupTitle} subtitle={mockupSubtitle} />
      </div>
    </DigitalSerenity>
  );
}
