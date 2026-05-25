import { DemoAppHomeRouter } from "@/components/demo-app/DemoAppHomeRouter";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function DemoAppDashboardPage({ params }: PageProps) {
  const { slug } = await params;
  return <DemoAppHomeRouter slug={slug} />;
}
