import fs from "fs/promises";
import path from "path";
import { BRANCH_IDS } from "./branches";
import { findBusinessByIdFromDb, upsertBusiness } from "./business-db";
import { PROVINCE_IDS, type ProvinceId } from "./provinces";
import { loadBedrijvenCache } from "./scraper";
import type { Bedrijf } from "./types";

const DATA_ROOT = path.join(process.cwd(), "data", "bedrijven");

function cachePath(branchId: string, provinceId: ProvinceId) {
  return path.join(DATA_ROOT, branchId, `${provinceId}.json`);
}

/** Sla e-mail/telefoon op in database + branche/provincie-cache. */
export async function patchBusinessContact(
  businessId: string,
  patch: { email?: string; phone?: string },
): Promise<boolean> {
  let updated = false;

  const fromDb = await findBusinessByIdFromDb(businessId);
  if (fromDb) {
    const next: Bedrijf = { ...fromDb };
    if (patch.email?.trim() && !fromDb.email) {
      next.email = patch.email.trim();
      updated = true;
    }
    if (patch.phone?.trim() && !fromDb.phone) {
      next.phone = patch.phone.trim();
      updated = true;
    }
    if (updated) {
      await upsertBusiness(next);
    }
  }

  for (const branchId of BRANCH_IDS) {
    for (const provinceId of PROVINCE_IDS) {
      const cache = await loadBedrijvenCache(branchId, provinceId);
      if (!cache) continue;

      const idx = cache.businesses.findIndex((b) => b.id === businessId);
      if (idx < 0) continue;

      const b = cache.businesses[idx]!;
      const next: Bedrijf = { ...b };
      let cacheChanged = false;
      if (patch.email?.trim() && !b.email) {
        next.email = patch.email.trim();
        cacheChanged = true;
      }
      if (patch.phone?.trim() && !b.phone) {
        next.phone = patch.phone.trim();
        cacheChanged = true;
      }

      if (!cacheChanged) continue;

      cache.businesses[idx] = next;
      cache.count = cache.businesses.length;
      cache.scrapedAt = new Date().toISOString();
      await fs.writeFile(
        cachePath(branchId, provinceId),
        JSON.stringify(cache, null, 2),
        "utf-8",
      );
      updated = true;
      break;
    }
    if (updated) break;
  }

  return updated;
}
