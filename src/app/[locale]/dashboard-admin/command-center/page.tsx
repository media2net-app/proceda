import DashboardLayout from "@/components/DashboardLayout";
import { AdminCommandCenter } from "@/components/admin/AdminCommandCenter";

export default function CommandCenterPage() {
  return (
    <DashboardLayout>
      <AdminCommandCenter />
    </DashboardLayout>
  );
}
