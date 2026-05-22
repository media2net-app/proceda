import { loadBusinessesFromDb, findBusinessByIdFromDb } from "./business-db";
import type { ScrapeBranchId } from "./branches";
import type { Bedrijf } from "./types";

export async function loadAllBusinesses(
  branchFilter?: ScrapeBranchId,
): Promise<Bedrijf[]> {
  return loadBusinessesFromDb(branchFilter);
}

export async function findBusinessById(
  businessId: string,
): Promise<Bedrijf | null> {
  return findBusinessByIdFromDb(businessId);
}
