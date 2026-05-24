import { NextResponse } from "next/server";
import { resolveOutreachBranchId } from "@/lib/bedrijven/outreach-branches";
import {
  buildOutreachTemplateSample,
  type MailTemplateSampleKind,
} from "@/lib/mail/build-template-sample";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get("locale") ?? "nl";
  const branchId = resolveOutreachBranchId(searchParams.get("branch"));
  const kind = (searchParams.get("kind") ?? "initial") as MailTemplateSampleKind;
  if (kind !== "initial" && kind !== "followup") {
    return NextResponse.json({ error: "INVALID_KIND" }, { status: 400 });
  }

  const sample = buildOutreachTemplateSample(branchId, locale, kind, request);
  return NextResponse.json({ sample, branchId, kind });
}
