import { NextResponse } from "next/server";
import { resolveOutreachBranchId } from "@/lib/bedrijven/outreach-branches";
import {
  ensurePipelineAutopilotRunning,
  listActiveAutopilotBranches,
  runAutopilotTick,
} from "@/lib/outreach/autopilot";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function isCronAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET ?? process.env.AUTOPILOT_CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;
  return request.headers.get("x-cron-secret") === secret;
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const isCron = searchParams.get("cron") === "1";

  if (isCron && !isCronAuthorized(request)) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const locale = searchParams.get("locale") ?? "nl";

  try {
  let pipelineResume: Awaited<ReturnType<typeof ensurePipelineAutopilotRunning>> | undefined;
  if (isCron) {
    pipelineResume = await ensurePipelineAutopilotRunning();
  }

    const branchParam = searchParams.get("branch");
    const branches = branchParam
      ? [resolveOutreachBranchId(branchParam)]
      : await listActiveAutopilotBranches();

    if (branches.length === 0) {
      return NextResponse.json({
        ok: true,
        ticks: [],
        message: "NO_ACTIVE_AUTOPILOT",
        pipeline: pipelineResume,
      });
    }

    const ticks: { branchId: string; summary?: unknown; error?: string }[] = [];

    for (const branchId of branches) {
      try {
        const summary = await runAutopilotTick(branchId, locale);
        ticks.push({ branchId, summary });
      } catch (e) {
        const message = e instanceof Error ? e.message : "tick_failed";
        if (message === "AUTOPILOT_NOT_ACTIVE") {
          ticks.push({ branchId, error: message });
          continue;
        }
        ticks.push({ branchId, error: message });
      }
    }

    return NextResponse.json({ ok: true, ticks, pipeline: pipelineResume });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed";
    console.error("[admin/outreach/autopilot/tick]", e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
