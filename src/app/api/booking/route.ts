import { NextResponse } from "next/server";
import { createAppointment, loadAppointments } from "@/lib/afspraken/storage";
import { isValidBookingSlot } from "@/lib/mail/booking-slots";
import { sendBookingConfirmationEmail } from "@/lib/mail/send-booking-confirmation";
import { recordAnalyticsEvent } from "@/lib/analytics-events";
import { notifySlackBookingConfirmed } from "@/lib/integrations/slack-notify";
import { formatWebsiteBookingNotes, type WebsiteBookingIntake } from "@/lib/booking/intake";

function defaultMeetLink(): string {
  return (
    process.env.PROCEDA_DEMO_MEET_LINK?.trim() ||
    "https://meet.google.com/lookup/proceda-demo"
  );
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      scheduledAt?: string;
      contactName?: string;
      email?: string;
      phone?: string;
      businessName?: string;
      locale?: string;
      intake?: WebsiteBookingIntake;
    };

    const contactName = body.contactName?.trim() ?? "";
    const email = body.email?.trim() ?? "";
    const businessName = body.businessName?.trim() ?? "";

    if (!contactName || !email || !businessName) {
      return NextResponse.json({ error: "MISSING_FIELDS" }, { status: 400 });
    }
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "INVALID_EMAIL" }, { status: 400 });
    }

    const appointments = await loadAppointments();
    const now = new Date();
    if (
      !body.scheduledAt ||
      !isValidBookingSlot(body.scheduledAt, now, appointments)
    ) {
      return NextResponse.json({ error: "INVALID_SLOT" }, { status: 400 });
    }

    const notes = formatWebsiteBookingNotes(body.intake);

    const appointment = await createAppointment({
      businessName,
      contactName,
      email,
      phone: body.phone?.trim(),
      source: "cold-call",
      scheduledAt: body.scheduledAt,
      durationMinutes: 30,
      meetLink: defaultMeetLink(),
      notes,
    });

    void recordAnalyticsEvent({
      eventName: "booking_confirmed",
      metadata: {
        appointmentId: appointment.id,
        scheduledAt: body.scheduledAt,
        source: "website",
      },
    }).catch(() => {});

    void notifySlackBookingConfirmed({
      businessName,
      scheduledAt: body.scheduledAt,
      email,
    });

    const locale = body.locale === "en" || body.locale === "ro" ? body.locale : "nl";
    const result = await sendBookingConfirmationEmail({
      appointment,
      to: email,
      locale: locale === "ro" ? "nl" : locale,
    });

    return NextResponse.json(
      { appointment, confirmationSent: result.sent },
      { status: 201 },
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Booking failed";
    const status =
      message === "INVALID_MEET_LINK" ||
      message === "BUSINESS_NAME_REQUIRED" ||
      message === "SLOT_TAKEN"
        ? 400
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
