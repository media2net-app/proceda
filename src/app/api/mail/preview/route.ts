import { NextResponse } from "next/server";
import { resolveOutreachBranchId } from "@/lib/bedrijven/outreach-branches";
import { getDemoOutreachPreviewBySlug } from "@/lib/mail/list-demo-outreach";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get("locale") ?? "nl";
  const branchId = resolveOutreachBranchId(searchParams.get("branch"));
  const slug = searchParams.get("slug")?.trim();
  const includeFollowup = searchParams.get("followup") === "1";

  if (!slug) {
    return NextResponse.json({ error: "SLUG_REQUIRED" }, { status: 400 });
  }

  const preview = await getDemoOutreachPreviewBySlug(
    locale,
    request,
    branchId,
    slug,
    { includeFollowup },
  );

  if (!preview) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json({ preview });
}
