import { NextResponse } from "next/server";
import { sendDueAppointmentReminders } from "@/lib/mail/send-booking-reminder";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { dryRun?: boolean };
    const result = await sendDueAppointmentReminders(!!body.dryRun);
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed";
    const status = message === "MAIL_NOT_CONFIGURED" ? 503 : 500;
    console.error("[admin/outreach/reminders]", e);
    return NextResponse.json({ error: message }, { status });
  }
}
