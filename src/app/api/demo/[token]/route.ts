import { NextResponse } from "next/server";
import { loadAppointments } from "@/lib/afspraken/storage";
import { getDemoLeadByToken } from "@/lib/mail/mail-campaign";
import { buildBookingSchedule } from "@/lib/mail/booking-slots";

type RouteContext = { params: Promise<{ token: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { token } = await context.params;
  const lead = await getDemoLeadByToken(token);
  if (!lead) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const appointments = await loadAppointments();
  const schedule = buildBookingSchedule(new Date(), appointments);
  return NextResponse.json({
    businessName: lead.business.name,
    city: lead.business.city,
    token,
    schedule,
  });
}
