import DashboardLayout from "@/components/DashboardLayout";
import { AdminKpiDashboard } from "@/components/admin/AdminKpiDashboard";

export default function DashboardAdminPage() {
  return (
    <DashboardLayout>
      <AdminKpiDashboard />
    </DashboardLayout>
  );
}
