import DashboardLayout from "@/components/DashboardLayout";
import { RapportageDetailView } from "@/components/admin/RapportageDetailView";

type Props = { params: Promise<{ slug: string }> };

export default async function RapportageDetailPage({ params }: Props) {
  const { slug } = await params;
  return (
    <DashboardLayout>
      <RapportageDetailView slug={slug} />
    </DashboardLayout>
  );
}
