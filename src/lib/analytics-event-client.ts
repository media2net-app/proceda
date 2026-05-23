"use client";

const SESSION_KEY = "proceda_session_id";
const VISITOR_KEY = "proceda_visitor_id";

function readSessionId(): string | null {
  try {
    return sessionStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

function readVisitorId(): string | null {
  try {
    return localStorage.getItem(VISITOR_KEY);
  } catch {
    return null;
  }
}

export async function trackClientAnalyticsEvent(params: {
  eventName: string;
  mailToken?: string;
  businessId?: string;
  path?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await fetch("/api/analytics/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...params,
        sessionId: readSessionId(),
        visitorId: readVisitorId(),
        path: params.path ?? window.location.pathname,
      }),
      keepalive: true,
    });
  } catch {
    /* ignore */
  }
}
