"use client";

import dynamic from "next/dynamic";

const LiveAnalyticsTracker = dynamic(
  () => import("@/components/analytics/LiveAnalyticsTracker"),
  { ssr: false },
);

export default function LiveAnalyticsTrackerLoader() {
  return <LiveAnalyticsTracker />;
}
