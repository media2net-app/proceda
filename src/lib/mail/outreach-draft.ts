import type { ScrapeBranchId } from "@/lib/bedrijven/branches";
import { DEFAULT_BRANCH } from "@/lib/bedrijven/branches";
import { buildMakelaarDemoProposalDraft } from "./demo-outreach-draft";
import {
  buildInstallatieDemoProposalDraft,
  buildInstallatieMailSubject,
} from "./installatie-outreach-draft";
import { buildMailSubject, type MailTemplateVariant } from "./templates";

export function buildOutreachProposalDraft(
  branchId: ScrapeBranchId,
  businessName: string,
): string {
  if (branchId === "installatie") {
    return buildInstallatieDemoProposalDraft(businessName);
  }
  return buildMakelaarDemoProposalDraft(businessName);
}

export function buildOutreachMailSubject(
  branchId: ScrapeBranchId,
  businessName: string,
  variant: MailTemplateVariant = "initial",
): string {
  if (variant === "followup") {
    return buildMailSubject(businessName, "followup");
  }
  if (branchId === "installatie") {
    return buildInstallatieMailSubject(businessName);
  }
  return buildMailSubject(businessName, "initial");
}

export function defaultOutreachSubcategory(
  branchId: ScrapeBranchId,
): string {
  if (branchId === "installatie") return "technical_services";
  return "real_estate_agency";
}

export { DEFAULT_BRANCH };
