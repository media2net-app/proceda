import { Suspense } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import AdminAnalyticsLiveView from "@/components/admin/analytics/AdminAnalyticsLiveView";

export default function AdminLiveViewPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={<p className="text-sm text-[#667085]">Laden…</p>}>
        <AdminAnalyticsLiveView />
      </Suspense>
    </DashboardLayout>
  );
}
