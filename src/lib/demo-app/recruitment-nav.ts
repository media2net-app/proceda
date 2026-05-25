export type RecruitmentNavId =
  | "dashboard"
  | "kandidaten"
  | "vacatures"
  | "matching"
  | "opvolging";

export type RecruitmentNavItem = {
  id: RecruitmentNavId;
  label: string;
  segment: string;
};

export const RECRUITMENT_APP_NAV: RecruitmentNavItem[] = [
  { id: "dashboard", label: "Dashboard", segment: "" },
  { id: "kandidaten", label: "Kandidaten", segment: "kandidaten" },
  { id: "vacatures", label: "Vacatures & opdrachten", segment: "vacatures" },
  { id: "matching", label: "AI matching", segment: "matching" },
  { id: "opvolging", label: "Opvolging 48u", segment: "opvolging" },
];

export function recruitmentAppHref(slug: string, segment?: string): string {
  const base = `/demos/${slug}/app`;
  return segment ? `${base}/${segment}` : base;
}

export function recruitmentDetailHref(
  slug: string,
  segment: "kandidaten" | "vacatures" | "matching" | "opvolging",
  id: string,
): string {
  return `${recruitmentAppHref(slug, segment)}/${id}`;
}

export function recruitmentNavActive(
  pathname: string,
  slug: string,
  segment: string,
): boolean {
  const base = `/demos/${slug}/app`;
  if (!segment) {
    return pathname === base || pathname === `${base}/`;
  }
  return (
    pathname === `${base}/${segment}` ||
    pathname.startsWith(`${base}/${segment}/`)
  );
}
