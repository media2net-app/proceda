import { RecruitmentMatchDetailPage } from "@/components/demo-app/RecruitmentDetailPages";

type PageProps = { params: Promise<{ id: string }> };

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <RecruitmentMatchDetailPage id={id} />;
}
