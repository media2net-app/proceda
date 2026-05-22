import { NextResponse } from "next/server";
import { getAnalyticsLiveSnapshot } from "@/lib/analytics-live";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period");

  try {
    const snapshot = await getAnalyticsLiveSnapshot(period);
    return NextResponse.json(snapshot);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed";
    console.error("[admin/analytics/live]", e);
    const hint =
      message.includes("AnalyticsSession") || message.includes("does not exist")
        ? " Voer prisma migrate deploy uit op productie."
        : "";
    return NextResponse.json({ error: message + hint }, { status: 500 });
  }
}
