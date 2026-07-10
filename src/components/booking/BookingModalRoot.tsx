"use client";

import type { ReactNode } from "react";
import { BookingModalProvider } from "./BookingModalContext";
import { BookingModal } from "./BookingModal";

export function BookingModalRoot({ children }: { children: ReactNode }) {
  return (
    <BookingModalProvider>
      {children}
      <BookingModal />
    </BookingModalProvider>
  );
}
