/** A/B onderwerpregels voor eerste outreach-mail. */
export type OutreachSubjectAb = "a" | "b";

export function pickSubjectVariant(index: number): OutreachSubjectAb {
  return index % 2 === 0 ? "a" : "b";
}

export function buildMakelaarSubjectAb(
  businessName: string,
  variant: OutreachSubjectAb,
): string {
  if (variant === "b") {
    return `AI + maatwerk platform voor ${businessName} — 30 min demo`;
  }
  return `Maatwerk webapp + AI-automatisering — ${businessName}`;
}

export function buildInstallatieSubjectAb(
  businessName: string,
  variant: OutreachSubjectAb,
): string {
  if (variant === "b") {
    return `Minder handwerk, meer opdrachten — demo voor ${businessName}`;
  }
  return `Maatwerk portaal + AI — minder handwerk voor ${businessName}`;
}

export function subjectVariantLabel(variant: OutreachSubjectAb): string {
  return variant === "b" ? "B" : "A";
}
