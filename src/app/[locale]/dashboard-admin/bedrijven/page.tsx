import DashboardLayout from "@/components/DashboardLayout";
import { BusinessesView } from "@/components/admin/BusinessesView";

export default function BedrijvenAdminPage() {
  return (
    <DashboardLayout>
      <BusinessesView />
    </DashboardLayout>
  );
}
