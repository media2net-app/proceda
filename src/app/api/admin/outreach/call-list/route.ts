import { NextResponse } from "next/server";
import { resolveOutreachBranchId } from "@/lib/bedrijven/outreach-branches";
import { getOutreachCallList } from "@/lib/outreach/outreach-call-list";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const branchId = resolveOutreachBranchId(searchParams.get("branch"));
  const locale = searchParams.get("locale") ?? "nl";

  try {
    const list = await getOutreachCallList(branchId, locale);
    return NextResponse.json(list);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed";
    console.error("[admin/outreach/call-list]", e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
