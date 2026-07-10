"use client";

import { BookingCtaButton } from "@/components/booking/BookingCtaButton";

export function BookingFooterCta({ label }: { label: string }) {
  return <BookingCtaButton showArrow>{label}</BookingCtaButton>;
}
