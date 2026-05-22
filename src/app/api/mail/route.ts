import { NextResponse } from "next/server";
import { resolveOutreachBranchId } from "@/lib/bedrijven/outreach-branches";
import { getMailKpiStats, listMailTemplates } from "@/lib/mail/mail-campaign";
import { loadInboxCache } from "@/lib/mail/inbox-storage";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get("locale") ?? "nl";
  const branchId = resolveOutreachBranchId(searchParams.get("branch"));
  const [templates, stats, inbox] = await Promise.all([
    listMailTemplates(locale, request, branchId),
    getMailKpiStats(locale, request, branchId),
    loadInboxCache(),
  ]);
  return NextResponse.json({ templates, stats, inbox, branchId });
}
