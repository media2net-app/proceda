import { DEFAULT_BRANCH, type ScrapeBranchId } from "./branches";
import { upsertBusiness } from "./business-db";
import type { ProvinceId } from "./provinces";
import type { Bedrijf } from "./types";

export async function upsertBusinessInProvince(
  business: Bedrijf,
  provinceId: ProvinceId = "drenthe",
  branchId: ScrapeBranchId = DEFAULT_BRANCH,
): Promise<void> {
  await upsertBusiness({
    ...business,
    branchId,
    provinceId,
  });
}
