import "server-only";

import { prisma } from "@/lib/db/prisma";
import { appointmentToLead } from "@/lib/db/mappers";
import type { LeadAppointment } from "@/lib/afspraken/types";
import { getMailConfig } from "./email-config";
import { sendOutreachEmail } from "./smtp-client";

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString("nl-NL", {
    timeZone: "Europe/Amsterdam",
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildReminderEmail(
  appointment: LeadAppointment,
  hoursBefore: 24 | 1,
): { subject: string; text: string; html: string } {
  const when = formatWhen(appointment.scheduledAt);
  const name = appointment.contactName?.trim() || appointment.businessName;
  const subject =
    hoursBefore === 24
      ? `Reminder: Proceda demo morgen — ${when}`
      : `Over 1 uur: Proceda demo — ${when}`;

  const text = `Beste ${name},

Herinnering: uw Proceda demo staat gepland op ${when}.

Google Meet: ${appointment.meetLink}

Tot dan!
Proceda`;

  const html = `<p>Beste ${name},</p>
<p>Herinnering: uw Proceda demo staat gepland op <strong>${when}</strong>.</p>
<p><a href="${appointment.meetLink}">${appointment.meetLink}</a></p>
<p>Tot dan!<br/>Proceda</p>`;

  return { subject, text, html };
}

export type ReminderRunResult = {
  sent24: number;
  sent1: number;
  skipped: number;
  failed: number;
};

export async function sendDueAppointmentReminders(
  dryRun = false,
): Promise<ReminderRunResult> {
  const now = Date.now();
  const in25h = new Date(now + 25 * 60 * 60 * 1000);
  const in2h = new Date(now + 2 * 60 * 60 * 1000);
  const in30m = new Date(now + 30 * 60 * 1000);

  const config = getMailConfig();
  if (!dryRun && !config) {
    throw new Error("MAIL_NOT_CONFIGURED");
  }

  const upcoming = await prisma.appointment.findMany({
    where: {
      status: "scheduled",
      scheduledAt: { gte: new Date(), lte: in25h },
    },
  });

  let sent24 = 0;
  let sent1 = 0;
  let skipped = 0;
  let failed = 0;

  for (const row of upcoming) {
    const apt = appointmentToLead(row);
    const to = apt.email?.trim();
    if (!to) {
      skipped++;
      continue;
    }

    const scheduledMs = new Date(apt.scheduledAt).getTime();
    const hoursUntil = (scheduledMs - now) / (60 * 60 * 1000);

    if (!row.reminder24SentAt && hoursUntil <= 24 && hoursUntil > 2) {
      if (dryRun) {
        sent24++;
        continue;
      }
      const mail = buildReminderEmail(apt, 24);
      try {
        await sendOutreachEmail({ to, subject: mail.subject, text: mail.text, html: mail.html });
        await prisma.appointment.update({
          where: { id: row.id },
          data: { reminder24SentAt: new Date() },
        });
        sent24++;
      } catch {
        failed++;
      }
      continue;
    }

    if (
      !row.reminder1SentAt &&
      scheduledMs <= in2h.getTime() &&
      scheduledMs >= in30m.getTime()
    ) {
      if (dryRun) {
        sent1++;
        continue;
      }
      const mail = buildReminderEmail(apt, 1);
      try {
        await sendOutreachEmail({ to, subject: mail.subject, text: mail.text, html: mail.html });
        await prisma.appointment.update({
          where: { id: row.id },
          data: { reminder1SentAt: new Date() },
        });
        sent1++;
      } catch {
        failed++;
      }
      continue;
    }

    skipped++;
  }

  return { sent24, sent1, skipped, failed };
}
