"use client";

import ShaderBackground from "@/components/ui/shader-background";

export default function HeroSection({ children }: { children: React.ReactNode }) {
  return (
    <section className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <ShaderBackground className="absolute inset-0 z-0" />
      <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-transparent via-transparent to-white/90" aria-hidden />
      {children}
    </section>
  );
}
