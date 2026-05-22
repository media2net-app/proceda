import {
  classifyLenjeriiSegment,
  placeMatchesBranch,
  type ScrapeBranchId,
  type ScrapeRegionConfig,
} from "./branches";
import {
  extractEmailFromWebsite,
  normalizeEmail,
  normalizePhone,
} from "./contact-utils";
import type { ScrapeRegionId } from "./regions";
import { recordGooglePlacesCall } from "./google-places-usage";
import type {
  Bedrijf,
  BedrijfCategory,
  DiscoveryCursor,
  QueuedPlace,
} from "./types";

const NEARBY_TYPES = [
  "restaurant",
  "cafe",
  "bar",
  "bakery",
  "meal_takeaway",
  "store",
  "supermarket",
  "convenience_store",
  "clothing_store",
  "hardware_store",
  "electronics_store",
  "furniture_store",
  "pharmacy",
  "drugstore",
  "bank",
  "atm",
  "gas_station",
  "car_repair",
  "car_wash",
  "hospital",
  "doctor",
  "dentist",
  "veterinary_care",
  "school",
  "primary_school",
  "secondary_school",
  "lawyer",
  "accounting",
  "insurance_agency",
  "real_estate_agency",
  "beauty_salon",
  "hair_care",
  "laundry",
  "gym",
  "post_office",
  "travel_agency",
  "florist",
  "book_store",
  "shoe_store",
  "jewelry_store",
  "pet_store",
  "locksmith",
  "electrician",
  "plumber",
  "general_contractor",
];

export type GooglePlaceResult = QueuedPlace & {
  business_status?: string;
};

type GooglePlacesResponse = {
  status: string;
  results?: GooglePlaceResult[];
  next_page_token?: string;
  error_message?: string;
};

type GoogleDetailsResponse = {
  status: string;
  result?: {
    formatted_phone_number?: string;
    website?: string;
    opening_hours?: { weekday_text?: string[] };
    formatted_address?: string;
  };
  error_message?: string;
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

let activeProvinceId: ScrapeRegionId | undefined;

export function setGooglePlacesProvince(regionId: ScrapeRegionId | undefined) {
  activeProvinceId = regionId;
}

function callTypeFromUrl(url: string): "nearbySearch" | "textSearch" {
  return url.includes("textsearch") ? "textSearch" : "nearbySearch";
}

function isInProvinceBBox(
  place: GooglePlaceResult,
  bbox: ScrapeRegionConfig["bbox"],
): boolean {
  const lat = place.geometry?.location.lat;
  const lon = place.geometry?.location.lng;
  if (lat == null || lon == null) return false;
  return (
    lat >= bbox.minLat &&
    lat <= bbox.maxLat &&
    lon >= bbox.minLon &&
    lon <= bbox.maxLon
  );
}

function extractCity(address: string, country: "nl" | "ro" = "nl"): string {
  const parts = address.split(",").map((p) => p.trim());
  if (parts.length >= 2) {
    const candidate = parts[parts.length - 2];
    if (
      candidate &&
      !/^\d{4}\s?[A-Z]{2}$/i.test(candidate) &&
      !/^\d{6}$/.test(candidate)
    ) {
      return candidate;
    }
  }
  if (parts.length >= 1 && country === "ro") {
    const last = parts[parts.length - 1];
    if (last && !/românia|romania/i.test(last)) return parts[0] ?? last;
  }
  return parts[0] ?? (country === "ro" ? "România" : "Nederland");
}

function mapGoogleType(types: string[] = []): {
  category: BedrijfCategory;
  subcategory: string;
} {
  const t = types.join(" ").toLowerCase();
  if (
    t.includes("restaurant") ||
    t.includes("cafe") ||
    t.includes("bar") ||
    t.includes("food") ||
    t.includes("meal")
  )
    return { category: "horeca", subcategory: types[0] ?? "horeca" };
  if (
    t.includes("store") ||
    t.includes("supermarket") ||
    t.includes("shopping") ||
    t.includes("bakery") ||
    t.includes("florist")
  )
    return { category: "retail", subcategory: types[0] ?? "retail" };
  if (
    t.includes("pharmacy") ||
    t.includes("hospital") ||
    t.includes("doctor") ||
    t.includes("dentist") ||
    t.includes("health") ||
    t.includes("veterinary")
  )
    return { category: "health", subcategory: types[0] ?? "health" };
  if (t.includes("gas_station") || t.includes("car_"))
    return { category: "auto", subcategory: types[0] ?? "auto" };
  if (t.includes("school") || t.includes("university"))
    return { category: "education", subcategory: types[0] ?? "education" };
  if (
    t.includes("lawyer") ||
    t.includes("accounting") ||
    t.includes("insurance") ||
    t.includes("real_estate") ||
    t.includes("local_government")
  )
    return { category: "office", subcategory: types[0] ?? "office" };
  if (
    t.includes("beauty") ||
    t.includes("hair") ||
    t.includes("spa") ||
    t.includes("laundry") ||
    t.includes("gym") ||
    t.includes("travel")
  )
    return { category: "services", subcategory: types[0] ?? "services" };
  return { category: "other", subcategory: types[0] ?? "establishment" };
}

async function placesRequest(
  url: string,
  pageToken?: string,
): Promise<GooglePlacesResponse> {
  const full = new URL(url);
  if (pageToken) full.searchParams.set("pagetoken", pageToken);
  const res = await fetch(full.toString(), {
    signal: AbortSignal.timeout(45000),
  });
  const data = (await res.json()) as GooglePlacesResponse;
  if (data.status === "OK" || data.status === "ZERO_RESULTS") {
    await recordGooglePlacesCall(callTypeFromUrl(url), activeProvinceId);
  }
  return data;
}

async function paginateAll(
  fetchPage: (pageToken?: string) => Promise<GooglePlacesResponse>,
): Promise<GooglePlaceResult[]> {
  const results: GooglePlaceResult[] = [];
  let pageToken: string | undefined;
  let pages = 0;

  do {
    if (pageToken) await sleep(2200);
    const data = await fetchPage(pageToken);

    if (data.status === "REQUEST_DENIED") {
      throw new Error(data.error_message ?? "Google Places API denied");
    }
    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      if (data.status === "OVER_QUERY_LIMIT") {
        await sleep(3000);
        continue;
      }
      throw new Error(data.error_message ?? `Google Places: ${data.status}`);
    }

    results.push(...(data.results ?? []));
    pageToken = data.next_page_token;
    pages++;
  } while (pageToken && pages < 3);

  return results;
}

