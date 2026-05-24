import { NextResponse } from "next/server";
import { parseAdminVerticalScope } from "@/lib/bedrijven/outreach-branches";
import {
  listOutreachAuditLog,
  listSuppressedLeads,
} from "@/lib/outreach/outreach-audit";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scope = parseAdminVerticalScope(searchParams.get("branch"));
  const view = searchParams.get("view") ?? "audit";

  try {
    if (view === "suppression") {
      const leads = await listSuppressedLeads(scope);
      return NextResponse.json({ branchId: scope, leads });
    }
    const entries = await listOutreachAuditLog(50);
    return NextResponse.json({ branchId: scope, entries });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed";
    console.error("[admin/outreach/compliance]", e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
