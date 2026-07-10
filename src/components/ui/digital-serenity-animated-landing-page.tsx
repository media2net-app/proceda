"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

type Ripple = { id: number; x: number; y: number };

type DigitalSerenityProps = {
  children: ReactNode;
  className?: string;
};

export default function DigitalSerenity({ children, className = "" }: DigitalSerenityProps) {
  const patternId = useId().replace(/:/g, "");
  const containerRef = useRef<HTMLDivElement>(null);
  const [mouseGradientStyle, setMouseGradientStyle] = useState({
    left: "0px",
    top: "0px",
    opacity: 0,
  });
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const animateWords = () => {
      const wordElements = containerRef.current?.querySelectorAll(".word-animate");
      wordElements?.forEach((word) => {
        const el = word as HTMLElement;
        const delay = parseInt(el.getAttribute("data-delay") ?? "0", 10);
        setTimeout(() => {
          el.style.animation = "ds-word-appear 0.8s ease-out forwards";
        }, delay);
      });
    };
    const timeoutId = setTimeout(animateWords, 400);
    return () => clearTimeout(timeoutId);
  }, [children]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      setMouseGradientStyle({
        left: `${e.clientX - rect.left}px`,
        top: `${e.clientY - rect.top}px`,
        opacity: 1,
      });
    };

    const handleMouseLeave = () => {
      setMouseGradientStyle((prev) => ({ ...prev, opacity: 0 }));
    };

    const handleClick = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const newRipple: Ripple = {
        id: Date.now(),
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
      setRipples((prev) => [...prev, newRipple]);
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
      }, 1000);
    };

    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseleave", handleMouseLeave);
    container.addEventListener("click", handleClick);

    return () => {
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseleave", handleMouseLeave);
      container.removeEventListener("click", handleClick);
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const wordElements = container.querySelectorAll(".word-animate");
    const onEnter = (e: Event) => {
      const el = e.target as HTMLElement;
      el.style.textShadow = "0 0 20px rgba(182, 146, 246, 0.45)";
    };
    const onLeave = (e: Event) => {
      const el = e.target as HTMLElement;
      el.style.textShadow = "none";
    };

    wordElements.forEach((word) => {
      word.addEventListener("mouseenter", onEnter);
      word.addEventListener("mouseleave", onLeave);
    });

    return () => {
      wordElements.forEach((word) => {
        word.removeEventListener("mouseenter", onEnter);
        word.removeEventListener("mouseleave", onLeave);
      });
    };
  }, [children]);

  useEffect(() => {
    const handleScroll = () => {
      if (scrolled) return;
      setScrolled(true);
      const elements = containerRef.current?.querySelectorAll(".ds-floating-element");
      elements?.forEach((el, index) => {
        const node = el as HTMLElement;
        setTimeout(() => {
          node.style.animationPlayState = "running";
        }, index * 100);
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [scrolled]);

  return (
    <div
      ref={containerRef}
      className={`digital-serenity relative overflow-hidden bg-gradient-to-br from-[#0A0A0A] via-black to-[#111827] text-slate-100 ${className}`}
    >
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <defs>
          <pattern id={patternId} width="60" height="60" patternUnits="userSpaceOnUse">
            <path
              d="M 60 0 L 0 0 0 60"
              fill="none"
              stroke="rgba(127, 86, 217, 0.08)"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
        <line x1="0" y1="20%" x2="100%" y2="20%" className="ds-grid-line" style={{ animationDelay: "0.5s" }} />
        <line x1="0" y1="80%" x2="100%" y2="80%" className="ds-grid-line" style={{ animationDelay: "1s" }} />
        <line x1="20%" y1="0" x2="20%" y2="100%" className="ds-grid-line" style={{ animationDelay: "1.5s" }} />
        <line x1="80%" y1="0" x2="80%" y2="100%" className="ds-grid-line" style={{ animationDelay: "2s" }} />
        <line
          x1="50%"
          y1="0"
          x2="50%"
          y2="100%"
          className="ds-grid-line"
          style={{ animationDelay: "2.5s", opacity: 0.05 }}
        />
        <line
          x1="0"
          y1="50%"
          x2="100%"
          y2="50%"
          className="ds-grid-line"
          style={{ animationDelay: "3s", opacity: 0.05 }}
        />
        <circle cx="20%" cy="20%" r="2" className="ds-detail-dot" style={{ animationDelay: "3s" }} />
        <circle cx="80%" cy="20%" r="2" className="ds-detail-dot" style={{ animationDelay: "3.2s" }} />
        <circle cx="20%" cy="80%" r="2" className="ds-detail-dot" style={{ animationDelay: "3.4s" }} />
        <circle cx="80%" cy="80%" r="2" className="ds-detail-dot" style={{ animationDelay: "3.6s" }} />
        <circle cx="50%" cy="50%" r="1.5" className="ds-detail-dot" style={{ animationDelay: "4s" }} />
      </svg>

      <div
        className="ds-corner-element absolute left-4 top-4 sm:left-6 sm:top-6 md:left-8 md:top-8"
        style={{ animationDelay: "4s" }}
      >
        <div className="absolute left-0 top-0 h-2 w-2 rounded-full bg-[#B692F6]/40" />
      </div>
      <div
        className="ds-corner-element absolute right-4 top-4 sm:right-6 sm:top-6 md:right-8 md:top-8"
        style={{ animationDelay: "4.2s" }}
      >
        <div className="absolute right-0 top-0 h-2 w-2 rounded-full bg-[#B692F6]/40" />
      </div>
      <div
        className="ds-corner-element absolute bottom-4 left-4 sm:bottom-6 sm:left-6 md:bottom-8 md:left-8"
        style={{ animationDelay: "4.4s" }}
      >
        <div className="absolute bottom-0 left-0 h-2 w-2 rounded-full bg-[#B692F6]/40" />
      </div>
      <div
        className="ds-corner-element absolute bottom-4 right-4 sm:bottom-6 sm:right-6 md:bottom-8 md:right-8"
        style={{ animationDelay: "4.6s" }}
      >
        <div className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-[#B692F6]/40" />
      </div>

      <div className="ds-floating-element" style={{ top: "25%", left: "15%", animationDelay: "0.5s" }} />
      <div className="ds-floating-element" style={{ top: "60%", left: "85%", animationDelay: "1s" }} />
      <div className="ds-floating-element" style={{ top: "40%", left: "10%", animationDelay: "1.5s" }} />
      <div className="ds-floating-element" style={{ top: "75%", left: "90%", animationDelay: "2s" }} />

      <div className="relative z-10">{children}</div>

      <div
        className="ds-mouse-gradient pointer-events-none absolute h-60 w-60 -translate-x-1/2 -translate-y-1/2 rounded-full blur-xl sm:h-80 sm:w-80 sm:blur-2xl md:h-96 md:w-96 md:blur-3xl"
        style={{
          left: mouseGradientStyle.left,
          top: mouseGradientStyle.top,
          opacity: mouseGradientStyle.opacity,
        }}
      />

      {ripples.map((ripple) => (
        <div
          key={ripple.id}
          className="ds-ripple pointer-events-none absolute h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ left: ripple.x, top: ripple.y }}
        />
      ))}
    </div>
  );
}

export function AnimatedWords({
  text,
  baseDelay = 0,
  step = 120,
  className = "",
}: {
  text: string;
  baseDelay?: number;
  step?: number;
  className?: string;
}) {
  return text.split(" ").map((word, i) => (
    <span key={`${word}-${i}`} className={`word-animate ${className}`} data-delay={baseDelay + i * step}>
      {word}{" "}
    </span>
  ));
}
