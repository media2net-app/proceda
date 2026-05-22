import fs from "fs/promises";
import path from "path";
import { BRANCHES, BRANCH_IDS, type ScrapeBranchId } from "./branches";
import { getRegionConfig, isValidRegionId, type ScrapeRegionId } from "./regions";

/** Lijst regio's met data voor een branche (server-only). */
export async function listProvincesWithDataForBranch(
  branchId: ScrapeBranchId,
): Promise<{ id: ScrapeRegionId; name: string; count: number }[]> {
  const dir = path.join(process.cwd(), "data", "bedrijven", branchId);
  const out: { id: ScrapeRegionId; name: string; count: number }[] = [];
  const locale = branchId === "lenjerii-hotel" ? "ro" : "nl";
  try {
    const files = await fs.readdir(dir);
    for (const file of files) {
      if (!file.endsWith(".json") || file.includes("-progress") || file.startsWith("_")) continue;
      const id = file.replace(".json", "");
      if (!isValidRegionId(branchId, id)) continue;
      const raw = await fs.readFile(path.join(dir, file), "utf-8");
      const cache = JSON.parse(raw) as { count?: number; businesses?: unknown[] };
      const p = getRegionConfig(branchId, id);
      out.push({
        id,
        name: p?.name ?? id,
        count: cache.count ?? cache.businesses?.length ?? 0,
      });
    }
  } catch {
    // empty
  }
  return out.sort((a, b) => a.name.localeCompare(b.name, locale));
}

export async function listBranchesWithData(): Promise<
  { id: ScrapeBranchId; name: string; totalCount: number; provinces: number }[]
> {
  const result: {
    id: ScrapeBranchId;
    name: string;
    totalCount: number;
    provinces: number;
  }[] = [];

  for (const branchId of BRANCH_IDS) {
    const provinces = await listProvincesWithDataForBranch(branchId);
    const totalCount = provinces.reduce((s, p) => s + p.count, 0);
    result.push({
      id: branchId,
      name: BRANCHES[branchId].name,
      totalCount,
      provinces: provinces.length,
    });
  }
  return result;
}
