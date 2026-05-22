import { prisma } from "@/lib/db/prisma";
import {
  dbDeepScrapeToResult,
  deepScrapeToDbCreate,
} from "@/lib/db/mappers";
import { ensureBusinessStub } from "./business-db";
import type { DeepScrapeResult } from "./deep-scrape-types";

export async function saveDeepScrape(data: DeepScrapeResult): Promise<void> {
  await ensureBusinessStub(data.businessId, {
    name: data.businessName,
    website: data.website,
  });
  const payload = deepScrapeToDbCreate(data);
  await prisma.deepScrape.upsert({
    where: { businessId: data.businessId },
    create: payload,
    update: {
      ...payload,
      businessId: undefined,
    },
  });
}

export async function loadDeepScrape(
  businessId: string,
): Promise<DeepScrapeResult | null> {
  const row = await prisma.deepScrape.findUnique({
    where: { businessId },
  });
  return row ? dbDeepScrapeToResult(row) : null;
}
