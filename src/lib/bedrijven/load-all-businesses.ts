import { loadBusinessesFromDb, findBusinessByIdFromDb } from "./business-db";
import type { ScrapeBranchId } from "./branches";
import { OUTREACH_BRANCH_IDS } from "./outreach-branches";
import type { Bedrijf } from "./types";

export async function loadAllBusinesses(
  branchFilter?: ScrapeBranchId,
): Promise<Bedrijf[]> {
  return loadBusinessesFromDb(branchFilter);
}

/** Alle bedrijven in de NL outreach-pipeline (zonder lenjerii-hotel e.d.). */
export async function loadOutreachPipelineBusinesses(): Promise<Bedrijf[]> {
  const all = await loadBusinessesFromDb();
  const allowed = new Set<string>(OUTREACH_BRANCH_IDS);
  return all.filter((b) => allowed.has(b.branchId ?? ""));
}

export async function findBusinessById(
  businessId: string,
): Promise<Bedrijf | null> {
  return findBusinessByIdFromDb(businessId);
}
