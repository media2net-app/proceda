import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { resolveBranchId } from "@/lib/bedrijven/branches";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      companyName?: string;
      branchId?: string;
      locale?: string;
    };
    const email = body.email?.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "INVALID_EMAIL" }, { status: 400 });
    }

    const branchId = resolveBranchId(body.branchId ?? null);
    const locale = body.locale === "en" ? "en" : body.locale === "ro" ? "ro" : "nl";

    const row = await prisma.waitlistEntry.upsert({
      where: { email_branchId: { email, branchId } },
      create: {
        email,
        branchId,
        companyName: body.companyName?.trim() || null,
        locale,
      },
      update: {
        companyName: body.companyName?.trim() || undefined,
        locale,
      },
    });

    return NextResponse.json({ ok: true, id: row.id });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "METHOD_NOT_ALLOWED" }, { status: 405 });
}
