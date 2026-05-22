import type { LeadAppointment } from "@/lib/afspraken/types";

function escapeIcs(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function formatIcsUtc(iso: string): string {
  const d = new Date(iso);
  return d
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}

export function buildBookingIcsCalendar(params: {
  appointment: LeadAppointment;
  organizerEmail: string;
  organizerName: string;
}): string {
  const { appointment, organizerEmail, organizerName } = params;
  const start = formatIcsUtc(appointment.scheduledAt);
  const endDate = new Date(appointment.scheduledAt);
  endDate.setMinutes(endDate.getMinutes() + appointment.durationMinutes);
  const end = formatIcsUtc(endDate.toISOString());
  const stamp = formatIcsUtc(new Date().toISOString());
  const uid = `${appointment.id}@proceda.nl`;
  const summary = escapeIcs(`Proceda demo — ${appointment.businessName}`);
  const description = escapeIcs(
    `Vrijblijvend gesprek van 30 minuten over maatwerk software voor ${appointment.businessName}.\n\nGoogle Meet: ${appointment.meetLink}`,
  );

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Proceda//Booking//NL",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${escapeIcs(appointment.meetLink)}`,
    `ORGANIZER;CN=${escapeIcs(organizerName)}:mailto:${organizerEmail}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function buildBookingConfirmationEmail(params: {
  appointment: LeadAppointment;
  locale?: string;
}): { subject: string; text: string; html: string } {
  const { appointment } = params;
  const locale = params.locale === "en" ? "en" : "nl";
  const when = new Date(appointment.scheduledAt).toLocaleString(
    locale === "en" ? "en-GB" : "nl-NL",
    {
      timeZone: "Europe/Amsterdam",
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  );
  const meet = appointment.meetLink;
  const name = appointment.contactName?.trim() || appointment.businessName;

  if (locale === "en") {
    const subject = `Confirmed: Proceda demo on ${when}`;
    const text = `Dear ${name},

Your 30-minute demo with Proceda is confirmed.

When: ${when} (Amsterdam time)
Google Meet: ${meet}

We will show the custom dashboard concept for ${appointment.businessName} and discuss next steps — no obligation.

Kind regards,
Proceda`;
    const html = `<p>Dear ${escapeHtml(name)},</p>
<p>Your <strong>30-minute demo</strong> with Proceda is confirmed.</p>
<ul>
<li><strong>When:</strong> ${escapeHtml(when)} (Amsterdam)</li>
<li><strong>Google Meet:</strong> <a href="${escapeHtml(meet)}">${escapeHtml(meet)}</a></li>
</ul>
<p>We will show the custom dashboard concept for <strong>${escapeHtml(appointment.businessName)}</strong>.</p>
<p>Kind regards,<br/>Proceda</p>`;
    return { subject, text, html: wrapBookingHtml(html) };
  }

  const subject = `Bevestigd: Proceda demo op ${when}`;
  const text = `Beste ${name},

Uw demo van 30 minuten met Proceda staat gepland.

Wanneer: ${when} (Amsterdam)
Google Meet: ${meet}

Tijdens het gesprek laten we het maatwerk dashboard-concept voor ${appointment.businessName} live zien — vrijblijvend.

Met vriendelijke groet,
Proceda`;
  const html = `<p>Beste ${escapeHtml(name)},</p>
<p>Uw <strong>demo van 30 minuten</strong> met Proceda staat gepland.</p>
<ul>
<li><strong>Wanneer:</strong> ${escapeHtml(when)} (Amsterdam)</li>
<li><strong>Google Meet:</strong> <a href="${escapeHtml(meet)}">${escapeHtml(meet)}</a></li>
</ul>
<p>We bespreken het maatwerk dashboard-concept voor <strong>${escapeHtml(appointment.businessName)}</strong>.</p>
<p>Met vriendelijke groet,<br/>Proceda</p>`;
  return { subject, text, html: wrapBookingHtml(html) };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrapBookingHtml(body: string): string {
  return `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;color:#344054;line-height:1.6;max-width:560px">${body}</body></html>`;
}
