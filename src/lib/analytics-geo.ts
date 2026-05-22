/** Approximate country centroids for globe markers when IP geo is missing. */
const COUNTRY_CENTER: Record<string, [number, number]> = {
  NL: [52.13, 5.29],
  BE: [50.5, 4.47],
  DE: [51.17, 10.45],
  FR: [46.23, 2.21],
  GB: [55.38, -3.44],
  US: [39.83, -98.58],
  ES: [40.46, -3.75],
  IT: [41.87, 12.57],
  AT: [47.52, 14.55],
  PL: [51.92, 19.15],
  PT: [39.4, -8.22],
  IE: [53.41, -8.24],
  CH: [46.82, 8.23],
  SE: [60.13, 18.64],
  NO: [60.47, 8.47],
  DK: [56.26, 9.5],
  LU: [49.82, 6.13],
  RO: [45.94, 24.97],
};

function hashSeed(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function jitterCoords(
  lat: number,
  lng: number,
  seed: string,
): [number, number] {
  const h = hashSeed(seed);
  const a = ((h % 1000) / 1000 - 0.5) * 4;
  const b = (((h / 1000) % 1000) / 1000 - 0.5) * 4;
  return [lat + a, lng + b];
}

export function coordsFromCountry(
  countryCode: string | null | undefined,
): [number, number] | null {
  if (!countryCode) return null;
  return COUNTRY_CENTER[countryCode.trim().toUpperCase()] ?? null;
}

export function resolveVisitorCoords(input: {
  latitude: number | null;
  longitude: number | null;
  countryCode: string | null;
  sessionId: string;
}): [number, number] | null {
  if (
    input.latitude != null &&
    input.longitude != null &&
    Number.isFinite(input.latitude) &&
    Number.isFinite(input.longitude)
  ) {
    return jitterCoords(input.latitude, input.longitude, input.sessionId);
  }
  const country = coordsFromCountry(input.countryCode) ?? COUNTRY_CENTER.NL;
  return jitterCoords(country[0], country[1], input.sessionId);
}

export type RequestGeo = {
  countryCode: string | null;
  city: string | null;
  region: string | null;
  latitude: number | null;
  longitude: number | null;
};

export const ANALYTICS_GEO_FALLBACK: RequestGeo = {
  countryCode: "NL",
  city: "Nederland",
  region: null,
  latitude: 52.3676,
  longitude: 4.9041,
};

export function geoFromRequestHeaders(headers: Headers): RequestGeo {
  const countryCode =
    headers.get("x-vercel-ip-country") ??
    headers.get("cf-ipcountry") ??
    headers.get("x-country-code");

  const city = headers.get("x-vercel-ip-city") ?? headers.get("cf-ipcity");
  const region =
    headers.get("x-vercel-ip-country-region") ?? headers.get("cf-region");

  const latRaw =
    headers.get("x-vercel-ip-latitude") ?? headers.get("cf-iplatitude");
  const lngRaw =
    headers.get("x-vercel-ip-longitude") ?? headers.get("cf-iplongitude");

  const latitude =
    latRaw != null && latRaw !== "" ? Number.parseFloat(latRaw) : null;
  const longitude =
    lngRaw != null && lngRaw !== "" ? Number.parseFloat(lngRaw) : null;

  const geo: RequestGeo = {
    countryCode: countryCode?.trim() || null,
    city: city?.trim() || null,
    region: region?.trim() || null,
    latitude: Number.isFinite(latitude) ? latitude : null,
    longitude: Number.isFinite(longitude) ? longitude : null,
  };

  if (!geo.countryCode && geo.latitude == null) {
    return { ...ANALYTICS_GEO_FALLBACK };
  }

  return geo;
}
