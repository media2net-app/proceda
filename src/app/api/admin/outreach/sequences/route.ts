import { NextResponse } from "next/server";
import { resolveOutreachBranchId } from "@/lib/bedrijven/outreach-branches";
import {
  listDueSequenceItems,
  runDueOutreachSequences,
} from "@/lib/mail/outreach-sequence";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const branchId = resolveOutreachBranchId(searchParams.get("branch"));

  try {
    const due = await listDueSequenceItems(branchId);
    return NextResponse.json({ branchId, due, count: due.length });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed";
    console.error("[admin/outreach/sequences]", e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const branchId = resolveOutreachBranchId(searchParams.get("branch"));

  try {
    const body = (await request.json().catch(() => ({}))) as {
      dryRun?: boolean;
      locale?: string;
    };
    const result = await runDueOutreachSequences(
      branchId,
      body.locale ?? searchParams.get("locale") ?? "nl",
      !!body.dryRun,
    );
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed";
    const status = message === "MAIL_NOT_CONFIGURED" ? 503 : 500;
    console.error("[admin/outreach/sequences/run]", e);
    return NextResponse.json({ error: message }, { status });
  }
}
