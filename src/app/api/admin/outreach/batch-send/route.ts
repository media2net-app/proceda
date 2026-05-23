import { NextResponse } from "next/server";
import { resolveOutreachBranchId } from "@/lib/bedrijven/outreach-branches";
import { runBatchOutreachSend } from "@/lib/mail/batch-send-outreach";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const branchId = resolveOutreachBranchId(searchParams.get("branch"));

  try {
    const body = (await request.json()) as {
      limit?: number;
      delayMs?: number;
      maxPerDomain?: number;
      dryRun?: boolean;
      abTest?: boolean;
      locale?: string;
    };

    const result = await runBatchOutreachSend({
      branchId,
      locale: body.locale ?? searchParams.get("locale") ?? "nl",
      limit: body.limit,
      delayMs: body.delayMs,
      maxPerDomain: body.maxPerDomain,
      dryRun: body.dryRun,
      abTest: body.abTest,
    });

    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed";
    const status = message === "MAIL_NOT_CONFIGURED" ? 503 : 500;
    console.error("[admin/outreach/batch-send]", e);
    return NextResponse.json({ error: message }, { status });
  }
}
