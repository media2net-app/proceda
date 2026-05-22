"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import type {
  AppointmentSource,
  AppointmentStatus,
  LeadAppointment,
} from "@/lib/afspraken/types";
import { businessIdToSlug } from "@/lib/bedrijven/slug";
import type { AdminCalendarWeek } from "@/lib/afspraken/calendar-week";
import { AppointmentsCalendar } from "./AppointmentsCalendar";
import { Link } from "@/i18n/navigation";

type Stats = {
  total: number;
  upcoming: number;
  fromColdCall: number;
  fromAutoMail: number;
  completed: number;
  bookedSlotsInWindow: number;
  freeSlotsInWindow: number;
};

type ViewMode = "list" | "calendar";

type BusinessOption = { id: string; name: string; email?: string; phone?: string };

const SOURCE_STYLES: Record<AppointmentSource, string> = {
  "cold-call": "bg-[#EFF8FF] text-[#175CD3] border-[#B2DDFF]",
  "auto-mail": "bg-[#F9F5FF] text-[#6941C6] border-[#D6BBFB]",
};

const STATUS_STYLES: Record<AppointmentStatus, string> = {
  scheduled: "bg-[#ECFDF3] text-[#027A48]",
  completed: "bg-[#F2F4F7] text-[#475467]",
  cancelled: "bg-[#FEF3F2] text-[#B42318]",
  "no-show": "bg-[#FFFAEB] text-[#B54708]",
};

