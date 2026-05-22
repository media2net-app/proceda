import fs from "fs/promises";
import path from "path";
import { BRANCH_IDS } from "./branches";
import { PROVINCE_IDS, type ProvinceId } from "./provinces";
import { loadBedrijvenCache } from "./scraper";
import type { Bedrijf } from "./types";

const DATA_ROOT = path.join(process.cwd(), "data", "bedrijven");

function cachePath(branchId: string, provinceId: ProvinceId) {
  return path.join(DATA_ROOT, branchId, `${provinceId}.json`);
}

/** Sla e-mail/telefoon op in branche/provincie-cache na website-scan. */
export async function patchBusinessContact(
  businessId: string,
  patch: { email?: string; phone?: string },
): Promise<boolean> {
  let updated = false;

  for (const branchId of BRANCH_IDS) {
    for (const provinceId of PROVINCE_IDS) {
      const cache = await loadBedrijvenCache(branchId, provinceId);
      if (!cache) continue;

      const idx = cache.businesses.findIndex((b) => b.id === businessId);
      if (idx < 0) continue;

      const b = cache.businesses[idx]!;
      const next: Bedrijf = { ...b };
      if (patch.email && !b.email) {
        next.email = patch.email;
        updated = true;
      }
      if (patch.phone && !b.phone) {
        next.phone = patch.phone;
        updated = true;
      }

      if (next.email === b.email && next.phone === b.phone) continue;

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
