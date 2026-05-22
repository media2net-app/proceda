import { prisma } from "@/lib/db/prisma";
import { bedrijfToBusinessCreate, businessToBedrijf } from "@/lib/db/mappers";
import type { Bedrijf, BedrijvenCache } from "./types";
import type { ScrapeBranchId } from "./branches";
import type { ScrapeRegionId } from "./regions";
import { PROVINCES, type ProvinceId } from "./provinces";

export async function upsertBusiness(business: Bedrijf): Promise<void> {
  const data = bedrijfToBusinessCreate(business);
  await prisma.business.upsert({
    where: { id: business.id },
    create: data,
    update: {
      placeId: data.placeId,
      name: data.name,
      category: data.category,
      subcategory: data.subcategory,
      address: data.address,
      city: data.city,
      province: data.province,
      provinceId: data.provinceId,
      branchId: data.branchId,
      phone: data.phone,
      email: data.email,
      website: data.website,
      openingHours: data.openingHours,
      lat: data.lat,
      lon: data.lon,
      scrapedAt: new Date(),
    },
  });
}

export async function upsertBusinessesBatch(businesses: Bedrijf[]): Promise<void> {
  for (const b of businesses) {
    await upsertBusiness(b);
  }
}

export async function ensureBusinessStub(
  businessId: string,
  opts?: { name?: string; email?: string; website?: string },
): Promise<void> {
  await prisma.business.upsert({
    where: { id: businessId },
    create: {
      id: businessId,
      placeId: businessId,
      name: opts?.name ?? businessId,
      category: "services",
      subcategory: "real_estate_agency",
      email: opts?.email ?? null,
      website: opts?.website ?? null,
    },
    update: {
      name: opts?.name,
      email: opts?.email ?? undefined,
      website: opts?.website ?? undefined,
    },
  });
}

export async function loadBusinessesFromDb(
  branchFilter?: ScrapeBranchId,
): Promise<Bedrijf[]> {
  const rows = await prisma.business.findMany({
    where: branchFilter ? { branchId: branchFilter } : undefined,
    orderBy: { name: "asc" },
  });
  const locale = branchFilter === "lenjerii-hotel" ? "ro" : "nl";
  return rows
    .map(businessToBedrijf)
    .sort((a, b) => a.name.localeCompare(b.name, locale));
}

export async function findBusinessByIdFromDb(
  businessId: string,
): Promise<Bedrijf | null> {
  const decoded = decodeURIComponent(businessId);
  const row = await prisma.business.findUnique({
    where: { id: decoded },
  });
  return row ? businessToBedrijf(row) : null;
}

export async function loadBedrijvenCacheFromDb(
  branchId: ScrapeBranchId,
  regionId: ScrapeRegionId,
): Promise<BedrijvenCache | null> {
  const rows = await prisma.business.findMany({
    where: { branchId, provinceId: regionId },
    orderBy: { name: "asc" },
  });
  if (rows.length === 0) return null;

  const provinceName =
    PROVINCES[regionId as ProvinceId]?.name ?? regionId;

  return {
    branch: branchId,
    province: regionId,
    provinceName,
    scrapedAt: rows[0]?.scrapedAt.toISOString() ?? new Date().toISOString(),
    count: rows.length,
    dataSource: "google",
    businesses: rows.map(businessToBedrijf),
  };
}

export async function saveBedrijvenCacheToDb(cache: BedrijvenCache): Promise<void> {
  await upsertBusinessesBatch(
    cache.businesses.map((b) => ({
      ...b,
      branchId: cache.branch,
      provinceId: cache.province,
    })),
  );
}
