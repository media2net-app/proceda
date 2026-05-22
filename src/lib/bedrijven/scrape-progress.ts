import type { ProvinceConfig } from "./provinces";
import type { DiscoveryCursor, ScrapeProgress } from "./types";

const MAX_LOG_LINES = 40;

export function appendScrapeLog(progress: ScrapeProgress, message: string): void {
  const ts = new Date().toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const line = `${ts} — ${message}`;
  progress.log = [...(progress.log ?? []), line].slice(-MAX_LOG_LINES);
  progress.statusMessage = message;
}

export function discoveryStepCount(
  province: ProvinceConfig,
  typeTotal: number,
): number {
  return province.searchGrid.length + province.textQueries.length + typeTotal;
}

export function discoveryPercent(
  province: ProvinceConfig,
  cursor: DiscoveryCursor,
  complete: boolean,
  typeTotal: number,
): number {
  if (complete) return 100;
  const gridTotal = province.searchGrid.length;
  const textTotal = province.textQueries.length;
  const total = gridTotal + typeTotal + textTotal;

  let done = 0;
  if (cursor.phase === "grid") done = cursor.gridIndex;
  else if (cursor.phase === "types") done = gridTotal + cursor.typeIndex;
  else done = gridTotal + typeTotal + cursor.queryIndex;

  return Math.min(99, Math.round((done / total) * 100));
}

export function batchPercent(
  phase: ScrapeProgress["phase"],
  discoveryPct: number,
  enrichingDone: number,
  enrichingTotal: number,
): number {
  if (phase === "discovering") {
    return Math.min(45, Math.round(discoveryPct * 0.45));
  }
  if (phase === "enriching" && enrichingTotal > 0) {
    return 45 + Math.round((enrichingDone / enrichingTotal) * 55);
  }
  if (phase === "done") return 100;
  return 0;
}
