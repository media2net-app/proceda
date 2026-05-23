import { NextResponse } from "next/server";
import { getLeadTimeline } from "@/lib/outreach/lead-timeline";
import { loadAllBusinesses } from "@/lib/bedrijven/load-all-businesses";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ businessId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { businessId } = await context.params;
  try {
    const businesses = await loadAllBusinesses();
    const biz = businesses.find((b) => b.id === businessId);
    if (!biz) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }
    const timeline = await getLeadTimeline(businessId, biz.name);
    if (!timeline) {
      return NextResponse.json({ error: "NO_OUTREACH" }, { status: 404 });
    }
    return NextResponse.json(timeline);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
