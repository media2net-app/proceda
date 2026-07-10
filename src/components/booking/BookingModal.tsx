"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, ArrowRight, Calendar, Check, Clock, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { trackClientAnalyticsEvent } from "@/lib/analytics-event-client";
import type { WebsiteBookingIntake } from "@/lib/booking/intake";
import { useBookingModal } from "./BookingModalContext";

type Schedule = {
  days: { key: string; label: string; date: string }[];
  slots: {
    iso: string;
    dayKey: string;
    timeLabel: string;
    dayLabel: string;
  }[];
};

type Step = "intake" | "schedule" | "done";

type IntakeForm = {
  contactName: string;
  email: string;
  businessName: string;
  phone: string;
  role: string;
  teamSize: string;
  interest: string;
  message: string;
};

const emptyIntake: IntakeForm = {
  contactName: "",
  email: "",
  businessName: "",
  phone: "",
  role: "",
  teamSize: "",
  interest: "",
  message: "",
};

const inputClass =
  "mt-1.5 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-[#7F56D9]/60 focus:outline-none focus:ring-2 focus:ring-[#7F56D9]/20";

const selectClass =
  "mt-1.5 w-full rounded-lg border border-white/10 bg-[#141414] px-3 py-2.5 text-sm text-white focus:border-[#7F56D9]/60 focus:outline-none focus:ring-2 focus:ring-[#7F56D9]/20";

