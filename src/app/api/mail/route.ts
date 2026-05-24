import { NextResponse } from "next/server";
import { resolveOutreachBranchId } from "@/lib/bedrijven/outreach-branches";
import { getMailKpiStats, listMailTemplates } from "@/lib/mail/mail-campaign";
import { loadInboxCache } from "@/lib/mail/inbox-storage";
import { filterInboxForDisplay } from "@/lib/mail/inbox-bounce-filter";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get("locale") ?? "nl";
  const branchId = resolveOutreachBranchId(searchParams.get("branch"));
  const [templates, stats, inboxRaw] = await Promise.all([
    listMailTemplates(locale, request, branchId),
    getMailKpiStats(locale, request, branchId),
    loadInboxCache(),
  ]);
  const inbox = {
    ...inboxRaw,
    messages: filterInboxForDisplay(inboxRaw.messages),
  };
  return NextResponse.json({ templates, stats, inbox, branchId });
}
