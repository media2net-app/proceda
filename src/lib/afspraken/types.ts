import type { AdminCalendarWeek } from "./calendar-week";

export type AppointmentSource = "cold-call" | "auto-mail";

export type AppointmentStatus =
  | "scheduled"
  | "completed"
  | "cancelled"
  | "no-show";

export type LeadAppointment = {
  id: string;
  businessId?: string;
  businessName: string;
  contactName?: string;
  email?: string;
  phone?: string;
  source: AppointmentSource;
  scheduledAt: string;
  durationMinutes: number;
  meetLink: string;
  status: AppointmentStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type AfsprakenListResponse = {
  appointments: LeadAppointment[];
  stats: {
    total: number;
    upcoming: number;
    fromColdCall: number;
    fromAutoMail: number;
    completed: number;
    /** Geplande demo-slots in het boekbare venster (bezet). */
    bookedSlotsInWindow: number;
    /** Vrije slots in het boekbare venster. */
    freeSlotsInWindow: number;
  };
  calendar: AdminCalendarWeek;
};
