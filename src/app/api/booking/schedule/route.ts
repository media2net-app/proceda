import { NextResponse } from "next/server";
import { loadAppointments } from "@/lib/afspraken/storage";
import { buildBookingSchedule } from "@/lib/mail/booking-slots";

export async function GET() {
  try {
    const appointments = await loadAppointments();
    const schedule = buildBookingSchedule(new Date(), appointments);
    return NextResponse.json({ schedule });
  } catch {
    return NextResponse.json({ error: "SCHEDULE_FAILED" }, { status: 500 });
  }
}
