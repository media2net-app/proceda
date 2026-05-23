import { NextResponse } from "next/server";
import { updateMailPipelineStatus } from "@/lib/mail/storage";
import type { OutreachPipelineStatus } from "@/lib/mail/types";

export const dynamic = "force-dynamic";

const VALID: OutreachPipelineStatus[] = [
  "lead",
  "contacted",
  "meeting",
  "proposal",
  "won",
  "lost",
];

type RouteContext = { params: Promise<{ businessId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const { businessId } = await context.params;
  const body = (await request.json()) as { pipelineStatus?: string };

  if (
    !body.pipelineStatus ||
    !VALID.includes(body.pipelineStatus as OutreachPipelineStatus)
  ) {
    return NextResponse.json({ error: "INVALID_STATUS" }, { status: 400 });
  }

  try {
    const record = await updateMailPipelineStatus(
      businessId,
      body.pipelineStatus as OutreachPipelineStatus,
    );
    return NextResponse.json({ record });
  } catch {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }
}
