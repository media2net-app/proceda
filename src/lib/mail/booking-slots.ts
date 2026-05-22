import type { LeadAppointment } from "@/lib/afspraken/types";
import type { BookingDaysResponse, BookingSlot } from "./types";
import {
  filterAvailableSlots,
  isSlotTaken,
} from "@/lib/afspraken/slot-availability";

const START_HOUR = 8;
const END_HOUR = 20;
const SLOT_MINUTES = 30;
/** Eerste boekbare dag: vandaag + 1 (morgen). */
const MIN_LEAD_DAYS = 1;
/** Laatste boekbare dag: vandaag + 14 (max. 2 weken vooruit). */
const MAX_HORIZON_DAYS = 14;

/** CEST offset for demo window (mei 2026). */
const TZ_OFFSET = "+02:00";

export type BookingSlotLike = Pick<
  BookingSlot,
  "iso" | "dayKey" | "timeLabel" | "dayLabel"
>;

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function datePartsInAmsterdam(d: Date): {
  year: number;
  month: number;
  day: number;
  weekday: number;
  hour: number;
  minute: number;
} {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Amsterdam",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(d);
  const get = (type: string) =>
    parseInt(parts.find((p) => p.type === type)?.value ?? "0", 10);
  const wdMap: Record<string, number> = {
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
    Sun: 0,
  };
  const wdStr = parts.find((p) => p.type === "weekday")?.value ?? "Mon";
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    weekday: wdMap[wdStr] ?? 1,
    hour: get("hour"),
    minute: get("minute"),
  };
}

export function amsterdamIso(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
): string {
  return `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:00${TZ_OFFSET}`;
}

