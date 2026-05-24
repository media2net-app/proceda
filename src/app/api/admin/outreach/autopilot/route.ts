import { after, NextResponse } from "next/server";
import { resolveOutreachBranchId } from "@/lib/bedrijven/outreach-branches";
import {
  getActiveAutopilotState,
  getAutopilotState,
  parseAutopilotMode,
  startAutopilot,
  stopAutopilot,
  switchAutopilotBranch,
  type AutopilotMode,
} from "@/lib/outreach/autopilot";
import { maybeRunStaleAutopilotTick } from "@/lib/outreach/autopilot-scheduler";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const branchParam = searchParams.get("branch");
  const locale = searchParams.get("locale") ?? "nl";

  try {
    if (!branchParam) {
      const active = await getActiveAutopilotState(locale);
      if (active) {
        after(() => maybeRunStaleAutopilotTick(active.branchId, locale, active));
        return NextResponse.json(active);
      }
      return NextResponse.json({ active: false, branchId: null });
    }

    const branchId = resolveOutreachBranchId(branchParam);
    const state = await getAutopilotState(branchId, locale);
    if (state.active) {
      after(() => maybeRunStaleAutopilotTick(branchId, locale, state));
    }
    return NextResponse.json(state);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const branchId = resolveOutreachBranchId(searchParams.get("branch"));

  try {
    const body = (await request.json()) as {
      action?: "start" | "stop" | "switch";
      mode?: AutopilotMode;
    };
    if (body.action === "start") {
      const mode = parseAutopilotMode(body.mode);
      const state = await startAutopilot(branchId, mode);
      return NextResponse.json(state);
    }
    if (body.action === "switch") {
      const mode = body.mode ? parseAutopilotMode(body.mode) : undefined;
      const state = await switchAutopilotBranch(branchId, mode);
      return NextResponse.json(state);
    }
    if (body.action === "stop") {
      const state = await stopAutopilot(branchId);
      return NextResponse.json(state);
    }
    return NextResponse.json({ error: "INVALID_ACTION" }, { status: 400 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
