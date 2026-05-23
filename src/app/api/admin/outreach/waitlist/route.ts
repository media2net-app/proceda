import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { resolveOutreachBranchId } from "@/lib/bedrijven/outreach-branches";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const branchId = resolveOutreachBranchId(searchParams.get("branch"));
  const limit = Math.min(
    100,
    Math.max(1, Number.parseInt(searchParams.get("limit") ?? "50", 10) || 50),
  );

  const rows = await prisma.waitlistEntry.findMany({
    where: { branchId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return NextResponse.json({
    entries: rows.map((r) => ({
      id: r.id,
      email: r.email,
      companyName: r.companyName ?? undefined,
      locale: r.locale,
      createdAt: r.createdAt.toISOString(),
    })),
  });
}
