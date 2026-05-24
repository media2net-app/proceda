import { composeOutreachDraft } from "./proceda-outreach-shared";
import { installatieOutreachBody } from "./branch-outreach-bodies";

/** Eerste outreach-mail voor installatie / technische dienst. */
export function buildInstallatieDemoProposalDraft(businessName: string): string {
  return composeOutreachDraft(businessName, installatieOutreachBody(businessName));
}

export function buildInstallatieMailSubject(businessName: string): string {
  return `Maatwerk portaal + AI — minder handwerk, meer omzet voor ${businessName}`;
}
