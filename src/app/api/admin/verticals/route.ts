import { NextResponse } from "next/server";
import { getAdminVerticalSummaries } from "@/lib/admin/vertical-summary";

export const dynamic = "force-dynamic";

export async function GET() {
  const payload = await getAdminVerticalSummaries();
  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
    },
  });
}
