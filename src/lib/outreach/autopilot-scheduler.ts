import "server-only";

import type { OutreachBranchId } from "@/lib/bedrijven/outreach-branches";
import {
  runAutopilotTick,
  type AutopilotMode,
  type AutopilotPublicState,
} from "@/lib/outreach/autopilot";

const inFlight = new Set<string>();

/** Hoe lang na lastTickAt een nieuwe tick verwacht wordt (iets boven client-interval). */
export function staleTickThresholdMs(mode: AutopilotMode): number {
  if (mode === "scrape_only") return 75_000;
  return 300_000;
}

export function isAutopilotTickStale(
  state: Pick<
    AutopilotPublicState,
    "active" | "lastTickAt" | "tickInProgress" | "mode"
  >,
): boolean {
  if (!state.active || state.tickInProgress) return false;
  const threshold = staleTickThresholdMs(state.mode);
  if (!state.lastTickAt) return true;
  return Date.now() - new Date(state.lastTickAt).getTime() >= threshold;
}

/** Start een tick wanneer de autopilot actief is maar te lang geen tick meer draaide. */
export async function maybeRunStaleAutopilotTick(
  branchId: OutreachBranchId,
  locale = "nl",
  state?: Pick<
    AutopilotPublicState,
    "active" | "lastTickAt" | "tickInProgress" | "mode"
  >,
): Promise<void> {
  if (state && !isAutopilotTickStale(state)) return;
  const key = branchId;
  if (inFlight.has(key)) return;
  inFlight.add(key);
  try {
    await runAutopilotTick(branchId, locale);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (
      msg !== "AUTOPILOT_TICK_IN_PROGRESS" &&
      msg !== "AUTOPILOT_NOT_ACTIVE"
    ) {
      console.warn("[autopilot-scheduler] stale tick failed", branchId, msg);
    }
  } finally {
    inFlight.delete(key);
  }
}
