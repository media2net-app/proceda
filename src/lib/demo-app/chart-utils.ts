/** Converteert legacy SVG-puntstrings (x,y met y=0 bovenaan) naar chart-waarden. */
export function chartPointsToValues(points: string): number[] {
  return points
    .trim()
    .split(/\s+/)
    .map((pair) => {
      const [, y] = pair.split(",").map(Number);
      if (!Number.isFinite(y)) return 0;
      return Math.round((100 - y) * 10) / 10;
    });
}

export function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  const n = parseInt(full, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

/** 12 weken Q2 2026 (apr–jun). */
export const Q2_WEEK_LABELS = [
  "7 apr",
  "14 apr",
  "21 apr",
  "28 apr",
  "5 mei",
  "12 mei",
  "19 mei",
  "26 mei",
  "2 jun",
  "9 jun",
  "16 jun",
  "23 jun",
] as const;
