import MakelaarDashboardContent from "./MakelaarDashboardContent";
import RecruitmentDashboardContent from "./RecruitmentDashboardContent";
import { resolveDemoPortalKind } from "@/lib/demo-app/resolve-demo-portal-kind";

export async function DemoAppHomeRouter({ slug }: { slug: string }) {
  const kind = await resolveDemoPortalKind(slug);
  if (kind === "recruitment") return <RecruitmentDashboardContent />;
  return <MakelaarDashboardContent />;
}
