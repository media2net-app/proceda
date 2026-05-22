import type { ScrapeBranchId } from "./branches";
import {
  extractEmailFromWebsite,
  guessInfoEmailFromWebsite,
  normalizeEmail,
} from "./contact-utils";
import { findBusinessByIdFromDb, upsertBusiness } from "./business-db";
import { loadAllBusinesses } from "./load-all-businesses";
import { browseWebsiteForEmail } from "./page-browser";
import { patchBusinessContact } from "./patch-business-contact";
import type { Bedrijf } from "./types";

export type EmailEnrichSource =
  | "skipped"
  | "fetch"
  | "browser"
  | "guessed"
  | "none";

export type EmailEnrichRow = {
  businessId: string;
  name: string;
  website: string;
  previousEmail?: string;
  email?: string;
  source: EmailEnrichSource;
  error?: string;
};

export type EmailEnrichSummary = {
  branchId: ScrapeBranchId;
  scannedAt: string;
  total: number;
  withWebsite: number;
  alreadyHadEmail: number;
  attempted: number;
  found: number;
  failed: number;
  results: EmailEnrichRow[];
};

async function runPool<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;

  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]!, i);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => worker()),
  );
  return results;
}

export async function enrichEmailForBusiness(
  business: Bedrijf,
  options?: {
    useBrowser?: boolean;
    /** Alleen info@domein-proberen (geen scrape). */
    guessOnly?: boolean;
    /** Na scrape: info@domein als fallback (standaard aan). */
    allowDomainGuess?: boolean;
  },
): Promise<EmailEnrichRow> {
  const website = business.website?.trim();
  if (!website) {
    return {
      businessId: business.id,
      name: business.name,
      website: "",
      source: "skipped",
      error: "no_website",
    };
  }

  if (normalizeEmail(business.email)) {
    return {
      businessId: business.id,
      name: business.name,
      website,
      previousEmail: business.email,
      email: business.email,
      source: "skipped",
    };
  }

  const allowGuess = options?.allowDomainGuess !== false;

  try {
    if (options?.guessOnly) {
      const guessed = allowGuess ? guessInfoEmailFromWebsite(website) : undefined;
      const normalized = normalizeEmail(guessed);
      return {
        businessId: business.id,
        name: business.name,
        website,
        email: normalized,
        source: normalized ? "guessed" : "none",
      };
    }

    let email = await extractEmailFromWebsite(website);
    let source: EmailEnrichSource = email ? "fetch" : "none";

    if (!email && options?.useBrowser) {
      email = await browseWebsiteForEmail(website);
      if (email) source = "browser";
    }

    if (!email && allowGuess) {
      email = guessInfoEmailFromWebsite(website);
      if (email) source = "guessed";
    }

    const normalized = normalizeEmail(email);
    if (!normalized) {
      return {
        businessId: business.id,
        name: business.name,
        website,
        source: "none",
      };
    }

    return {
      businessId: business.id,
      name: business.name,
      website,
      email: normalized,
      source,
    };
  } catch (e) {
    return {
      businessId: business.id,
      name: business.name,
      website,
      source: "none",
      error: e instanceof Error ? e.message : "unknown",
    };
  }
}

export async function applyEmailEnrichRow(row: EmailEnrichRow): Promise<boolean> {
  if (!row.email) return false;

  const existing = await findBusinessByIdFromDb(row.businessId);
  if (!existing) return false;

  const next: Bedrijf = {
    ...existing,
    email: row.email,
    website: row.website || existing.website,
  };

  await upsertBusiness(next);
  await patchBusinessContact(row.businessId, { email: row.email });
  return true;
}

export async function enrichBranchEmailsFromWebsites(
  branchId: ScrapeBranchId,
  options?: {
    limit?: number;
    concurrency?: number;
    useBrowser?: boolean;
    guessOnly?: boolean;
    allowDomainGuess?: boolean;
    dryRun?: boolean;
    onProgress?: (done: number, total: number, name: string) => void;
  },
): Promise<EmailEnrichSummary> {
  const all = await loadAllBusinesses(branchId);
  const withWebsite = all.filter((b) => b.website?.trim());
  const targets = withWebsite
    .filter((b) => !normalizeEmail(b.email))
    .slice(0, options?.limit ?? withWebsite.length);

  const concurrency = options?.concurrency ?? 8;

  const results = await runPool(targets, concurrency, async (b, i) => {
    const row = await enrichEmailForBusiness(b, {
      useBrowser: options?.useBrowser,
      guessOnly: options?.guessOnly,
      allowDomainGuess: options?.allowDomainGuess,
    });
    options?.onProgress?.(i + 1, targets.length, b.name);
    if (!options?.dryRun && row.email) {
      await applyEmailEnrichRow(row);
    }
    return row;
  });

  const found = results.filter((r) => r.email && r.source !== "skipped").length;
  const alreadyHadEmail = all.filter((b) => normalizeEmail(b.email)).length;

  return {
    branchId,
    scannedAt: new Date().toISOString(),
    total: all.length,
    withWebsite: withWebsite.length,
    alreadyHadEmail,
    attempted: results.length,
    found,
    failed: results.filter((r) => r.source === "none").length,
    results,
  };
}