export function BookingModal() {
  const t = useTranslations("bookingModal");
  const locale = useLocale();
  const { isOpen, closeBooking } = useBookingModal();

  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<Step>("intake");
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [intake, setIntake] = useState<IntakeForm>(emptyIntake);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookedAt, setBookedAt] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const reset = useCallback(() => {
    setStep("intake");
    setSchedule(null);
    setSelectedDay(null);
    setSelectedSlot(null);
    setIntake(emptyIntake);
    setSubmitting(false);
    setError(null);
    setBookedAt(null);
  }, []);

  const handleClose = useCallback(() => {
    closeBooking();
    window.setTimeout(reset, 300);
  }, [closeBooking, reset]);

  const loadSchedule = useCallback(async () => {
    setLoadingSchedule(true);
    setError(null);
    try {
      const res = await fetch("/api/booking/schedule");
      if (!res.ok) throw new Error("load");
      const json = (await res.json()) as { schedule: Schedule };
      setSchedule(json.schedule);
      setSelectedDay(json.schedule.days[0]?.key ?? null);
    } catch {
      setError(t("loadError"));
    } finally {
      setLoadingSchedule(false);
    }
  }, [t]);

  useEffect(() => {
    if (!isOpen) return;
    void trackClientAnalyticsEvent({
      eventName: "booking_view",
      path: window.location.pathname,
      metadata: { source: "website_modal" },
    });
    void loadSchedule();
  }, [isOpen, loadSchedule]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleClose]);

  const slotsForDay = useMemo(() => {
    if (!schedule || !selectedDay) return [];
    return schedule.slots.filter((s) => s.dayKey === selectedDay);
  }, [schedule, selectedDay]);

  function updateIntake(field: keyof IntakeForm, value: string) {
    setIntake((prev) => ({ ...prev, [field]: value }));
  }

  function validateIntake(): boolean {
    if (!intake.contactName.trim() || !intake.email.trim() || !intake.businessName.trim()) {
      setError(t("missingFields"));
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(intake.email.trim())) {
      setError(t("invalidEmail"));
      return false;
    }
    setError(null);
    return true;
  }

  function goToSchedule() {
    if (!validateIntake()) return;
    setStep("schedule");
  }

  async function confirmBooking() {
    if (!selectedSlot) return;
    setSubmitting(true);
    setError(null);

    void trackClientAnalyticsEvent({
      eventName: "booking_submit",
      metadata: { scheduledAt: selectedSlot, source: "website_modal" },
    });

    const intakePayload: WebsiteBookingIntake = {
      role: intake.role || undefined,
      teamSize: intake.teamSize || undefined,
      interest: intake.interest || undefined,
      message: intake.message || undefined,
    };

    try {
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduledAt: selectedSlot,
          contactName: intake.contactName.trim(),
          email: intake.email.trim(),
          businessName: intake.businessName.trim(),
          phone: intake.phone.trim() || undefined,
          locale,
          intake: intakePayload,
        }),
      });
      const json = (await res.json()) as {
        appointment?: { scheduledAt: string };
        error?: string;
      };
      if (!res.ok) {
        const msg =
          json.error === "INVALID_SLOT" || json.error === "SLOT_TAKEN"
            ? t("errorInvalidSlot")
            : t("bookError");
        throw new Error(msg);
      }
      setBookedAt(json.appointment?.scheduledAt ?? selectedSlot);
      setStep("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : t("bookError"));
    } finally {
      setSubmitting(false);
    }
  }

  if (!mounted || !isOpen) return null;

  const stepIndex = step === "intake" ? 0 : step === "schedule" ? 1 : 2;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        aria-label={t("close")}
        onClick={handleClose}
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-modal-title"
        className="relative flex max-h-[94dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl border border-white/10 bg-[#0f0f0f] shadow-2xl shadow-[#7F56D9]/10 sm:max-h-[90dvh] sm:rounded-2xl"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#B692F6]">
              {t("eyebrow")}
            </p>
            <h2 id="booking-modal-title" className="mt-1 text-lg font-semibold text-white">
              {step === "done" ? t("confirmedTitle") : t("title")}
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            aria-label={t("close")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {step !== "done" && (
          <div className="flex shrink-0 gap-2 border-b border-white/10 px-5 py-3">
            {[t("stepIntake"), t("stepSchedule")].map((label, i) => (
              <div key={label} className="flex flex-1 items-center gap-2">
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                    i <= stepIndex
                      ? "bg-[#7F56D9] text-white"
                      : "border border-white/15 text-white/40"
                  }`}
                >
                  {i < stepIndex ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </span>
                <span className={`text-xs font-medium ${i <= stepIndex ? "text-white" : "text-white/40"}`}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          {error && (
            <p
              role="alert"
              className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
            >
              {error}
            </p>
          )}

          {step === "intake" && (
            <div className="space-y-4">
              <p className="text-sm text-white/55">{t("intakeSubtitle")}</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm sm:col-span-2">
                  <span className="font-medium text-white/80">{t("contactName")} *</span>
                  <input
                    type="text"
                    value={intake.contactName}
                    onChange={(e) => updateIntake("contactName", e.target.value)}
                    className={inputClass}
                    autoComplete="name"
                  />
                </label>
                <label className="block text-sm">
                  <span className="font-medium text-white/80">{t("email")} *</span>
                  <input
                    type="email"
                    value={intake.email}
                    onChange={(e) => updateIntake("email", e.target.value)}
                    className={inputClass}
                    autoComplete="email"
                  />
                </label>
                <label className="block text-sm">
                  <span className="font-medium text-white/80">{t("phone")}</span>
                  <input
                    type="tel"
                    value={intake.phone}
                    onChange={(e) => updateIntake("phone", e.target.value)}
                    className={inputClass}
                    autoComplete="tel"
                  />
                </label>
                <label className="block text-sm sm:col-span-2">
                  <span className="font-medium text-white/80">{t("company")} *</span>
                  <input
                    type="text"
                    value={intake.businessName}
                    onChange={(e) => updateIntake("businessName", e.target.value)}
                    className={inputClass}
                    autoComplete="organization"
                  />
                </label>
                <label className="block text-sm">
                  <span className="font-medium text-white/80">{t("role")}</span>
                  <select
                    value={intake.role}
                    onChange={(e) => updateIntake("role", e.target.value)}
                    className={selectClass}
                  >
                    <option value="">{t("rolePlaceholder")}</option>
                    <option value="founder">{t("roleFounder")}</option>
                    <option value="operations">{t("roleOperations")}</option>
                    <option value="it">{t("roleIt")}</option>
                    <option value="other">{t("roleOther")}</option>
                  </select>
                </label>
                <label className="block text-sm">
                  <span className="font-medium text-white/80">{t("teamSize")}</span>
                  <select
                    value={intake.teamSize}
                    onChange={(e) => updateIntake("teamSize", e.target.value)}
                    className={selectClass}
                  >
                    <option value="">{t("teamSizePlaceholder")}</option>
                    <option value="1-5">{t("teamSize1")}</option>
                    <option value="6-20">{t("teamSize2")}</option>
                    <option value="21-50">{t("teamSize3")}</option>
                    <option value="50+">{t("teamSize4")}</option>
                  </select>
                </label>
                <label className="block text-sm sm:col-span-2">
                  <span className="font-medium text-white/80">{t("interest")}</span>
                  <select
                    value={intake.interest}
                    onChange={(e) => updateIntake("interest", e.target.value)}
                    className={selectClass}
                  >
                    <option value="">{t("interestPlaceholder")}</option>
                    <option value="agents">{t("interestAgents")}</option>
                    <option value="automation">{t("interestAutomation")}</option>
                    <option value="local">{t("interestLocal")}</option>
                    <option value="explore">{t("interestExplore")}</option>
                  </select>
                </label>
                <label className="block text-sm sm:col-span-2">
                  <span className="font-medium text-white/80">{t("message")}</span>
                  <textarea
                    value={intake.message}
                    onChange={(e) => updateIntake("message", e.target.value)}
                    rows={3}
                    placeholder={t("messagePlaceholder")}
                    className={`${inputClass} resize-none`}
                  />
                </label>
              </div>
            </div>
          )}

          {step === "schedule" && (
            <div className="grid gap-6 md:grid-cols-[minmax(0,11rem)_1fr]">
              <aside className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-sm font-semibold text-white">{t("eventTitle")}</p>
                <div className="mt-3 space-y-2 text-sm text-white/55">
                  <p className="flex items-center gap-2">
                    <Clock className="h-4 w-4 shrink-0 text-[#B692F6]" aria-hidden />
                    {t("duration")}
                  </p>
                  <p className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 shrink-0 text-[#B692F6]" aria-hidden />
                    {t("hoursHint")}
                  </p>
                </div>
                <div className="mt-4 border-t border-white/10 pt-4">
                  <p className="text-xs text-white/40">{t("yourDetails")}</p>
                  <p className="mt-1 text-sm font-medium text-white">{intake.contactName}</p>
                  <p className="text-xs text-white/50">{intake.email}</p>
                  <p className="text-xs text-white/50">{intake.businessName}</p>
                </div>
              </aside>

              <div>
                {loadingSchedule || !schedule ? (
                  <p className="text-sm text-white/50">{t("loading")}</p>
                ) : (
                  <>
                    <h3 className="text-sm font-semibold text-white">{t("pickDay")}</h3>
                    <div className="scrollbar-hide-x -mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1">
                      {schedule.days.map((day) => (
                        <button
                          key={day.key}
                          type="button"
                          onClick={() => {
                            setSelectedDay(day.key);
                            setSelectedSlot(null);
                          }}
                          className={`shrink-0 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                            selectedDay === day.key
                              ? "border-[#7F56D9] bg-[#7F56D9]/20 text-white"
                              : "border-white/10 bg-white/5 text-white/70 hover:border-[#7F56D9]/40"
                          }`}
                        >
                          {day.label}
                        </button>
                      ))}
                    </div>

                    <h3 className="mt-6 text-sm font-semibold text-white">{t("pickTime")}</h3>
                    <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {slotsForDay.map((slot) => (
                        <button
                          key={slot.iso}
                          type="button"
                          onClick={() => {
                            setSelectedSlot(slot.iso);
                            void trackClientAnalyticsEvent({
                              eventName: "slot_select",
                              metadata: { slot: slot.iso, source: "website_modal" },
                            });
                          }}
                          className={`min-h-10 rounded-lg border px-2 py-2 text-sm font-medium transition-colors ${
                            selectedSlot === slot.iso
                              ? "border-[#7F56D9] bg-[#7F56D9] text-white"
                              : "border-white/10 bg-white/5 text-white/80 hover:border-[#7F56D9]/40"
                          }`}
                        >
                          {slot.timeLabel}
                        </button>
                      ))}
                    </div>
                    {slotsForDay.length === 0 && (
                      <p className="mt-3 text-sm text-white/50">{t("noSlots")}</p>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {step === "done" && bookedAt && (
            <div className="py-4 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#7F56D9]/20 text-[#B692F6]">
                <Check className="h-7 w-7" aria-hidden />
              </div>
              <p className="mt-4 text-sm text-white/55">{t("confirmedSubtitle")}</p>
              <p className="mt-4 text-lg font-semibold text-[#B692F6]">
                {new Date(bookedAt).toLocaleString(locale, {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: "Europe/Amsterdam",
                })}
              </p>
              <p className="mt-4 text-sm text-white/45">{t("confirmedHint")}</p>
            </div>
          )}
        </div>

        {step !== "done" && (
          <div className="flex shrink-0 items-center justify-between gap-3 border-t border-white/10 px-5 py-4">
            {step === "schedule" ? (
              <button
                type="button"
                onClick={() => {
                  setStep("intake");
                  setError(null);
                }}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-white/60 transition-colors hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden />
                {t("back")}
              </button>
            ) : (
              <span />
            )}

            {step === "intake" ? (
              <button
                type="button"
                onClick={goToSchedule}
                className="inline-flex items-center gap-2 rounded-full bg-[#7F56D9] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#6941C6]"
              >
                {t("continue")}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
            ) : (
              <button
                type="button"
                disabled={!selectedSlot || submitting}
                onClick={confirmBooking}
                className="inline-flex items-center gap-2 rounded-full bg-[#7F56D9] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#6941C6] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? t("booking") : t("ctaConfirm")}
              </button>
            )}
          </div>
        )}

        {step === "done" && (
          <div className="flex shrink-0 justify-center border-t border-white/10 px-5 py-4">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-full bg-white/10 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/15"
            >
              {t("close")}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
