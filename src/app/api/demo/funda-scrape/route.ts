import { NextResponse } from "next/server";
import { getFundaHoogeveenData } from "@/lib/funda/scrape-hoogeveen";

export const maxDuration = 120;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const refresh = searchParams.get("refresh") === "1";

  try {
    const data = await getFundaHoogeveenData(refresh);
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Funda scrape mislukt";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