function nearbyUrl(
  apiKey: string,
  province: ScrapeRegionConfig,
  lat: number,
  lon: number,
  type?: string,
): string {
  const params = new URLSearchParams({
    location: `${lat},${lon}`,
    radius: String(province.nearbyRadius),
    key: apiKey,
    language: province.language,
    region: province.regionCode,
  });
  if (type) params.set("type", type);
  return `https://maps.googleapis.com/maps/api/place/nearbysearch/json?${params}`;
}

function textSearchUrl(
  apiKey: string,
  province: ScrapeRegionConfig,
  query: string,
): string {
  const params = new URLSearchParams({
    query,
    location: `${province.center.lat},${province.center.lon}`,
    radius: String(province.maxDistanceMeters),
    key: apiKey,
    language: province.language,
    region: province.regionCode,
  });
  return `https://maps.googleapis.com/maps/api/place/textsearch/json?${params}`;
}

export type ScrapeProvinceConfig = ScrapeRegionConfig;

function filterNewPlaces(
  places: GooglePlaceResult[],
  province: ScrapeProvinceConfig,
  knownIds: Set<string>,
  branchId: ScrapeBranchId,
): QueuedPlace[] {
  const added: QueuedPlace[] = [];
  for (const place of places) {
    if (place.business_status === "CLOSED_PERMANENTLY") continue;
    if (!place.name?.trim()) continue;
    if (!isInProvinceBBox(place, province.bbox)) continue;
    if (!placeMatchesBranch(branchId, place)) continue;
    if (province.focusCity) {
      const loc = `${place.vicinity ?? ""} ${place.formatted_address ?? ""}`.toLowerCase();
      if (!loc.includes(province.focusCity.toLowerCase())) continue;
    }
    if (knownIds.has(place.place_id)) continue;
    knownIds.add(place.place_id);
    added.push({
      place_id: place.place_id,
      name: place.name,
      vicinity: place.vicinity,
      formatted_address: place.formatted_address,
      geometry: place.geometry,
      types: place.types,
    });
  }
  return added;
}

/** One resumable discovery step (grid point, type, or text query). */
export async function runDiscoveryStep(
  apiKey: string,
  province: ScrapeProvinceConfig,
  cursor: DiscoveryCursor,
  knownIds: Set<string>,
  branchId: ScrapeBranchId,
): Promise<{ added: QueuedPlace[]; cursor: DiscoveryCursor; complete: boolean }> {
  const nearbyTypes = province.nearbyTypes;

  if (cursor.phase === "grid") {
    if (cursor.gridIndex >= province.searchGrid.length) {
      return {
        added: [],
        cursor: { ...cursor, phase: "types", typeIndex: 0 },
        complete: false,
      };
    }
    const point = province.searchGrid[cursor.gridIndex];
    const gridType = nearbyTypes[0];
    const batch = await paginateAll((token) =>
      placesRequest(
        nearbyUrl(apiKey, province, point.lat, point.lon, gridType),
        token,
      ),
    );
    const added = filterNewPlaces(batch, province, knownIds, branchId);
    const nextIndex = cursor.gridIndex + 1;
    const complete = nextIndex >= province.searchGrid.length;
    return {
      added,
      cursor: complete
        ? { phase: "types", gridIndex: nextIndex, typeIndex: 0, queryIndex: 0 }
        : { ...cursor, gridIndex: nextIndex },
      complete: false,
    };
  }

  if (cursor.phase === "types") {
    if (cursor.typeIndex >= nearbyTypes.length) {
      return {
        added: [],
        cursor: { ...cursor, phase: "text", queryIndex: 0 },
        complete: false,
      };
    }
    const type = nearbyTypes[cursor.typeIndex];
    const batch = await paginateAll((token) =>
      placesRequest(
        nearbyUrl(apiKey, province, province.center.lat, province.center.lon, type),
        token,
      ),
    );
    const added = filterNewPlaces(batch, province, knownIds, branchId);
    const nextIndex = cursor.typeIndex + 1;
    const complete = nextIndex >= nearbyTypes.length;
    return {
      added,
      cursor: complete
        ? { phase: "text", gridIndex: cursor.gridIndex, typeIndex: nextIndex, queryIndex: 0 }
        : { ...cursor, typeIndex: nextIndex },
      complete: false,
    };
  }

  if (cursor.queryIndex >= province.textQueries.length) {
    return { added: [], cursor, complete: true };
  }

  const query = province.textQueries[cursor.queryIndex];
  const batch = await paginateAll((token) =>
    placesRequest(textSearchUrl(apiKey, province, query), token),
  );
  const added = filterNewPlaces(batch, province, knownIds, branchId);
  const nextIndex = cursor.queryIndex + 1;
  return {
    added,
    cursor: { ...cursor, queryIndex: nextIndex },
    complete: nextIndex >= province.textQueries.length,
  };
}