export function AfsprakenView() {
  const t = useTranslations("adminAfspraken");

  const [appointments, setAppointments] = useState<LeadAppointment[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [calendar, setCalendar] = useState<AdminCalendarWeek | null>(null);
  const [weekStart, setWeekStart] = useState<string>(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const mon = new Date(d);
    mon.setDate(d.getDate() + diff);
    return `${mon.getFullYear()}-${String(mon.getMonth() + 1).padStart(2, "0")}-${String(mon.getDate()).padStart(2, "0")}`;
  });
  const [viewMode, setViewMode] = useState<ViewMode>("calendar");
  const [selectedCalendarAptId, setSelectedCalendarAptId] = useState<
    string | null
  >(null);
  const [businesses, setBusinesses] = useState<BusinessOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<"all" | AppointmentSource>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | AppointmentStatus>("all");
  const [timeFilter, setTimeFilter] = useState<"all" | "upcoming" | "past">("all");

  const [form, setForm] = useState({
    businessId: "",
    businessName: "",
    contactName: "",
    email: "",
    phone: "",
    source: "cold-call" as AppointmentSource,
    scheduledAt: "",
    durationMinutes: "30",
    meetLink: "",
    notes: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [afsRes, bizRes] = await Promise.all([
        fetch(`/api/afspraken?week=${encodeURIComponent(weekStart)}`),
        fetch("/api/bedrijven/options"),
      ]);
      const afs = (await afsRes.json()) as {
        appointments: LeadAppointment[];
        stats: Stats;
        calendar: AdminCalendarWeek;
      };
      setAppointments(afs.appointments ?? []);
      setStats(afs.stats ?? null);
      setCalendar(afs.calendar ?? null);

      const biz = (await bizRes.json()) as {
        businesses?: {
          id: string;
          name: string;
          email?: string;
          phone?: string;
        }[];
      };
      setBusinesses(
        (biz.businesses ?? []).map((b) => ({
          id: b.id,
          name: b.name,
          email: b.email,
          phone: b.phone,
        })),
      );
    } catch {
      setError(t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [t, weekStart]);

  useEffect(() => {
    load();
  }, [load]);

  const selectedCalendarAppointment = useMemo(() => {
    if (!selectedCalendarAptId) return null;
    return appointments.find((a) => a.id === selectedCalendarAptId) ?? null;
  }, [appointments, selectedCalendarAptId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const now = Date.now();
    return appointments.filter((a) => {
      if (sourceFilter !== "all" && a.source !== sourceFilter) return false;
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      const ts = new Date(a.scheduledAt).getTime();
      if (timeFilter === "upcoming" && (ts < now || a.status !== "scheduled"))
        return false;
      if (timeFilter === "past" && ts >= now && a.status === "scheduled")
        return false;
      if (!q) return true;
      return (
        a.businessName.toLowerCase().includes(q) ||
        (a.contactName?.toLowerCase().includes(q) ?? false) ||
        (a.email?.toLowerCase().includes(q) ?? false) ||
        (a.notes?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [appointments, search, sourceFilter, statusFilter, timeFilter]);

  function onBusinessSelect(id: string) {
    const b = businesses.find((x) => x.id === id);
    if (!b) {
      setForm((f) => ({ ...f, businessId: "", businessName: "" }));
      return;
    }
    setForm((f) => ({
      ...f,
      businessId: b.id,
      businessName: b.name,
      email: b.email ?? f.email,
      phone: b.phone ?? f.phone,
    }));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/afspraken", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: form.businessId || undefined,
          businessName: form.businessName,
          contactName: form.contactName || undefined,
          email: form.email || undefined,
          phone: form.phone || undefined,
          source: form.source,
          scheduledAt: new Date(form.scheduledAt).toISOString(),
          durationMinutes: Number(form.durationMinutes) || 30,
          meetLink: form.meetLink,
          notes: form.notes || undefined,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(
          data.error === "INVALID_MEET_LINK"
            ? t("invalidMeetLink")
            : data.error === "SLOT_TAKEN"
              ? t("slotTaken")
              : (data.error ?? t("saveError")),
        );
      }
      setShowForm(false);
      setForm({
        businessId: "",
        businessName: "",
        contactName: "",
        email: "",
        phone: "",
        source: "cold-call",
        scheduledAt: "",
        durationMinutes: "30",
        meetLink: "",
        notes: "",
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("saveError"));
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(id: string, status: AppointmentStatus) {
    await fetch(`/api/afspraken/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await load();
  }

  async function handleDelete(id: string) {
    if (!confirm(t("confirmDelete"))) return;
    await fetch(`/api/afspraken/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#101828]">{t("title")}</h1>
          <p className="mt-1 text-sm text-[#667085]">{t("subtitle")}</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="rounded-lg bg-[#7F56D9] px-4 py-2 text-sm font-semibold text-white hover:bg-[#6941C6]"
        >
          {showForm ? t("cancelForm") : t("addAppointment")}
        </button>
      </div>

      {stats && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-xl border border-[#EAECF0] bg-white p-4 shadow-xs">
            <p className="text-xs font-semibold uppercase text-[#667085]">{t("statTotal")}</p>
            <p className="text-2xl font-bold text-[#101828]">{stats.total}</p>
          </div>
          <div className="rounded-xl border border-[#ABEFC6] bg-[#ECFDF3] p-4 shadow-xs">
            <p className="text-xs font-semibold uppercase text-[#027A48]">{t("statUpcoming")}</p>
            <p className="text-2xl font-bold text-[#027A48]">{stats.upcoming}</p>
          </div>
          <div className="rounded-xl border border-[#B2DDFF] bg-[#EFF8FF] p-4 shadow-xs">
            <p className="text-xs font-semibold uppercase text-[#175CD3]">{t("statColdCall")}</p>
            <p className="text-2xl font-bold text-[#175CD3]">{stats.fromColdCall}</p>
          </div>
          <div className="rounded-xl border border-[#D6BBFB] bg-[#F9F5FF] p-4 shadow-xs">
            <p className="text-xs font-semibold uppercase text-[#6941C6]">{t("statAutoMail")}</p>
            <p className="text-2xl font-bold text-[#6941C6]">{stats.fromAutoMail}</p>
          </div>
          <div className="rounded-xl border border-[#EAECF0] bg-white p-4 shadow-xs">
            <p className="text-xs font-semibold uppercase text-[#667085]">{t("statCompleted")}</p>
            <p className="text-2xl font-bold text-[#101828]">{stats.completed}</p>
          </div>
          <div className="rounded-xl border border-[#ABEFC6] bg-[#ECFDF3] p-4 shadow-xs sm:col-span-2 lg:col-span-1">
            <p className="text-xs font-semibold uppercase text-[#027A48]">
              {t("statFreeSlots")}
            </p>
            <p className="text-2xl font-bold text-[#027A48]">
              {stats.freeSlotsInWindow}
            </p>
            <p className="mt-1 text-xs text-[#667085]">
              {t("statBookedSlots", { count: stats.bookedSlotsInWindow })}
            </p>
          </div>
        </div>
      )}

      <div className="mb-4 flex gap-2">
        <TabBtn
          active={viewMode === "calendar"}
          onClick={() => setViewMode("calendar")}
        >
          {t("viewCalendar")}
        </TabBtn>
        <TabBtn active={viewMode === "list"} onClick={() => setViewMode("list")}>
          {t("viewList")}
        </TabBtn>
      </div>

      {error && (
        <p
          role="alert"
          className="mb-4 rounded-lg border border-[#FECDCA] bg-[#FEF3F2] px-4 py-3 text-sm text-[#B42318]"
        >
          {error}
        </p>
      )}

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-6 rounded-xl border border-[#D6BBFB] bg-[#F9F5FF] p-5 shadow-xs"
        >
          <h2 className="text-base font-semibold text-[#101828]">{t("formTitle")}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-[#344054]">{t("fieldBusiness")}</label>
              <select
                value={form.businessId}
                onChange={(e) => onBusinessSelect(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#D0D5DD] bg-white px-3 py-2 text-sm"
              >
                <option value="">{t("fieldBusinessManual")}</option>
                {businesses.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                required
                placeholder={t("fieldBusinessPlaceholder")}
                value={form.businessName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, businessName: e.target.value, businessId: "" }))
                }
                className="mt-2 w-full rounded-lg border border-[#D0D5DD] bg-white px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[#344054]">{t("fieldSource")}</label>
              <select
                value={form.source}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    source: e.target.value as AppointmentSource,
                  }))
                }
                className="mt-1 w-full rounded-lg border border-[#D0D5DD] bg-white px-3 py-2 text-sm"
              >
                <option value="cold-call">{t("sourceColdCall")}</option>
                <option value="auto-mail">{t("sourceAutoMail")}</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-[#344054]">{t("fieldDatetime")}</label>
              <input
                type="datetime-local"
                required
                value={form.scheduledAt}
                onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-[#D0D5DD] bg-white px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[#344054]">{t("fieldMeetLink")}</label>
              <input
                type="url"
                required
                placeholder="https://meet.google.com/xxx-xxxx-xxx"
                value={form.meetLink}
                onChange={(e) => setForm((f) => ({ ...f, meetLink: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-[#D0D5DD] bg-white px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[#344054]">{t("fieldDuration")}</label>
              <input
                type="number"
                min={15}
                step={15}
                value={form.durationMinutes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, durationMinutes: e.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-[#D0D5DD] bg-white px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[#344054]">{t("fieldContact")}</label>
              <input
                type="text"
                value={form.contactName}
                onChange={(e) => setForm((f) => ({ ...f, contactName: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-[#D0D5DD] bg-white px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[#344054]">{t("fieldEmail")}</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-[#D0D5DD] bg-white px-3 py-2 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-[#344054]">{t("fieldNotes")}</label>
              <textarea
                rows={2}
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-[#D0D5DD] bg-white px-3 py-2 text-sm"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="mt-4 rounded-lg bg-[#7F56D9] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? t("saving") : t("saveAppointment")}
          </button>
        </form>
      )}

      {viewMode === "list" && (
      <div className="mb-4 flex flex-wrap gap-3">
        <input
          type="search"
          placeholder={t("search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-w-[200px] flex-1 rounded-lg border border-[#D0D5DD] bg-white px-4 py-2 text-sm sm:max-w-xs"
        />
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value as typeof sourceFilter)}
          className="rounded-lg border border-[#D0D5DD] bg-white px-3 py-2 text-sm"
        >
          <option value="all">{t("filterAllSources")}</option>
          <option value="cold-call">{t("sourceColdCall")}</option>
          <option value="auto-mail">{t("sourceAutoMail")}</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="rounded-lg border border-[#D0D5DD] bg-white px-3 py-2 text-sm"
        >
          <option value="all">{t("filterAllStatus")}</option>
          <option value="scheduled">{t("statusScheduled")}</option>
          <option value="completed">{t("statusCompleted")}</option>
          <option value="cancelled">{t("statusCancelled")}</option>
          <option value="no-show">{t("statusNoShow")}</option>
        </select>
        <select
          value={timeFilter}
          onChange={(e) => setTimeFilter(e.target.value as typeof timeFilter)}
          className="rounded-lg border border-[#D0D5DD] bg-white px-3 py-2 text-sm"
        >
          <option value="all">{t("filterAllTime")}</option>
          <option value="upcoming">{t("filterUpcoming")}</option>
          <option value="past">{t("filterPast")}</option>
        </select>
      </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-[#EAECF0] bg-white py-16 text-center text-sm text-[#667085]">
          {t("loading")}
        </div>
      ) : viewMode === "calendar" && calendar ? (
        <>
          <AppointmentsCalendar
            calendar={calendar}
            weekStart={weekStart}
            onWeekChange={setWeekStart}
            selectedAppointmentId={selectedCalendarAptId}
            onSelectAppointment={setSelectedCalendarAptId}
          />
          {selectedCalendarAppointment && (
            <div className="mt-4 rounded-xl border border-[#EAECF0] bg-white p-4 shadow-xs">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-[#101828]">
                    {selectedCalendarAppointment.businessName}
                  </p>
                  <p className="text-sm text-[#667085]">
                    {new Date(selectedCalendarAppointment.scheduledAt).toLocaleString(
                      "nl-NL",
                      {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        hour: "2-digit",
                        minute: "2-digit",
                      },
                    )}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedCalendarAppointment.businessId && (
                    <Link
                      href={`/dashboard-admin/rapportage/${businessIdToSlug(selectedCalendarAppointment.businessId)}`}
                      className="rounded-lg border border-[#D6BBFB] bg-[#F9F5FF] px-3 py-1.5 text-xs font-semibold text-[#6941C6]"
                    >
                      {t("viewLead")} →
                    </Link>
                  )}
                  <a
                    href={selectedCalendarAppointment.meetLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg bg-[#101828] px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    {t("openMeet")}
                  </a>
                  <button
                    type="button"
                    onClick={() => setSelectedCalendarAptId(null)}
                    className="text-xs font-medium text-[#667085] hover:underline"
                  >
                    {t("calendarCloseDetail")}
                  </button>
                </div>
              </div>
            </div>
          )}
          <p className="mt-4 text-xs text-[#98A2B3]">{t("calendarSharedNote")}</p>
        </>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#D0D5DD] bg-white py-16 text-center">
          <p className="text-sm font-medium text-[#101828]">{t("empty")}</p>
          <p className="mt-1 text-xs text-[#667085]">{t("emptyHint")}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[#EAECF0] bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-[#EAECF0] bg-[#F9FAFB] text-xs uppercase text-[#667085]">
                <tr>
                  <th className="px-4 py-3 font-semibold">{t("colWhen")}</th>
                  <th className="px-4 py-3 font-semibold">{t("colLead")}</th>
                  <th className="px-4 py-3 font-semibold">{t("colSource")}</th>
                  <th className="px-4 py-3 font-semibold">{t("colMeet")}</th>
                  <th className="px-4 py-3 font-semibold">{t("colStatus")}</th>
                  <th className="px-4 py-3 font-semibold">{t("colActions")}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => {
                  const isPast = new Date(a.scheduledAt).getTime() < Date.now();
                  return (
                    <tr
                      key={a.id}
                      className={`border-b border-[#F2F4F7] ${isPast && a.status === "scheduled" ? "bg-[#FFFAEB]/40" : ""}`}
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="font-medium text-[#101828]">
                          {new Date(a.scheduledAt).toLocaleString(undefined, {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </p>
                        <p className="text-xs text-[#667085]">
                          {a.durationMinutes} min
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-[#101828]">{a.businessName}</p>
                        {a.contactName && (
                          <p className="text-xs text-[#667085]">{a.contactName}</p>
                        )}
                        {a.businessId && (
                          <Link
                            href={`/dashboard-admin/rapportage/${businessIdToSlug(a.businessId)}`}
                            className="text-xs font-medium text-[#7F56D9] hover:underline"
                          >
                            {t("viewLead")} →
                          </Link>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${SOURCE_STYLES[a.source]}`}
                        >
                          {a.source === "cold-call"
                            ? t("sourceColdCall")
                            : t("sourceAutoMail")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <a
                          href={a.meetLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg bg-[#101828] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#344054]"
                        >
                          {t("openMeet")}
                        </a>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={a.status}
                          onChange={(e) =>
                            updateStatus(a.id, e.target.value as AppointmentStatus)
                          }
                          className={`rounded-full border-0 px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[a.status]}`}
                        >
                          <option value="scheduled">{t("statusScheduled")}</option>
                          <option value="completed">{t("statusCompleted")}</option>
                          <option value="cancelled">{t("statusCancelled")}</option>
                          <option value="no-show">{t("statusNoShow")}</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => handleDelete(a.id)}
                          className="text-xs font-medium text-[#B42318] hover:underline"
                        >
                          {t("delete")}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {viewMode === "list" && (
        <p className="mt-4 text-xs text-[#98A2B3]">{t("calendarSharedNote")}</p>
      )}
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
        active
          ? "bg-[#7F56D9] text-white"
          : "border border-[#D0D5DD] bg-white text-[#344054] hover:bg-[#F9FAFB]"
      }`}
    >
      {children}
    </button>
  );
}
