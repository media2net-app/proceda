import { NextResponse } from "next/server";
import { getMailKpiStats, listMailTemplates } from "@/lib/mail/mail-campaign";
import { loadInboxCache } from "@/lib/mail/inbox-storage";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get("locale") ?? "nl";
  const [templates, stats, inbox] = await Promise.all([
    listMailTemplates(locale, request),
    getMailKpiStats(locale, request),
    loadInboxCache(),
  ]);
  return NextResponse.json({ templates, stats, inbox });
}
