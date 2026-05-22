import type { LeadAppointment } from "./types";
import { findAppointmentForSlot } from "./slot-availability";
import {
  buildSlotsForWeekMonday,
  dayKey,
  formatDayLabel,
  formatShortDay,
  getBookingWeekdays,
  getMondayKeyForDate,
  isSlotInBookingWindow,
  parseDayKey,
} from "@/lib/mail/booking-slots";

export type AdminCalendarAppointment = {
  id: string;
  businessName: string;
  contactName?: string;
  source: LeadAppointment["source"];
  status: LeadAppointment["status"];
  scheduledAt: string;
};

export type AdminCalendarCell = {
  iso: string;
  timeLabel: string;
  available: boolean;
  inBookingWindow: boolean;
  appointment?: AdminCalendarAppointment;
};

export type AdminCalendarWeek = {
  weekStart: string;
  weekEnd: string;
  weekLabel: string;
  days: { key: string; label: string; shortLabel: string }[];
  times: string[];
  /** rows = times, cols = days (ma–vr) */
  grid: AdminCalendarCell[][];
};

function formatWeekLabel(mondayKey: string, fridayKey: string): string {
  const mon = parseDayKey(mondayKey);
  const fri = parseDayKey(fridayKey);
  const fmt = (y: number, m: number, d: number) =>
    new Intl.DateTimeFormat("nl-NL", {
      timeZone: "Europe/Amsterdam",
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(
      new Date(
        `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}T12:00:00+02:00`,
      ),
    );
  return `${fmt(mon.year, mon.month, mon.day)} – ${fmt(fri.year, fri.month, fri.day)}`;
}

export function buildAdminCalendarWeek(
  appointments: LeadAppointment[],
  weekStartKey?: string,
  now: Date = new Date(),
): AdminCalendarWeek {
  const mondayKey = weekStartKey ?? getMondayKeyForDate(now);
  const weekSlots = buildSlotsForWeekMonday(mondayKey);
  const dayKeys = [...new Set(weekSlots.map((s) => s.dayKey))].sort();
  const fridayKey = dayKeys[dayKeys.length - 1] ?? mondayKey;

  const windowDayKeys = new Set(
    getBookingWeekdays(now).map((d) => dayKey(d.year, d.month, d.day)),
  );

  const times = [...new Set(weekSlots.map((s) => s.timeLabel))].sort();

  const days = dayKeys.map((key) => {
    const { year, month, day } = parseDayKey(key);
    return {
      key,
      label: formatDayLabel(year, month, day),
      shortLabel: formatShortDay(year, month, day),
    };
  });

  const grid: AdminCalendarCell[][] = times.map((timeLabel) =>
    dayKeys.map((dayKeyVal) => {
      const slot = weekSlots.find(
        (s) => s.dayKey === dayKeyVal && s.timeLabel === timeLabel,
      );
      if (!slot) {
        return {
          iso: "",
          timeLabel,
          available: false,
          inBookingWindow: false,
        };
      }

      const apt = findAppointmentForSlot(appointments, slot.iso);
      const inBookingWindow =
        windowDayKeys.has(dayKeyVal) && isSlotInBookingWindow(slot.iso, now);

      return {
        iso: slot.iso,
        timeLabel,
        available: !apt && inBookingWindow,
        inBookingWindow,
        appointment: apt
          ? {
              id: apt.id,
              businessName: apt.businessName,
              contactName: apt.contactName,
              source: apt.source,
              status: apt.status,
              scheduledAt: apt.scheduledAt,
            }
          : undefined,
      };
    }),
  );

  return {
    weekStart: mondayKey,
    weekEnd: fridayKey,
    weekLabel: formatWeekLabel(mondayKey, fridayKey),
    days,
    times,
    grid,
  };
}

export { getMondayKeyForDate };
