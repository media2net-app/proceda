import { NextResponse } from "next/server";
import { createAppointment, loadAppointments } from "@/lib/afspraken/storage";
import { getDemoLeadByToken } from "@/lib/mail/mail-campaign";
import { isValidBookingSlot } from "@/lib/mail/booking-slots";
import { markMailBooked } from "@/lib/mail/storage";
import { sendBookingConfirmationEmail } from "@/lib/mail/send-booking-confirmation";

type RouteContext = { params: Promise<{ token: string }> };

function defaultMeetLink(): string {
  const link =
    process.env.PROCEDA_DEMO_MEET_LINK?.trim() ||
    "https://meet.google.com/lookup/proceda-demo";
  return link;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { token } = await context.params;
    const lead = await getDemoLeadByToken(token);
    if (!lead) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }

    const body = (await request.json()) as {
      scheduledAt?: string;
      contactName?: string;
      email?: string;
      phone?: string;
      locale?: string;
    };

    const appointments = await loadAppointments();
    const now = new Date();
    if (
      !body.scheduledAt ||
      !isValidBookingSlot(body.scheduledAt, now, appointments)
    ) {
      return NextResponse.json({ error: "INVALID_SLOT" }, { status: 400 });
    }

    const appointment = await createAppointment({
      businessId: lead.business.id,
      businessName: lead.business.name,
      contactName: body.contactName?.trim(),
      email: body.email?.trim() || lead.business.email,
      phone: body.phone?.trim() || lead.business.phone,
      source: "auto-mail",
      scheduledAt: body.scheduledAt,
      durationMinutes: 30,
      meetLink: defaultMeetLink(),
      notes: `Demo geboekt via mail-CTA (token: ${token})`,
    });

    await markMailBooked(lead.business.id, appointment.id);

    const confirmTo = body.email?.trim() || lead.business.email;
    let confirmationSent = false;
    if (confirmTo) {
      const locale = body.locale === "en" ? "en" : "nl";
      const result = await sendBookingConfirmationEmail({
        appointment,
        to: confirmTo,
        locale,
      });
      confirmationSent = result.sent;
    }

    return NextResponse.json(
      { appointment, confirmationSent },
      { status: 201 },
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Booking failed";
    const status =
      message === "INVALID_MEET_LINK" ||
      message === "BUSINESS_NAME_REQUIRED" ||
      message === "SLOT_TAKEN"
        ? 400
        : message === "INVALID_SLOT"
          ? 400
          : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
