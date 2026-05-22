import { prisma } from "@/lib/db/prisma";
import {
  appointmentToLead,
  leadToAppointmentCreate,
} from "@/lib/db/mappers";
import { buildAdminCalendarWeek } from "./calendar-week";
import { buildAllBookingSlots } from "@/lib/mail/booking-slots";
import { hasSlotConflict, isSlotTaken } from "./slot-availability";
import type {
  AppointmentSource,
  AppointmentStatus,
  AfsprakenListResponse,
  LeadAppointment,
} from "./types";

function isMeetLink(url: string): boolean {
  const u = url.trim().toLowerCase();
  return (
    u.startsWith("https://meet.google.com/") ||
    u.startsWith("http://meet.google.com/")
  );
}

export async function loadAppointments(): Promise<LeadAppointment[]> {
  const rows = await prisma.appointment.findMany({
    orderBy: { scheduledAt: "desc" },
  });
  return rows.map(appointmentToLead);
}

export function computeAfsprakenStats(
  appointments: LeadAppointment[],
  now: Date = new Date(),
): AfsprakenListResponse["stats"] {
  const nowMs = now.getTime();
  let upcoming = 0;
  let fromColdCall = 0;
  let fromAutoMail = 0;
  let completed = 0;

  for (const a of appointments) {
    if (a.source === "cold-call") fromColdCall++;
    else fromAutoMail++;
    if (a.status === "completed") completed++;
    if (
      a.status === "scheduled" &&
      new Date(a.scheduledAt).getTime() >= nowMs
    ) {
      upcoming++;
    }
  }

  const windowSlots = buildAllBookingSlots(now);
  let bookedSlotsInWindow = 0;
  for (const slot of windowSlots) {
    if (isSlotTaken(appointments, slot.iso)) bookedSlotsInWindow++;
  }

  return {
    total: appointments.length,
    upcoming,
    fromColdCall,
    fromAutoMail,
    completed,
    bookedSlotsInWindow,
    freeSlotsInWindow: windowSlots.length - bookedSlotsInWindow,
  };
}

export async function listAfspraken(
  calendarWeekStart?: string,
): Promise<AfsprakenListResponse> {
  const appointments = await loadAppointments();
  const now = new Date();
  return {
    appointments,
    stats: computeAfsprakenStats(appointments, now),
    calendar: buildAdminCalendarWeek(appointments, calendarWeekStart, now),
  };
}

export type CreateAppointmentInput = {
  businessId?: string;
  businessName: string;
  contactName?: string;
  email?: string;
  phone?: string;
  source: AppointmentSource;
  scheduledAt: string;
  durationMinutes?: number;
  meetLink: string;
  status?: AppointmentStatus;
  notes?: string;
};

export async function createAppointment(
  input: CreateAppointmentInput,
): Promise<LeadAppointment> {
  if (!input.businessName?.trim()) throw new Error("BUSINESS_NAME_REQUIRED");
  if (!isMeetLink(input.meetLink)) throw new Error("INVALID_MEET_LINK");

  const all = await loadAppointments();
  if (
    hasSlotConflict(
      all,
      input.scheduledAt,
      input.durationMinutes ?? 30,
    )
  ) {
    throw new Error("SLOT_TAKEN");
  }

  const row = await prisma.appointment.create({
    data: leadToAppointmentCreate({
      businessId: input.businessId,
      businessName: input.businessName.trim(),
      contactName: input.contactName?.trim(),
      email: input.email?.trim(),
      phone: input.phone?.trim(),
      source: input.source,
      scheduledAt: input.scheduledAt,
      durationMinutes: input.durationMinutes ?? 30,
      meetLink: input.meetLink.trim(),
      status: input.status ?? "scheduled",
      notes: input.notes?.trim(),
    }),
  });

  return appointmentToLead(row);
}

export type UpdateAppointmentInput = Partial<
  Omit<LeadAppointment, "id" | "createdAt" | "updatedAt">
>;

export async function updateAppointment(
  id: string,
  input: UpdateAppointmentInput,
): Promise<LeadAppointment | null> {
  const current = await prisma.appointment.findUnique({ where: { id } });
  if (!current) return null;

  if (input.meetLink != null && !isMeetLink(input.meetLink)) {
    throw new Error("INVALID_MEET_LINK");
  }

  const scheduledAt = input.scheduledAt ?? current.scheduledAt.toISOString();
  const durationMinutes = input.durationMinutes ?? current.durationMinutes;

  const all = await loadAppointments();
  if (
    hasSlotConflict(all, scheduledAt, durationMinutes, id) &&
    (input.scheduledAt != null || input.durationMinutes != null)
  ) {
    throw new Error("SLOT_TAKEN");
  }

  const row = await prisma.appointment.update({
    where: { id },
    data: {
      businessId: input.businessId,
      businessName: input.businessName?.trim(),
      contactName: input.contactName,
      email: input.email,
      phone: input.phone,
      source: input.source
        ? input.source === "cold-call"
          ? "cold_call"
          : "auto_mail"
        : undefined,
      scheduledAt: input.scheduledAt
        ? new Date(input.scheduledAt)
        : undefined,
      durationMinutes: input.durationMinutes,
      meetLink: input.meetLink?.trim(),
      status: input.status
        ? input.status === "no-show"
          ? "no_show"
          : input.status
        : undefined,
      notes: input.notes,
    },
  });

  return appointmentToLead(row);
}

export async function deleteAppointment(id: string): Promise<boolean> {
  try {
    await prisma.appointment.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}
