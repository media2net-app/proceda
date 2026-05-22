import { DemoBookingView } from "@/components/demo/DemoBookingView";

type PageProps = {
  params: Promise<{ token: string; locale: string }>;
};

export default async function DemoBookingPage({ params }: PageProps) {
  const { token } = await params;
  return <DemoBookingView token={token} />;
}
