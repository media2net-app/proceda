import { resolveDemoPortalKind } from "@/lib/demo-app/resolve-demo-portal-kind";
import {
  RecruitmentCandidatesPage,
  RecruitmentFollowUpPage,
  RecruitmentMatchingPage,
  RecruitmentVacanciesPage,
} from "./RecruitmentListPages";

type Segment = "kandidaten" | "vacatures" | "matching" | "opvolging";

export async function RecruitmentPageRouter({
  slug,
  segment,
}: {
  slug: string;
  segment: Segment;
}) {
  const kind = await resolveDemoPortalKind(slug);
  if (kind !== "recruitment") {
    return (
      <p className="text-sm text-[#667085]">
        Deze pagina hoort bij het recruitmentportaal.
      </p>
    );
  }

  switch (segment) {
    case "kandidaten":
      return <RecruitmentCandidatesPage />;
    case "vacatures":
      return <RecruitmentVacanciesPage />;
    case "matching":
      return <RecruitmentMatchingPage />;
    case "opvolging":
      return <RecruitmentFollowUpPage />;
  }
}
