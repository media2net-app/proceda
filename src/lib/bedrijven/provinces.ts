export const PROVINCE_IDS = [
  "noord-holland",
  "zuid-holland",
  "noord-brabant",
  "gelderland",
  "utrecht",
  "overijssel",
  "limburg",
  "flevoland",
  "friesland",
  "groningen",
  "drenthe",
  "zeeland",
] as const;

export type ProvinceId = (typeof PROVINCE_IDS)[number];

export const DEFAULT_PROVINCE: ProvinceId = "drenthe";

export type ProvinceBBox = {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
};

export type ProvinceConfig = {
  id: ProvinceId | string;
  name: string;
  country?: "nl" | "ro";
  /** Optioneel: alleen bedrijven in deze plaats (adres/vicinity). */
  focusCity?: string;
  enabled: boolean;
  center: { lat: number; lon: number };
  bbox: ProvinceBBox;
  searchGrid: { lat: number; lon: number }[];
  textQueries: string[];
  nearbyRadius: number;
  maxDistanceMeters: number;
};

const NOORD_HOLLAND_GRID: { lat: number; lon: number }[] = [
  { lat: 52.3676, lon: 4.9041 },
  { lat: 52.3874, lon: 4.6462 },
  { lat: 52.6316, lon: 4.7486 },
  { lat: 52.4384, lon: 4.8264 },
  { lat: 52.2292, lon: 5.1669 },
  { lat: 52.6426, lon: 5.0597 },
  { lat: 52.505, lon: 4.9597 },
  { lat: 52.6653, lon: 4.8486 },
  { lat: 52.9597, lon: 4.7593 },
  { lat: 52.487, lon: 4.6558 },
  { lat: 52.703, lon: 5.291 },
  { lat: 52.5488, lon: 4.6696 },
  { lat: 52.3492, lon: 4.623 },
  { lat: 52.3008, lon: 4.8639 },
  { lat: 52.4608, lon: 4.6105 },
  { lat: 52.8345, lon: 4.9167 },
];

const NOORD_HOLLAND_QUERIES = [
  "restaurant Amsterdam",
  "winkel Haarlem",
  "bedrijf Alkmaar",
  "horeca Zaandam",
  "kapper Hilversum",
  "fysiotherapeut Purmerend",
  "tandarts Hoorn",
  "advocatenkantoor Noord-Holland",
  "accountant Amsterdam",
  "garage Haarlem",
  "supermarkt Alkmaar",
  "hotel Amsterdam",
  "café Haarlem",
  "bakkerij Zaandam",
  "kledingwinkel Hilversum",
  "apotheek Purmerend",
  "schoonheidssalon Hoorn",
  "IT bedrijf Amsterdam",
  "marketingbureau Haarlem",
  "bouwbedrijf Alkmaar",
  "installateur Noord-Holland",
  "restaurant Den Helder",
  "winkel Beverwijk",
  "bedrijf Enkhuizen",
  "horeca Heerhugowaard",
];

const HOOGEVEEN_CENTER = { lat: 52.7225, lon: 6.4764 };

const DRENTHE_HOOGEVEEN_GRID: { lat: number; lon: number }[] = [
  HOOGEVEEN_CENTER,
  { lat: 52.735, lon: 6.455 },
  { lat: 52.71, lon: 6.495 },
  { lat: 52.728, lon: 6.51 },
  { lat: 52.715, lon: 6.45 },
  { lat: 52.74, lon: 6.48 },
];

const DRENTHE_HOOGEVEEN_QUERIES = [
  "bedrijf Hoogeveen",
  "restaurant Hoogeveen",
  "winkel Hoogeveen",
  "horeca Hoogeveen",
  "hotel Hoogeveen",
  "supermarkt Hoogeveen",
  "kapper Hoogeveen",
  "tandarts Hoogeveen",
  "fysiotherapeut Hoogeveen",
  "garage Hoogeveen",
  "bouwbedrijf Hoogeveen",
  "accountant Hoogeveen",
  "advocatenkantoor Hoogeveen",
  "schoonheidssalon Hoogeveen",
  "apotheek Hoogeveen",
  "café Hoogeveen",
  "bakkerij Hoogeveen",
  "IT bedrijf Hoogeveen",
  "autobedrijf Hoogeveen",
  "installateur Hoogeveen",
  "marketingbureau Hoogeveen",
  "kledingwinkel Hoogeveen",
  "fietsenwinkel Hoogeveen",
  "dierenwinkel Hoogeveen",
];

