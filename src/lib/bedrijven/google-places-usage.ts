import fs from "fs/promises";
import path from "path";
import type { ScrapeRegionId } from "./regions";

/** Geschatte USD per request (Legacy Places API, incl. typische data-SKU's). */
export const GOOGLE_PLACES_PRICING_USD = {
  /** Nearby Search (Legacy) — zoeken op locatie/type */
  nearbySearch: Number(process.env.GOOGLE_PRICE_NEARBY_USD) || 0.04,
  /** Text Search (Legacy) — zoeken op query */
  textSearch: Number(process.env.GOOGLE_PRICE_TEXT_USD) || 0.04,
  /** Place Details — telefoon, website, adres, openingstijden */
  placeDetails: Number(process.env.GOOGLE_PRICE_DETAILS_USD) || 0.025,
};

export const GOOGLE_USD_TO_EUR = Number(process.env.GOOGLE_USD_TO_EUR) || 0.92;

const USAGE_PATH = path.join(process.cwd(), "data", "google-places-usage.json");

export type GooglePlacesCallType = "nearbySearch" | "textSearch" | "placeDetails";

export type ProvinceUsage = {
  nearbySearch: number;
  textSearch: number;
  placeDetails: number;
};

export type GooglePlacesUsageFile = {
  /** Live getelde API-calls sinds tracking */
  totals: ProvinceUsage;
  byProvince: Partial<Record<ScrapeRegionId, ProvinceUsage>>;
  /** Eenmalige schatting vóór tracking (uit verrijkte bedrijven) */
  estimatedBackfill: ProvinceUsage;
  backfillNote?: string;
  updatedAt: string;
};

export type GooglePlacesCostSummary = {
  currency: "EUR";
  /** Alleen live getrackte calls */
  tracked: {
    nearbySearch: number;
    textSearch: number;
    placeDetails: number;
    totalCalls: number;
    costEur: number;
    costUsd: number;
  };
  /** Inclusief backfill-schatting (totaal sinds begin scrapen) */
  estimated: {
    nearbySearch: number;
    textSearch: number;
    placeDetails: number;
    totalCalls: number;
    costEur: number;
    costUsd: number;
  };
  byProvince: {
    provinceId: ScrapeRegionId;
    tracked: ProvinceUsage;
    estimated: ProvinceUsage;
    costEur: number;
  }[];
  pricingUsdPerCall: typeof GOOGLE_PLACES_PRICING_USD;
  usdToEur: number;
  pricingNote: string;
  updatedAt: string;
};

function emptyUsage(): ProvinceUsage {
  return { nearbySearch: 0, textSearch: 0, placeDetails: 0 };
}

function addUsage(a: ProvinceUsage, b: ProvinceUsage): ProvinceUsage {
  return {
    nearbySearch: a.nearbySearch + b.nearbySearch,
    textSearch: a.textSearch + b.textSearch,
    placeDetails: a.placeDetails + b.placeDetails,
  };
}

function costUsd(usage: ProvinceUsage): number {
  return (
    usage.nearbySearch * GOOGLE_PLACES_PRICING_USD.nearbySearch +
    usage.textSearch * GOOGLE_PLACES_PRICING_USD.textSearch +
    usage.placeDetails * GOOGLE_PLACES_PRICING_USD.placeDetails
  );
}

export async function loadGooglePlacesUsage(): Promise<GooglePlacesUsageFile> {
  try {
    const raw = await fs.readFile(USAGE_PATH, "utf-8");
    return JSON.parse(raw) as GooglePlacesUsageFile;
  } catch {
    return {
      totals: emptyUsage(),
      byProvince: {},
      estimatedBackfill: emptyUsage(),
      updatedAt: new Date().toISOString(),
    };
  }
}

async function saveGooglePlacesUsage(data: GooglePlacesUsageFile): Promise<void> {
  data.updatedAt = new Date().toISOString();
  await fs.mkdir(path.dirname(USAGE_PATH), { recursive: true });
  await fs.writeFile(USAGE_PATH, JSON.stringify(data, null, 2), "utf-8");
}

/** Tel één Places API-request (elke pagina = 1 call). */
export async function recordGooglePlacesCall(
  type: GooglePlacesCallType,
  provinceId?: ScrapeRegionId,
  count = 1,
): Promise<void> {
  const data = await loadGooglePlacesUsage();
  data.totals[type] += count;
  if (provinceId) {
    const prov = data.byProvince[provinceId] ?? emptyUsage();
    prov[type] += count;
    data.byProvince[provinceId] = prov;
  }
  await saveGooglePlacesUsage(data);
}

/** Schat place-details voor al verrijkte bedrijven (vóór call-tracking). */
export async function ensureUsageBackfill(
  enrichedByProvince: Partial<Record<ScrapeRegionId, number>>,
): Promise<void> {
  const data = await loadGooglePlacesUsage();
  if (data.backfillNote) return;

  let backfill = emptyUsage();
  for (const count of Object.values(enrichedByProvince)) {
    if (count) backfill.placeDetails += count;
  }

  if (backfill.placeDetails === 0) return;

  data.estimatedBackfill = backfill;
  data.backfillNote =
    "Geschat: 1× Place Details per verrijkt bedrijf vóór live tracking.";
  await saveGooglePlacesUsage(data);
}

export function computeGooglePlacesCosts(
  usage: GooglePlacesUsageFile,
): GooglePlacesCostSummary {
  const tracked = usage.totals;
  const estimated = addUsage(tracked, usage.estimatedBackfill);

  const trackedUsd = costUsd(tracked);
  const estimatedUsd = costUsd(estimated);

  const byProvince = (Object.keys(usage.byProvince) as ScrapeRegionId[]).map(
    (provinceId) => {
      const t = usage.byProvince[provinceId] ?? emptyUsage();
      return {
        provinceId,
        tracked: t,
        estimated: t,
        costEur: costUsd(t) * GOOGLE_USD_TO_EUR,
      };
    },
  );

  return {
    currency: "EUR",
    tracked: {
      ...tracked,
      totalCalls:
        tracked.nearbySearch + tracked.textSearch + tracked.placeDetails,
      costUsd: trackedUsd,
      costEur: trackedUsd * GOOGLE_USD_TO_EUR,
    },
    estimated: {
      ...estimated,
      totalCalls:
        estimated.nearbySearch +
        estimated.textSearch +
        estimated.placeDetails,
      costUsd: estimatedUsd,
      costEur: estimatedUsd * GOOGLE_USD_TO_EUR,
    },
    byProvince,
    pricingUsdPerCall: GOOGLE_PLACES_PRICING_USD,
    usdToEur: GOOGLE_USD_TO_EUR,
    pricingNote:
      "Schatting o.b.v. Google Places API (Legacy) listprijzen. Werkelijke factuur kan afwijken (data-SKU's, gratis tegoed). Geen Google Cloud Billing API — we tellen onze requests.",
    updatedAt: usage.updatedAt,
  };
}

export async function getGooglePlacesCostSummary(): Promise<GooglePlacesCostSummary> {
  const usage = await loadGooglePlacesUsage();
  return computeGooglePlacesCosts(usage);
}