async function fetchPlaceDetails(
  apiKey: string,
  placeId: string,
  language = "nl",
): Promise<GoogleDetailsResponse["result"]> {
  const params = new URLSearchParams({
    place_id: placeId,
    fields:
      "formatted_phone_number,website,formatted_address,opening_hours",
    key: apiKey,
    language,
  });
  const res = await fetch(
    `https://maps.googleapis.com/maps/api/place/details/json?${params}`,
    { signal: AbortSignal.timeout(15000) },
  );
  const data = (await res.json()) as GoogleDetailsResponse;
  if (data.status === "OVER_QUERY_LIMIT") {
    await sleep(2000);
    return fetchPlaceDetails(apiKey, placeId, language);
  }
  if (data.status !== "OK") return undefined;
  await recordGooglePlacesCall("placeDetails", activeProvinceId);
  return data.result;
}

async function enrichPlace(
  apiKey: string,
  place: QueuedPlace,
  province: ScrapeProvinceConfig,
  branchId: ScrapeBranchId,
): Promise<Bedrijf> {
  const lenjeriiSegment =
    branchId === "lenjerii-hotel" ? classifyLenjeriiSegment(place) : null;
  const mapped = mapGoogleType(place.types);
  const subcategory = lenjeriiSegment ?? mapped.subcategory;
  const category =
    lenjeriiSegment === "restaurant"
      ? "horeca"
      : lenjeriiSegment === "spa" || lenjeriiSegment === "hotel" || lenjeriiSegment === "pension"
        ? "services"
        : mapped.category;
  let phone: string | undefined;
  let email: string | undefined;
  let website: string | undefined;
  let openingHours: string | undefined;
  let address =
    place.formatted_address ?? place.vicinity ?? province.name;

  const details = await fetchPlaceDetails(
    apiKey,
    place.place_id,
    province.language,
  );
  if (details) {
    phone = normalizePhone(details.formatted_phone_number);
    website = details.website?.trim() || undefined;
    address = details.formatted_address ?? address;
    openingHours = details.opening_hours?.weekday_text?.join(" · ");
  }

  if (website) {
    const fromSite = await extractEmailFromWebsite(website);
    email = normalizeEmail(fromSite);
  }

  return {
    id: `google/${place.place_id}`,
    name: place.name,
    category,
    subcategory,
    address,
    city: extractCity(address, province.country),
    province: province.name,
    provinceId: province.id as ScrapeRegionId,
    branchId,
    phone,
    email,
    website,
    openingHours,
    source: "google",
    placeId: place.place_id,
    lat: place.geometry?.location.lat,
    lon: place.geometry?.location.lng,
  };
}

/** Enrich up to `limit` places (parallel batches of 8). */
export async function enrichPlacesBatch(
  apiKey: string,
  province: ScrapeProvinceConfig,
  places: QueuedPlace[],
  limit: number,
  branchId: ScrapeBranchId,
  onProgress?: (
    done: number,
    total: number,
    currentName?: string,
  ) => void | Promise<void>,
): Promise<Bedrijf[]> {
  const slice = places.slice(0, limit);
  const businesses: Bedrijf[] = [];
  const PARALLEL = 6;
  let done = 0;

  for (let i = 0; i < slice.length; i += PARALLEL) {
    const batch = slice.slice(i, i + PARALLEL);
    const enriched = await Promise.all(
      batch.map((place) => enrichPlace(apiKey, place, province, branchId)),
    );
    businesses.push(...enriched);
    done += enriched.length;
    const lastName = enriched[enriched.length - 1]?.name;
    await onProgress?.(done, slice.length, lastName);
    if (i + PARALLEL < slice.length) await sleep(120);
  }

  const locale = province.country === "ro" ? "ro" : "nl";
  return businesses.sort((a, b) => a.name.localeCompare(b.name, locale));
}

export function getGoogleApiKey(): string | undefined {
  return process.env.GOOGLE_PLACES_API_KEY?.trim() || undefined;
}
