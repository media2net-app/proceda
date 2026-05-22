"use client";

import { useTranslations } from "next-intl";
import type { AdminCalendarWeek } from "@/lib/afspraken/calendar-week";
type Props = {
  calendar: AdminCalendarWeek;
  weekStart: string;
  onWeekChange: (mondayKey: string) => void;
  onSelectAppointment?: (id: string) => void;
  selectedAppointmentId?: string | null;
};

export function AppointmentsCalendar({
  calendar,
  weekStart,
  onWeekChange,
  onSelectAppointment,
  selectedAppointmentId,
}: Props) {
  const t = useTranslations("adminAfspraken");

  function prevWeek() {
    const d = new Date(`${weekStart}T12:00:00+02:00`);
    d.setDate(d.getDate() - 7);
    const key = formatMondayKey(d);
    onWeekChange(key);
  }

  function nextWeek() {
    const d = new Date(`${weekStart}T12:00:00+02:00`);
    d.setDate(d.getDate() + 7);
    const key = formatMondayKey(d);
    onWeekChange(key);
  }

  function todayWeek() {
    onWeekChange(getMondayKeyLocal(new Date()));
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[#EAECF0] bg-white shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EAECF0] bg-[#F9FAFB] px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-[#101828]">{calendar.weekLabel}</p>
          <p className="text-xs text-[#667085]">{t("calendarLegend")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={prevWeek}
            className="rounded-lg border border-[#D0D5DD] bg-white px-3 py-1.5 text-xs font-semibold text-[#344054] hover:bg-[#F9FAFB]"
          >
            {t("calendarPrevWeek")}
          </button>
          <button
            type="button"
            onClick={todayWeek}
            className="rounded-lg border border-[#D6BBFB] bg-[#F9F5FF] px-3 py-1.5 text-xs font-semibold text-[#6941C6]"
          >
            {t("calendarThisWeek")}
          </button>
          <button
            type="button"
            onClick={nextWeek}
            className="rounded-lg border border-[#D0D5DD] bg-white px-3 py-1.5 text-xs font-semibold text-[#344054] hover:bg-[#F9FAFB]"
          >
            {t("calendarNextWeek")}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 border-b border-[#EAECF0] px-4 py-2 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded border border-[#ABEFC6] bg-[#ECFDF3]" />
          {t("calendarFree")}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-[#7F56D9]" />
          {t("calendarBooked")}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-[#F2F4F7]" />
          {t("calendarOutsideWindow")}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#EAECF0] bg-[#F9FAFB]">
              <th className="sticky left-0 z-10 w-14 border-r border-[#EAECF0] bg-[#F9FAFB] px-2 py-2 text-left font-semibold text-[#667085]">
                {t("calendarTime")}
              </th>
              {calendar.days.map((day) => (
                <th
                  key={day.key}
                  className="min-w-[120px] px-2 py-2 text-center font-semibold text-[#344054]"
                >
                  <span className="block">{day.shortLabel}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {calendar.grid.map((row, rowIdx) => {
              const timeLabel = calendar.times[rowIdx] ?? "";
              return (
                <tr key={timeLabel} className="border-b border-[#F2F4F7]">
                  <td className="sticky left-0 z-10 border-r border-[#EAECF0] bg-white px-2 py-1 font-medium text-[#667085] whitespace-nowrap">
                    {timeLabel}
                  </td>
                  {row.map((cell) => (
                    <td key={`${cell.iso}-${timeLabel}`} className="p-0.5">
                      <CalendarCell
                        cell={cell}
                        selected={cell.appointment?.id === selectedAppointmentId}
                        onSelect={() =>
                          cell.appointment?.id &&
                          onSelectAppointment?.(cell.appointment.id)
                        }
                        t={t}
                      />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CalendarCell({
  cell,
  selected,
  onSelect,
  t,
}: {
  cell: AdminCalendarWeek["grid"][0][0];
  selected: boolean;
  onSelect: () => void;
  t: ReturnType<typeof useTranslations<"adminAfspraken">>;
}) {
  if (!cell.iso) {
    return <div className="h-9 rounded bg-[#F9FAFB]" />;
  }

  if (cell.appointment) {
    const apt = cell.appointment;
    return (
      <button
        type="button"
        onClick={onSelect}
        title={`${apt.businessName} · ${new Date(apt.scheduledAt).toLocaleString("nl-NL", { timeStyle: "short" })}`}
        className={`flex h-9 w-full flex-col items-start justify-center rounded px-1.5 text-left transition ${
          selected
            ? "ring-2 ring-[#7F56D9] ring-offset-1"
            : "hover:brightness-95"
        } bg-[#7F56D9] text-white`}
      >
        <span className="truncate w-full font-semibold leading-tight">
          {apt.businessName}
        </span>
        <span className="truncate w-full text-[10px] opacity-90">
          {apt.source === "auto-mail" ? t("sourceAutoMail") : t("sourceColdCall")}
        </span>
      </button>
    );
  }

  if (cell.inBookingWindow && cell.available) {
    return (
      <div
        title={t("calendarSlotFree")}
        className="flex h-9 items-center justify-center rounded border border-[#ABEFC6] bg-[#ECFDF3] text-[10px] font-medium text-[#027A48]"
      >
        ·
      </div>
    );
  }

  return (
    <div
      title={t("calendarSlotUnavailable")}
      className="h-9 rounded bg-[#F2F4F7]"
    />
  );
}

function getMondayKeyLocal(d: Date): string {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const mon = new Date(d);
  mon.setDate(d.getDate() + diff);
  return formatMondayKey(mon);
}

function formatMondayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function AppointmentCalendarDetail({
  appointment,
  onClose,
}: {
  appointment: AdminCalendarWeek["grid"][0][0]["appointment"];
  onClose: () => void;
}) {
  const t = useTranslations("adminAfspraken");
  if (!appointment) return null;

  return (
    <div className="mt-4 rounded-xl border border-[#D6BBFB] bg-[#F9F5FF] p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-[#101828]">{appointment.businessName}</p>
          {appointment.contactName && (
            <p className="text-sm text-[#667085]">{appointment.contactName}</p>
          )}
          <p className="mt-1 text-sm text-[#344054]">
            {new Date(appointment.scheduledAt).toLocaleString("nl-NL", {
              weekday: "long",
              day: "numeric",
              month: "long",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-xs font-medium text-[#6941C6] hover:underline"
        >
          {t("calendarCloseDetail")}
        </button>
      </div>
    </div>
  );
}
