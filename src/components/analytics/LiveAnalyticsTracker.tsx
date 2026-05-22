"use client";

import { usePathname } from "@/i18n/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  BOOKING_ENGAGED_EVENT,
  clearBookingFormEngaged,
  isBookingFormEngaged,
  isDemoBookingPath,
  registerBookingFormEngagementListeners,
} from "@/lib/analytics-booking-engagement";
import {
  clearDemoLeadSession,
  readDemoLeadSession,
} from "@/lib/analytics-demo-lead-client";

const VISITOR_KEY = "proceda_visitor_id";
const HEARTBEAT_MS = 25_000;

function readVisitorId(): string {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

function readSessionId(): string {
  try {
    let id = sessionStorage.getItem("proceda_session_id");
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem("proceda_session_id", id);
    }
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

const SKIP_PREFIXES = [
  "/dashboard-admin",
  "/dashboard",
  "/login",
];

export default function LiveAnalyticsTracker() {
  const pathname = usePathname() ?? "/";
  const [bookingEngaged, setBookingEngaged] = useState(false);
  const [demoLead, setDemoLead] = useState(
    () => readDemoLeadSession(),
  );
  const bookingEngagedRef = useRef(false);
  const demoLeadRef = useRef(demoLead);

  useEffect(() => {
    bookingEngagedRef.current = bookingEngaged;
  }, [bookingEngaged]);

  useEffect(() => {
    demoLeadRef.current = demoLead;
  }, [demoLead]);

  useEffect(() => {
    if (!isDemoBookingPath(pathname)) {
      clearBookingFormEngaged();
      clearDemoLeadSession();
      setBookingEngaged(false);
      setDemoLead(null);
      return;
    }
    setDemoLead(readDemoLeadSession());
    setBookingEngaged(isBookingFormEngaged());
    return registerBookingFormEngagementListeners(pathname);
  }, [pathname]);

  useEffect(() => {
    const onLead = () => setDemoLead(readDemoLeadSession());
    window.addEventListener("proceda-demo-lead", onLead);
    return () => window.removeEventListener("proceda-demo-lead", onLead);
  }, []);

  useEffect(() => {
    const onEngaged = () => {
      bookingEngagedRef.current = true;
      setBookingEngaged(true);
    };
    window.addEventListener(BOOKING_ENGAGED_EVENT, onEngaged);
    return () => window.removeEventListener(BOOKING_ENGAGED_EVENT, onEngaged);
  }, []);

  const sendPing = useCallback(async () => {
    const path = pathname || "/";
    try {
      await fetch("/api/analytics/ping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visitorId: readVisitorId(),
          sessionId: readSessionId(),
          path,
          referrer:
            typeof document !== "undefined" ? document.referrer || null : null,
          bookingActive: bookingEngagedRef.current,
          leadName: demoLeadRef.current?.businessName ?? null,
          mailToken: demoLeadRef.current?.token ?? null,
        }),
        keepalive: true,
      });
    } catch {
      /* ignore */
    }
  }, [pathname]);

  useEffect(() => {
    if (SKIP_PREFIXES.some((p) => pathname.startsWith(p))) {
      return;
    }

    void sendPing();
    const id = window.setInterval(() => void sendPing(), HEARTBEAT_MS);
    return () => window.clearInterval(id);
  }, [pathname, sendPing, bookingEngaged, demoLead]);

  useEffect(() => {
    if (!bookingEngaged) return;
    void sendPing();
  }, [bookingEngaged, sendPing]);

  return null;
}
