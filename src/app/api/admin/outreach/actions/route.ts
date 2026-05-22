import { NextResponse } from "next/server";
import { resolveOutreachBranchId } from "@/lib/bedrijven/outreach-branches";
import { getOutreachActionQueue } from "@/lib/outreach/outreach-action-queue";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const branchId = resolveOutreachBranchId(searchParams.get("branch"));
  const locale = searchParams.get("locale") ?? "nl";

  try {
    const queue = await getOutreachActionQueue(branchId, locale);
    return NextResponse.json(queue);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed";
    console.error("[admin/outreach/actions]", e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