export const PROVINCES: Record<ProvinceId, ProvinceConfig> = {
  "noord-holland": {
    id: "noord-holland",
    name: "Noord-Holland",
    enabled: false,
    center: { lat: 52.45, lon: 4.85 },
    bbox: { minLat: 52.2, maxLat: 53.2, minLon: 4.5, maxLon: 5.25 },
    searchGrid: NOORD_HOLLAND_GRID,
    textQueries: NOORD_HOLLAND_QUERIES,
    nearbyRadius: 8000,
    maxDistanceMeters: 14_000,
  },
  "zuid-holland": {
    id: "zuid-holland",
    name: "Zuid-Holland",
    enabled: false,
    center: { lat: 52.0, lon: 4.5 },
    bbox: { minLat: 51.7, maxLat: 52.2, minLon: 4.0, maxLon: 5.0 },
    searchGrid: [],
    textQueries: [],
    nearbyRadius: 8000,
    maxDistanceMeters: 14_000,
  },
  "noord-brabant": {
    id: "noord-brabant",
    name: "Noord-Brabant",
    enabled: false,
    center: { lat: 51.6, lon: 5.3 },
    bbox: { minLat: 51.2, maxLat: 51.9, minLon: 4.5, maxLon: 6.0 },
    searchGrid: [],
    textQueries: [],
    nearbyRadius: 8000,
    maxDistanceMeters: 14_000,
  },
  gelderland: {
    id: "gelderland",
    name: "Gelderland",
    enabled: false,
    center: { lat: 52.0, lon: 5.9 },
    bbox: { minLat: 51.7, maxLat: 52.5, minLon: 5.0, maxLon: 6.5 },
    searchGrid: [],
    textQueries: [],
    nearbyRadius: 8000,
    maxDistanceMeters: 14_000,
  },
  utrecht: {
    id: "utrecht",
    name: "Utrecht",
    enabled: false,
    center: { lat: 52.1, lon: 5.2 },
    bbox: { minLat: 51.9, maxLat: 52.3, minLon: 4.8, maxLon: 5.5 },
    searchGrid: [],
    textQueries: [],
    nearbyRadius: 8000,
    maxDistanceMeters: 14_000,
  },
  overijssel: {
    id: "overijssel",
    name: "Overijssel",
    enabled: false,
    center: { lat: 52.5, lon: 6.2 },
    bbox: { minLat: 52.1, maxLat: 52.8, minLon: 5.8, maxLon: 6.8 },
    searchGrid: [],
    textQueries: [],
    nearbyRadius: 8000,
    maxDistanceMeters: 14_000,
  },
  limburg: {
    id: "limburg",
    name: "Limburg",
    enabled: false,
    center: { lat: 51.2, lon: 5.9 },
    bbox: { minLat: 50.8, maxLat: 51.5, minLon: 5.5, maxLon: 6.3 },
    searchGrid: [],
    textQueries: [],
    nearbyRadius: 8000,
    maxDistanceMeters: 14_000,
  },
  flevoland: {
    id: "flevoland",
    name: "Flevoland",
    enabled: false,
    center: { lat: 52.5, lon: 5.5 },
    bbox: { minLat: 52.3, maxLat: 52.7, minLon: 5.2, maxLon: 5.9 },
    searchGrid: [],
    textQueries: [],
    nearbyRadius: 8000,
    maxDistanceMeters: 14_000,
  },
  friesland: {
    id: "friesland",
    name: "Friesland",
    enabled: false,
    center: { lat: 53.0, lon: 5.8 },
    bbox: { minLat: 52.7, maxLat: 53.3, minLon: 5.3, maxLon: 6.2 },
    searchGrid: [],
    textQueries: [],
    nearbyRadius: 8000,
    maxDistanceMeters: 14_000,
  },
  groningen: {
    id: "groningen",
    name: "Groningen",
    enabled: false,
    center: { lat: 53.2, lon: 6.6 },
    bbox: { minLat: 52.9, maxLat: 53.5, minLon: 6.0, maxLon: 7.2 },
    searchGrid: [],
    textQueries: [],
    nearbyRadius: 8000,
    maxDistanceMeters: 14_000,
  },
  drenthe: {
    id: "drenthe",
    name: "Drenthe",
    enabled: false,
    center: { lat: 52.947, lon: 6.623 },
    bbox: { minLat: 52.65, maxLat: 53.15, minLon: 6.15, maxLon: 7.05 },
    searchGrid: [],
    textQueries: [],
    nearbyRadius: 8000,
    maxDistanceMeters: 14_000,
  },
  zeeland: {
    id: "zeeland",
    name: "Zeeland",
    enabled: false,
    center: { lat: 51.5, lon: 3.8 },
    bbox: { minLat: 51.2, maxLat: 51.7, minLon: 3.4, maxLon: 4.2 },
    searchGrid: [],
    textQueries: [],
    nearbyRadius: 8000,
    maxDistanceMeters: 14_000,
  },
};

export function getProvince(id: string): ProvinceConfig | undefined {
  if (!(id in PROVINCES)) return undefined;
  return PROVINCES[id as ProvinceId];
}

/** Legacy vlag op provincie; scrapen loopt via branche-config (`getScrapeProvinceConfig`). */
export function getEnabledProvinces(): ProvinceConfig[] {
  return [];
}

export function isValidProvinceId(id: string): id is ProvinceId {
  return PROVINCE_IDS.includes(id as ProvinceId);
}
