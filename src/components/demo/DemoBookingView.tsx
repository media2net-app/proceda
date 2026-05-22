"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { storeDemoLeadSession } from "@/lib/analytics-demo-lead-client";

type Schedule = {
  days: { key: string; label: string; date: string }[];
  slots: {
    iso: string;
    dayKey: string;
    timeLabel: string;
    dayLabel: string;
  }[];
};

type DemoData = {
  businessName: string;
  city?: string;
  token: string;
  schedule: Schedule;
};

export function DemoBookingView({ token }: { token: string }) {
  const t = useTranslations("demoBooking");

  const [data, setData] = useState<DemoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [bookedAt, setBookedAt] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/demo/${token}`);
      if (!res.ok) {
        setData(null);
        setError(t("notFound"));
        return;
      }
      const json = (await res.json()) as DemoData;
      setData(json);
      storeDemoLeadSession({
        token: json.token,
        businessName: json.businessName,
      });
      setSelectedDay(json.schedule.days[0]?.key ?? null);
    } catch {
      setError(t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [token, t]);

  useEffect(() => {
    load();
  }, [load]);

  const slotsForDay = useMemo(() => {
    if (!data || !selectedDay) return [];
    return data.schedule.slots.filter((s) => s.dayKey === selectedDay);
  }, [data, selectedDay]);

  async function confirmBooking() {
    if (!selectedSlot) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/demo/${token}/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduledAt: selectedSlot,
          contactName: contactName.trim() || undefined,
          email: email.trim() || undefined,
        }),
      });
      const json = (await res.json()) as {
        appointment?: { scheduledAt: string };
        error?: string;
      };
      if (!res.ok) {
        const msg =
          json.error === "INVALID_SLOT"
            ? t("errorInvalidSlot")
            : t("bookError");
        throw new Error(msg);
      }
      setBookedAt(json.appointment?.scheduledAt ?? selectedSlot);
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("bookError"));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F9FAFB] px-4">
        <p className="text-sm text-[#667085]">{t("loading")}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F9FAFB] px-4">
        <div className="max-w-md rounded-xl border border-[#EAECF0] bg-white p-8 text-center shadow-xs">
          <p className="font-medium text-[#101828]">{error ?? t("notFound")}</p>
        </div>
      </div>
    );
  }

  if (done && bookedAt) {
    const when = new Date(bookedAt);
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#F9F5FF] to-[#F9FAFB] px-4 py-12">
        <div className="max-w-lg w-full rounded-2xl border border-[#D6BBFB] bg-white p-8 text-center shadow-lg">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#F9F5FF] text-2xl">
            ✓
          </div>
          <h1 className="mt-4 text-2xl font-semibold text-[#101828]">{t("confirmedTitle")}</h1>
          <p className="mt-2 text-sm text-[#475467]">{t("confirmedSubtitle")}</p>
          <p className="mt-6 text-lg font-semibold text-[#7F56D9]">
            {when.toLocaleString("nl-NL", {
              weekday: "long",
              day: "numeric",
              month: "long",
              hour: "2-digit",
              minute: "2-digit",
              timeZone: "Europe/Amsterdam",
            })}
          </p>
          <p className="mt-4 text-sm text-[#667085]">{t("confirmedHint")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F9F5FF] via-[#F9FAFB] to-white">
      <header className="border-b border-[#EAECF0] bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-3xl items-center gap-2 px-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#7F56D9] text-sm font-bold text-white">
            P
          </span>
          <span className="text-lg font-bold text-[#101828]">Proceda</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-sm font-semibold text-[#7F56D9]">{t("eyebrow")}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#101828]">
          {t("title")}
        </h1>
        <p className="mt-2 text-[#475467]">
          {t("subtitle", { name: data.businessName })}
        </p>
        {data.city && (
          <p className="text-sm text-[#667085]">{t("subtitleCity", { city: data.city })}</p>
        )}
        <p className="mt-1 text-sm text-[#667085]">{t("hoursHint")}</p>

        {error && (
          <p
            role="alert"
            className="mt-6 rounded-lg border border-[#FECDCA] bg-[#FEF3F2] px-4 py-3 text-sm text-[#B42318]"
          >
            {error}
          </p>
        )}

        <section className="mt-8 rounded-2xl border border-[#EAECF0] bg-white p-6 shadow-xs">
          <h2 className="text-sm font-semibold text-[#101828]">{t("pickDay")}</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {data.schedule.days.map((day) => (
              <button
                key={day.key}
                type="button"
                onClick={() => {
                  setSelectedDay(day.key);
                  setSelectedSlot(null);
                }}
                className={`rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors ${
                  selectedDay === day.key
                    ? "border-[#7F56D9] bg-[#F9F5FF] text-[#6941C6]"
                    : "border-[#D0D5DD] bg-white text-[#344054] hover:border-[#D6BBFB]"
                }`}
              >
                {day.label}
              </button>
            ))}
          </div>

          <h2 className="mt-8 text-sm font-semibold text-[#101828]">{t("pickTime")}</h2>
          <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
            {slotsForDay.map((slot) => (
              <button
                key={slot.iso}
                type="button"
                onClick={() => setSelectedSlot(slot.iso)}
                className={`rounded-lg border px-2 py-2 text-sm font-medium transition-colors ${
                  selectedSlot === slot.iso
                    ? "border-[#7F56D9] bg-[#7F56D9] text-white"
                    : "border-[#EAECF0] bg-[#F9FAFB] text-[#344054] hover:border-[#D6BBFB]"
                }`}
              >
                {slot.timeLabel}
              </button>
            ))}
          </div>
          {slotsForDay.length === 0 && (
            <p className="mt-4 text-sm text-[#667085]">{t("noSlots")}</p>
          )}
        </section>

        <section className="mt-6 rounded-2xl border border-[#EAECF0] bg-white p-6 shadow-xs">
          <h2 className="text-sm font-semibold text-[#101828]">{t("yourDetails")}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="font-medium text-[#344054]">{t("contactName")}</span>
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-[#D0D5DD] px-3 py-2 text-[#101828] shadow-xs focus:border-[#7F56D9] focus:outline-none focus:ring-2 focus:ring-[#F4EBFF]"
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-[#344054]">{t("email")}</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-[#D0D5DD] px-3 py-2 text-[#101828] shadow-xs focus:border-[#7F56D9] focus:outline-none focus:ring-2 focus:ring-[#F4EBFF]"
              />
            </label>
          </div>
        </section>

        <button
          type="button"
          disabled={!selectedSlot || submitting}
          onClick={confirmBooking}
          className="mt-8 w-full rounded-lg bg-[#7F56D9] px-6 py-3.5 text-base font-semibold text-white hover:bg-[#6941C6] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {submitting ? t("booking") : t("ctaConfirm")}
        </button>
      </main>
    </div>
  );
}
