"use client";

import createGlobe from "cobe";
import { useEffect, useRef } from "react";
import type { LiveVisitorMarker } from "@/lib/analytics-live-types";

type Props = {
  visitors: LiveVisitorMarker[];
  legendVisitor: string;
  legendBooking: string;
};

const MARKER_SIZE = 0.06;
const MARKER_COLOR: [number, number, number] = [0.5, 0.34, 0.85];
const BOOKING_COLOR: [number, number, number] = [0.95, 0.62, 0.2];
const GLOW_COLOR: [number, number, number] = [0.45, 0.35, 0.75];

function visitorMarkers(visitors: LiveVisitorMarker[]) {
  return visitors.map((v) => ({
    location: [v.lat, v.lng] as [number, number],
    size: v.bookingActive ? MARKER_SIZE * 1.35 : MARKER_SIZE,
  }));
}

function globeSize(container: HTMLElement): number {
  const w = container.clientWidth;
  const h = container.clientHeight;
  const size = Math.min(w, h, 640);
  return Math.max(Math.round(size), 220);
}

export default function AdminLiveGlobe({
  visitors,
  legendVisitor,
  legendBooking,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const visitorsRef = useRef(visitors);
  const globeRef = useRef<ReturnType<typeof createGlobe> | null>(null);

  useEffect(() => {
    visitorsRef.current = visitors;
    const hasBooking = visitors.some((v) => v.bookingActive);
    globeRef.current?.update({
      markerColor: hasBooking ? BOOKING_COLOR : MARKER_COLOR,
      markers: visitorMarkers(visitorsRef.current),
    });
  }, [visitors]);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    let width = globeSize(wrap);
    let phi = 0;
    let raf = 0;

    const globe = createGlobe(canvas, {
      devicePixelRatio: 2,
      width: width * 2,
      height: width * 2,
      phi: 0,
      theta: 0.22,
      dark: 0,
      diffuse: 1.15,
      mapSamples: 16000,
      mapBrightness: 1.1,
      baseColor: [0.92, 0.93, 0.96],
      markerColor: MARKER_COLOR,
      glowColor: GLOW_COLOR,
      markers: visitorMarkers(visitorsRef.current),
    });
    globeRef.current = globe;

    const tick = () => {
      phi += 0.004;
      const hasBooking = visitorsRef.current.some((v) => v.bookingActive);
      globe.update({
        width: width * 2,
        height: width * 2,
        phi,
        markerColor: hasBooking ? BOOKING_COLOR : MARKER_COLOR,
        markers: visitorMarkers(visitorsRef.current),
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const ro = new ResizeObserver(() => {
      width = globeSize(wrap);
    });
    ro.observe(wrap);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      globe.destroy();
      globeRef.current = null;
    };
  }, []);

  return (
    <div className="relative h-full min-h-[280px] w-full">
      <div
        ref={wrapRef}
        className="absolute inset-0 flex items-center justify-center"
      >
        <canvas
          ref={canvasRef}
          className="h-full max-h-[min(72vh,560px)] w-full max-w-[min(72vh,560px)]"
        />
      </div>
      <div className="pointer-events-none absolute bottom-3 left-3 flex flex-wrap gap-3 rounded-lg border border-[#EAECF0] bg-white/95 px-3 py-2 text-xs text-[#667085] shadow-sm">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#7F56D9]" />
          {legendVisitor}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#F59E0B]" />
          {legendBooking}
        </span>
      </div>
    </div>
  );
}
