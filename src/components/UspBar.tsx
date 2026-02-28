"use client";

import { useState, useEffect } from "react";

const USPS = [
  { title: "Maatwerk", desc: "Geen standaard templates" },
  { title: "Modern stack", desc: "React, Next.js, TypeScript" },
  { title: "AI & automatisering", desc: "Bedrijfsprocessen slimmer maken" },
  { title: "Snel & schaalbaar", desc: "Van MVP tot enterprise" },
];

export default function UspBar() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setActive((i) => (i + 1) % USPS.length);
    }, 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <>
      {/* Desktop: alle 4 naast elkaar met scheidingslijnen */}
      <div className="hidden sm:flex flex-wrap items-center justify-center gap-x-12 gap-y-6 text-center">
        <div>
          <p className="text-2xl font-bold text-zinc-900">{USPS[0].title}</p>
          <p className="text-sm text-zinc-500">{USPS[0].desc}</p>
        </div>
        <div className="h-8 w-px bg-zinc-300" aria-hidden />
        <div>
          <p className="text-2xl font-bold text-zinc-900">{USPS[1].title}</p>
          <p className="text-sm text-zinc-500">{USPS[1].desc}</p>
        </div>
        <div className="h-8 w-px bg-zinc-300" aria-hidden />
        <div>
          <p className="text-2xl font-bold text-zinc-900">{USPS[2].title}</p>
          <p className="text-sm text-zinc-500">{USPS[2].desc}</p>
        </div>
        <div className="h-8 w-px bg-zinc-300" aria-hidden />
        <div>
          <p className="text-2xl font-bold text-zinc-900">{USPS[3].title}</p>
          <p className="text-sm text-zinc-500">{USPS[3].desc}</p>
        </div>
      </div>

      {/* Mobile: slideshow - 1 USP per slide */}
      <div className="sm:hidden w-full">
        <div className="mx-auto max-w-sm text-center">
          <p className="text-2xl font-bold text-zinc-900">{USPS[active].title}</p>
          <p className="mt-1 text-sm text-zinc-500">{USPS[active].desc}</p>
        </div>
        <div className="mt-4 flex justify-center gap-2">
          {USPS.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              className={`h-2 rounded-full transition-all ${
                i === active ? "w-6 bg-zinc-900" : "w-2 bg-zinc-300"
              }`}
              aria-label={`Ga naar ${USPS[i].title}`}
              aria-current={i === active ? "true" : undefined}
            />
          ))}
        </div>
      </div>
    </>
  );
}
