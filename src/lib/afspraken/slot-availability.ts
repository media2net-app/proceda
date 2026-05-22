import type { LeadAppointment } from "./types";

/** Alleen geplande afspraken blokkeren het gedeelde demo-rooster. */
export function getBlockingAppointments(
  appointments: LeadAppointment[],
): LeadAppointment[] {
  return appointments.filter((a) => a.status === "scheduled");
}

export function appointmentOverlapsSlot(
  appointment: LeadAppointment,
  slotIso: string,
  slotMinutes: number = 30,
): boolean {
  const slotStart = new Date(slotIso).getTime();
  const slotEnd = slotStart + slotMinutes * 60 * 1000;
  const aptStart = new Date(appointment.scheduledAt).getTime();
  const aptEnd = aptStart + appointment.durationMinutes * 60 * 1000;
  return aptStart < slotEnd && aptEnd > slotStart;
}

export function findAppointmentForSlot(
  appointments: LeadAppointment[],
  slotIso: string,
): LeadAppointment | undefined {
  const blocking = getBlockingAppointments(appointments);
  return blocking.find((a) => appointmentOverlapsSlot(a, slotIso));
}

export function isSlotTaken(
  appointments: LeadAppointment[],
  slotIso: string,
): boolean {
  return findAppointmentForSlot(appointments, slotIso) != null;
}

export function filterAvailableSlots<T extends { iso: string }>(
  slots: T[],
  appointments: LeadAppointment[],
): T[] {
  return slots.filter((s) => !isSlotTaken(appointments, s.iso));
}

export function hasSlotConflict(
  appointments: LeadAppointment[],
  scheduledAt: string,
  durationMinutes: number,
  excludeAppointmentId?: string,
): boolean {
  const blocking = getBlockingAppointments(appointments).filter(
    (a) => a.id !== excludeAppointmentId,
  );

  const newStart = new Date(scheduledAt).getTime();
  const newEnd = newStart + durationMinutes * 60 * 1000;

  return blocking.some((a) => {
    const aptStart = new Date(a.scheduledAt).getTime();
    const aptEnd = aptStart + a.durationMinutes * 60 * 1000;
    return newStart < aptEnd && newEnd > aptStart;
  });
}
