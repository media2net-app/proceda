import type { ScrapeBranchId } from "./branches";
import {
  DEFAULT_PROVINCE,
  PROVINCE_IDS,
  PROVINCES,
  type ProvinceConfig,
  type ProvinceId,
} from "./provinces";
import {
  ROMANIA_COUNTIES,
  ROMANIA_COUNTY_IDS,
  type RomaniaCountyId,
} from "./romania-counties";

export type ScrapeRegionId = ProvinceId | RomaniaCountyId;

export const DEFAULT_ROMANIA_COUNTY: RomaniaCountyId = "ro-cluj";

export function getRegionIdsForBranch(
  branchId: ScrapeBranchId,
): readonly ScrapeRegionId[] {
  if (branchId === "lenjerii-hotel") return ROMANIA_COUNTY_IDS;
  return PROVINCE_IDS;
}

export function isValidRegionId(
  branchId: ScrapeBranchId,
  id: string,
): id is ScrapeRegionId {
  if (branchId === "lenjerii-hotel") {
    return ROMANIA_COUNTY_IDS.includes(id as RomaniaCountyId);
  }
  return PROVINCE_IDS.includes(id as ProvinceId);
}

export function resolveRegionId(
  branchId: ScrapeBranchId,
  value: string | null,
): ScrapeRegionId {
  if (value && isValidRegionId(branchId, value)) return value;
  return branchId === "lenjerii-hotel"
    ? DEFAULT_ROMANIA_COUNTY
    : DEFAULT_PROVINCE;
}

export function getRegionConfig(
  branchId: ScrapeBranchId,
  regionId: ScrapeRegionId,
): (ProvinceConfig & { country?: "nl" | "ro" }) | undefined {
  if (branchId === "lenjerii-hotel") {
    return ROMANIA_COUNTIES[regionId as RomaniaCountyId];
  }
  const p = PROVINCES[regionId as ProvinceId];
  return p ? { ...p, country: "nl" } : undefined;
}

/** Rasterpunten binnen regio-bbox (voor nearby op type). */
export function buildSearchGrid(
  region: ProvinceConfig,
): { lat: number; lon: number }[] {
  if (region.searchGrid.length > 0) return region.searchGrid;

  const { minLat, maxLat, minLon, maxLon } = region.bbox;
  const lats = [minLat, (minLat + maxLat) / 2, maxLat];
  const lons = [minLon, (minLon + maxLon) / 2, maxLon];
  const points: { lat: number; lon: number }[] = [];
  for (const lat of lats) {
    for (const lon of lons) {
      points.push({ lat, lon });
    }
  }
  return points;
}
