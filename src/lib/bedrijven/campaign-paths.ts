import fs from "fs/promises";
import path from "path";
import type { ScrapeBranchId } from "./branches";
import { DEFAULT_BRANCH } from "./branches";

/** Paden per verticale — gescheiden mail/huisstijl/demo-batch. */
export function getCampaignDir(branchId: ScrapeBranchId): string {
  return path.join(process.cwd(), "data", "campaigns", branchId);
}

export function getDemoReadyAuditPath(
  branchId: ScrapeBranchId = DEFAULT_BRANCH,
): string {
  return path.join(getCampaignDir(branchId), "demo-ready-audit.json");
}

export function getDemoBrandsPath(
  branchId: ScrapeBranchId = DEFAULT_BRANCH,
): string {
  return path.join(getCampaignDir(branchId), "demo-brands.json");
}

/** Oude makelaardij-locatie (backward compatible). */
export const LEGACY_DEMO_READY_AUDIT_PATH = path.join(
  process.cwd(),
  "data",
  "demo-ready-audit.json",
);

export const LEGACY_DEMO_BRANDS_PATH = path.join(
  process.cwd(),
  "data",
  "demo-brands.json",
);

/** Zorg dat data/campaigns/{branch}/ bestaat. */
export async function ensureCampaignDir(
  branchId: ScrapeBranchId,
): Promise<string> {
  const dir = getCampaignDir(branchId);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

/** Migreer legacy bestanden naar campaigns/makelaardij indien nodig. */
export async function ensureLegacyCampaignMigrated(
  branchId: ScrapeBranchId = DEFAULT_BRANCH,
): Promise<void> {
  if (branchId !== DEFAULT_BRANCH) return;
  await ensureCampaignDir(branchId);
  const targetAudit = getDemoReadyAuditPath(branchId);
  const targetBrands = getDemoBrandsPath(branchId);

  try {
    await fs.access(targetAudit);
  } catch {
    try {
      await fs.copyFile(LEGACY_DEMO_READY_AUDIT_PATH, targetAudit);
    } catch {
      /* geen legacy */
    }
  }

  try {
    await fs.access(targetBrands);
  } catch {
    try {
      await fs.copyFile(LEGACY_DEMO_BRANDS_PATH, targetBrands);
    } catch {
      /* geen legacy */
    }
  }
}
