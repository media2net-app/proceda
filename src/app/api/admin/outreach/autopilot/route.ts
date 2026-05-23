import { NextResponse } from "next/server";
import { resolveOutreachBranchId } from "@/lib/bedrijven/outreach-branches";
import {
  getAutopilotState,
  startAutopilot,
  stopAutopilot,
} from "@/lib/outreach/autopilot";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const branchId = resolveOutreachBranchId(searchParams.get("branch"));
  const locale = searchParams.get("locale") ?? "nl";

  try {
    const state = await getAutopilotState(branchId, locale);
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
    const body = (await request.json()) as { action?: "start" | "stop" };
    if (body.action === "start") {
      const state = await startAutopilot(branchId);
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
