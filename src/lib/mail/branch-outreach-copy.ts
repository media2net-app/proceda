import type { ScrapeBranchId } from "@/lib/bedrijven/branches";
import {
  accountantsFollowUpBody,
  accountantsOutreachBody,
  installatieFollowUpBody,
  installatieOutreachBody,
  makelaardijFollowUpBody,
  makelaardijOutreachBody,
  recruitmentFollowUpBody,
  recruitmentOutreachBody,
  vastgoedbeheerFollowUpBody,
  vastgoedbeheerOutreachBody,
  verzekeringFollowUpBody,
  verzekeringOutreachBody,
} from "./branch-outreach-bodies";
import {
  composeFollowUpDraft,
  composeOutreachDraft,
} from "./proceda-outreach-shared";
import {
  buildInstallatieSubjectAb,
  buildMakelaarSubjectAb,
  type OutreachSubjectAb,
} from "./subject-variants";
import { buildMailSubject } from "./templates";
import { buildInstallatieMailSubject } from "./installatie-outreach-draft";

export const OUTREACH_TEMPLATE_SAMPLE_NAME = "Voorbeeld Bedrijf BV";

/** Eerste outreach — platte tekst (wordt in HTML-mail gezet). */
export function buildBranchProposalDraft(
  branchId: ScrapeBranchId,
  businessName: string,
): string {
  switch (branchId) {
    case "installatie":
      return composeOutreachDraft(businessName, installatieOutreachBody(businessName));
    case "vastgoedbeheer":
      return composeOutreachDraft(
        businessName,
        vastgoedbeheerOutreachBody(businessName),
      );
    case "accountants":
      return composeOutreachDraft(businessName, accountantsOutreachBody(businessName));
    case "recruitment":
      return composeOutreachDraft(businessName, recruitmentOutreachBody(businessName));
    case "verzekering":
      return composeOutreachDraft(businessName, verzekeringOutreachBody(businessName));
    default:
      return composeOutreachDraft(businessName, makelaardijOutreachBody(businessName));
  }
}

export function buildBranchMailSubject(
  branchId: ScrapeBranchId,
  businessName: string,
  subjectAb?: OutreachSubjectAb,
): string {
  if (subjectAb) {
    if (branchId === "installatie") {
      return buildInstallatieSubjectAb(businessName, subjectAb);
    }
    if (branchId === "makelaardij") {
      return buildMakelaarSubjectAb(businessName, subjectAb);
    }
  }

  switch (branchId) {
    case "installatie":
      return buildInstallatieMailSubject(businessName);
    case "vastgoedbeheer":
      return `Beheerportaal + AI — 24/7 overzicht voor ${businessName}`;
    case "accountants":
      return `Klantportaal + AI — meer grip op dossiers voor ${businessName}`;
    case "recruitment":
      return `Recruitmentportaal + AI — sneller plaatsen voor ${businessName}`;
    case "verzekering":
      return `Adviesportaal + AI — slimmer werken voor ${businessName}`;
    default:
      return buildMailSubject(businessName, "initial");
  }
}

export function buildBranchFollowUpSubject(
  branchId: ScrapeBranchId,
  businessName: string,
): string {
  switch (branchId) {
    case "installatie":
      return `Demo-link geopend — 30 min live voor ${businessName}?`;
    case "vastgoedbeheer":
      return `Je opende onze link — 30 min demo voor ${businessName}?`;
    case "accountants":
      return `Je opende onze link — 30 min demo voor ${businessName}?`;
    case "recruitment":
      return `Je opende onze link — 30 min demo voor ${businessName}?`;
    case "verzekering":
      return `Je opende onze link — 30 min demo voor ${businessName}?`;
    default:
      return `Je opende onze demo-link — 30 min live voor ${businessName}?`;
  }
}

export function buildBranchFollowUpDraft(
  branchId: ScrapeBranchId,
  businessName: string,
): string {
  switch (branchId) {
    case "installatie":
      return composeFollowUpDraft(businessName, installatieFollowUpBody(businessName));
    case "vastgoedbeheer":
      return composeFollowUpDraft(
        businessName,
        vastgoedbeheerFollowUpBody(businessName),
      );
    case "accountants":
      return composeFollowUpDraft(businessName, accountantsFollowUpBody(businessName));
    case "recruitment":
      return composeFollowUpDraft(businessName, recruitmentFollowUpBody(businessName));
    case "verzekering":
      return composeFollowUpDraft(businessName, verzekeringFollowUpBody(businessName));
    default:
      return composeFollowUpDraft(businessName, makelaardijFollowUpBody(businessName));
  }
}

/** Metadata voor rapport / mail-builder per verticale. */
export function branchReportMeta(branchId: ScrapeBranchId): {
  primaryAppType: string;
  detectedServices: string[];
  servicesSummary: string;
  servicesOffered: string;
} {
  switch (branchId) {
    case "installatie":
      return {
        primaryAppType: "field-service-portal",
        detectedServices: ["installatie", "werkbonnen"],
        servicesSummary: "Installatie en werkbonnen",
        servicesOffered: "Installatie & techniek",
      };
    case "vastgoedbeheer":
      return {
        primaryAppType: "property-management-portal",
        detectedServices: ["vastgoedbeheer", "objecten"],
        servicesSummary: "Vastgoedbeheer en objecten",
        servicesOffered: "Vastgoedbeheer",
      };
    case "accountants":
      return {
        primaryAppType: "accounting-portal",
        detectedServices: ["accountancy", "dossiers"],
        servicesSummary: "Accountancy en dossiers",
        servicesOffered: "Accountancy & boekhouding",
      };
    case "recruitment":
      return {
        primaryAppType: "recruitment-portal",
        detectedServices: ["recruitment", "vacatures"],
        servicesSummary: "Recruitment en vacatures",
        servicesOffered: "Recruitment",
      };
    case "verzekering":
      return {
        primaryAppType: "insurance-portal",
        detectedServices: ["verzekeringen", "advies"],
        servicesSummary: "Verzekeringsadvies",
        servicesOffered: "Verzekeringsadvies",
      };
    default:
      return {
        primaryAppType: "crm-dashboard",
        detectedServices: ["makelaardij", "woningaanbod"],
        servicesSummary: "Makelaardij en woningaanbod",
        servicesOffered: "Makelaardij",
      };
  }
}
