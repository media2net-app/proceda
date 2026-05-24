import type { ScrapeBranchId } from "@/lib/bedrijven/branches";
import { DEFAULT_BRANCH } from "@/lib/bedrijven/branches";
import {
  buildBranchFollowUpDraft,
  buildBranchFollowUpSubject,
  buildBranchMailSubject,
  buildBranchProposalDraft,
} from "./branch-outreach-copy";
import type { MailTemplateVariant } from "./templates";
import type { OutreachSubjectAb } from "./subject-variants";

export function buildOutreachProposalDraft(
  branchId: ScrapeBranchId,
  businessName: string,
): string {
  return buildBranchProposalDraft(branchId, businessName);
}

export function buildOutreachMailSubject(
  branchId: ScrapeBranchId,
  businessName: string,
  variant: MailTemplateVariant = "initial",
  subjectAb?: OutreachSubjectAb,
): string {
  if (variant === "followup") {
    return buildBranchFollowUpSubject(branchId, businessName);
  }
  return buildBranchMailSubject(branchId, businessName, subjectAb);
}

export function buildOutreachFollowUpDraft(
  branchId: ScrapeBranchId,
  businessName: string,
): string {
  return buildBranchFollowUpDraft(branchId, businessName);
}

export function defaultOutreachSubcategory(
  branchId: ScrapeBranchId,
): string {
  if (branchId === "installatie") return "technical_services";
  if (branchId === "vastgoedbeheer") return "property_management";
  if (branchId === "accountants") return "accounting";
  if (branchId === "recruitment") return "recruitment";
  if (branchId === "verzekering") return "insurance";
  return "real_estate_agency";
}

export { DEFAULT_BRANCH };
