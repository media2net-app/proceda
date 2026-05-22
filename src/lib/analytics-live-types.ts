export type LiveVisitorMarker = {
  sessionId: string;
  lat: number;
  lng: number;
  city: string | null;
  countryCode: string | null;
  path: string;
  funnelLabel: string | null;
  bookingActive: boolean;
  lastSeenAt: string;
};

export type AnalyticsPeriod = "today" | "7d" | "30d" | "all";

export type AnalyticsLiveSnapshot = {
  generatedAt: string;
  period: AnalyticsPeriod;
  periodLabel: string;
  visitorsNow: number;
  bookingNow: number;
  sessions: number;
  pageViews: number;
  bookings: number;
  conversionRate: number | null;
  visitors: LiveVisitorMarker[];
  topPages: { path: string; views: number }[];
  topFunnels: { label: string; views: number }[];
  pageViewsLast10Min: { minute: string; views: number }[];
  activeVisitors: Array<{
    sessionId: string;
    path: string;
    funnelLabel: string | null;
    bookingActive: boolean;
    city: string | null;
    countryCode: string | null;
    lastSeenAt: string;
  }>;
};