export function formatDayLabel(year: number, month: number, day: number): string {
  const d = new Date(amsterdamIso(year, month, day, 12, 0));
  return new Intl.DateTimeFormat("nl-NL", {
    timeZone: "Europe/Amsterdam",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(d);
}

export function formatShortDay(year: number, month: number, day: number): string {
  const d = new Date(amsterdamIso(year, month, day, 12, 0));
  return new Intl.DateTimeFormat("nl-NL", {
    timeZone: "Europe/Amsterdam",
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(d);
}

function formatTime(hour: number, minute: number): string {
  return `${pad(hour)}:${pad(minute)}`;
}

export function dayKey(year: number, month: number, day: number): string {
  return `${year}-${pad(month)}-${pad(day)}`;
}

export function parseDayKey(key: string): {
  year: number;
  month: number;
  day: number;
} {
  const [y, m, d] = key.split("-").map((x) => parseInt(x, 10));
  return { year: y!, month: m!, day: d! };
}

export function addCalendarDays(
  year: number,
  month: number,
  day: number,
  delta: number,
): { year: number; month: number; day: number } {
  const d = new Date(amsterdamIso(year, month, day, 12, 0));
  d.setDate(d.getDate() + delta);
  const p = datePartsInAmsterdam(d);
  return { year: p.year, month: p.month, day: p.day };
}

export function addDaysToDayKey(key: string, delta: number): string {
  const { year, month, day } = parseDayKey(key);
  const next = addCalendarDays(year, month, day, delta);
  return dayKey(next.year, next.month, next.day);
}

/** Maandag (YYYY-MM-DD) van de week waarin `anchor` valt. */
export function getMondayKeyForDate(anchor: Date = new Date()): string {
  const p = datePartsInAmsterdam(anchor);
  const noon = new Date(amsterdamIso(p.year, p.month, p.day, 12, 0));
  const wd = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Amsterdam",
    weekday: "short",
  }).format(noon);
  const wdMap: Record<string, number> = {
    Mon: 0,
    Tue: 1,
    Wed: 2,
    Thu: 3,
    Fri: 4,
    Sat: 5,
    Sun: 6,
  };
  const offset = wdMap[wd] ?? 0;
  return addDaysToDayKey(dayKey(p.year, p.month, p.day), -offset);
}

/** Weekdagen vanaf morgen t/m max. 2 weken vooruit (Amsterdam). */
export function getBookingWeekdays(
  now: Date = new Date(),
): { year: number; month: number; day: number }[] {
  const nowP = datePartsInAmsterdam(now);
  const start = addCalendarDays(nowP.year, nowP.month, nowP.day, MIN_LEAD_DAYS);
  const end = addCalendarDays(nowP.year, nowP.month, nowP.day, MAX_HORIZON_DAYS);
  const endKey = dayKey(end.year, end.month, end.day);

  const days: { year: number; month: number; day: number }[] = [];
  let cursor = start;

  for (let guard = 0; guard < MAX_HORIZON_DAYS + 7; guard++) {
    const key = dayKey(cursor.year, cursor.month, cursor.day);
    if (key > endKey) break;

    const noon = new Date(
      amsterdamIso(cursor.year, cursor.month, cursor.day, 12, 0),
    );
    const parts = datePartsInAmsterdam(noon);
    if (parts.weekday >= 1 && parts.weekday <= 5) {
      if (!days.some((d) => dayKey(d.year, d.month, d.day) === key)) {
        days.push({
          year: parts.year,
          month: parts.month,
          day: parts.day,
        });
      }
    }

    cursor = addCalendarDays(cursor.year, cursor.month, cursor.day, 1);
  }

  return days;
}

function buildSlotsForDates(
  dates: { year: number; month: number; day: number }[],
): BookingSlot[] {
  const slots: BookingSlot[] = [];

  for (const d of dates) {
    const dk = dayKey(d.year, d.month, d.day);

    for (let hour = START_HOUR; hour < END_HOUR; hour++) {
      for (let minute = 0; minute < 60; minute += SLOT_MINUTES) {
        if (hour * 60 + minute >= END_HOUR * 60) continue;

        slots.push({
          iso: amsterdamIso(d.year, d.month, d.day, hour, minute),
          dayKey: dk,
          timeLabel: formatTime(hour, minute),
          dayLabel: formatShortDay(d.year, d.month, d.day),
        });
      }
    }
  }

  return slots;
}

/** Alle slots in het boekbare venster (zonder bezetting). */
export function buildAllBookingSlots(now: Date = new Date()): BookingSlot[] {
  return buildSlotsForDates(getBookingWeekdays(now));
}

const bookingWindowIsoSetCache = new WeakMap<Date, Set<string>>();

function bookingWindowIsoSet(now: Date): Set<string> {
  let set = bookingWindowIsoSetCache.get(now);
  if (!set) {
    set = new Set(buildAllBookingSlots(now).map((s) => s.iso));
    bookingWindowIsoSetCache.set(now, set);
  }
  return set;
}

export function isSlotInBookingWindow(iso: string, now: Date = new Date()): boolean {
  return bookingWindowIsoSet(now).has(iso);
}

/** Slots voor ma–vr van een willekeurige week (admin-kalender). */
export function buildSlotsForWeekMonday(mondayKey: string): BookingSlot[] {
  const dates = [];
  for (let i = 0; i < 5; i++) {
    dates.push(parseDayKey(addDaysToDayKey(mondayKey, i)));
  }
  return buildSlotsForDates(dates);
}

export function buildBookingSchedule(
  now: Date = new Date(),
  appointments: LeadAppointment[] = [],
): BookingDaysResponse {
  const allSlots = buildAllBookingSlots(now);
  const slots = filterAvailableSlots(allSlots, appointments);
  const dayKeysWithSlots = new Set(slots.map((s) => s.dayKey));

  const days = getBookingWeekdays(now)
    .map((d) => ({
      key: dayKey(d.year, d.month, d.day),
      label: formatDayLabel(d.year, d.month, d.day),
      date: formatDayLabel(d.year, d.month, d.day),
    }))
    .filter((d) => dayKeysWithSlots.has(d.key));

  return { days, slots };
}

export function isValidBookingSlot(
  iso: string,
  now: Date = new Date(),
  appointments: LeadAppointment[] = [],
): boolean {
  if (!isSlotInBookingWindow(iso, now)) return false;
  if (isSlotTaken(appointments, iso)) return false;
  return buildAllBookingSlots(now).some((s) => s.iso === iso);
}
