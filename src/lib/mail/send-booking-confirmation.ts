import "server-only";

import type { LeadAppointment } from "@/lib/afspraken/types";
import { getMailConfig } from "./email-config";
import {
  buildBookingConfirmationEmail,
  buildBookingIcsCalendar,
} from "./booking-confirmation";
import { sendOutreachEmail } from "./smtp-client";

export async function sendBookingConfirmationEmail(params: {
  appointment: LeadAppointment;
  to: string;
  locale?: string;
}): Promise<{ sent: boolean; error?: string }> {
  const to = params.to.trim();
  if (!to) return { sent: false, error: "NO_RECIPIENT" };

  const config = getMailConfig();
  if (!config) return { sent: false, error: "MAIL_NOT_CONFIGURED" };

  const { subject, text, html } = buildBookingConfirmationEmail({
    appointment: params.appointment,
    locale: params.locale,
  });

  const ics = buildBookingIcsCalendar({
    appointment: params.appointment,
    organizerEmail: config.from,
    organizerName: config.fromName,
  });

  try {
    await sendOutreachEmail({
      to,
      subject,
      text,
      html,
      attachments: [
        {
          filename: "proceda-demo.ics",
          content: Buffer.from(ics, "utf-8"),
          cid: "booking-ics",
          contentType: "text/calendar; method=REQUEST",
        },
      ],
    });
    return { sent: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "SEND_FAILED";
    console.error("[booking-confirmation]", message);
    return { sent: false, error: message };
  }
}
