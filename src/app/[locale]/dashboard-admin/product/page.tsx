import DashboardLayout from "@/components/DashboardLayout";
import { ProductOverviewView } from "@/components/admin/ProductOverviewView";

export default function ProductPage() {
  return (
    <DashboardLayout>
      <ProductOverviewView />
    </DashboardLayout>
  );
}
