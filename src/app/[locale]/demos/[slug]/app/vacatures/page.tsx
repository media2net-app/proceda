import { RecruitmentPageRouter } from "@/components/demo-app/RecruitmentPageRouter";

type PageProps = { params: Promise<{ slug: string }> };

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  return <RecruitmentPageRouter slug={slug} segment="vacatures" />;
}
