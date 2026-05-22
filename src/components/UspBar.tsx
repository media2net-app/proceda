"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

export default function UspBar() {
  const t = useTranslations("usp");
  const [active, setActive] = useState(0);

  const items = [
    { title: t("maatwerk"), desc: t("maatwerkDesc") },
    { title: t("modernStack"), desc: t("modernStackDesc") },
    { title: t("aiAutomation"), desc: t("aiAutomationDesc") },
    { title: t("fastScalable"), desc: t("fastScalableDesc") },
  ];

  useEffect(() => {
    const id = setInterval(() => setActive((i) => (i + 1) % items.length), 4000);
    return () => clearInterval(id);
  }, [items.length]);

  return (
    <>
      <div className="hidden sm:flex flex-wrap items-center justify-center gap-x-12 gap-y-6 text-center">
        <div>
          <p className="text-2xl font-bold text-[#101828]">{items[0].title}</p>
          <p className="text-sm text-[#667085]">{items[0].desc}</p>
        </div>
        <div className="h-8 w-px bg-[#EAECF0]" aria-hidden />
        <div>
          <p className="text-2xl font-bold text-[#101828]">{items[1].title}</p>
          <p className="text-sm text-[#667085]">{items[1].desc}</p>
        </div>
        <div className="h-8 w-px bg-[#EAECF0]" aria-hidden />
        <div>
          <p className="text-2xl font-bold text-[#101828]">{items[2].title}</p>
          <p className="text-sm text-[#667085]">{items[2].desc}</p>
        </div>
        <div className="h-8 w-px bg-[#EAECF0]" aria-hidden />
        <div>
          <p className="text-2xl font-bold text-[#101828]">{items[3].title}</p>
          <p className="text-sm text-[#667085]">{items[3].desc}</p>
        </div>
      </div>

      <div className="sm:hidden w-full">
        <div className="mx-auto max-w-sm text-center">
          <p className="text-2xl font-bold text-[#101828]">{items[active].title}</p>
          <p className="mt-1 text-sm text-[#667085]">{items[active].desc}</p>
        </div>
        <div className="mt-4 flex justify-center gap-2">
          {items.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              className={`h-2 rounded-full transition-all ${i === active ? "w-6 bg-[#7F56D9]" : "w-2 bg-[#E9D7FE]"}`}
              aria-label={items[i].title}
              aria-current={i === active ? "true" : undefined}
            />
          ))}
        </div>
      </div>
    </>
  );
}
