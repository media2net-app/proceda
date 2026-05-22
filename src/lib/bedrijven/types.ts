import type { ScrapeBranchId } from "./branches";
import type { ScrapeRegionId } from "./regions";

export const SCRAPE_BATCH_SIZE = 50;

export type BedrijfCategory =
  | "horeca"
  | "retail"
  | "services"
  | "health"
  | "auto"
  | "education"
  | "office"
  | "other";

export type Bedrijf = {
  id: string;
  name: string;
  category: BedrijfCategory;
  subcategory: string;
  address: string;
  city: string;
  province: string;
  /** data/bedrijven/{branch}/{region}.json */
  provinceId?: ScrapeRegionId;
  branchId?: ScrapeBranchId;
  phone?: string;
  email?: string;
  website?: string;
  openingHours?: string;
  source: "google";
  placeId: string;
  lat?: number;
  lon?: number;
};

export type QueuedPlace = {
  place_id: string;
  name: string;
  vicinity?: string;
  formatted_address?: string;
  geometry?: { location: { lat: number; lng: number } };
  types?: string[];
};

export type DiscoveryCursor = {
  phase: "grid" | "types" | "text";
  gridIndex: number;
  typeIndex: number;
  queryIndex: number;
};

export type ScrapePhase = "idle" | "discovering" | "enriching" | "done";

export type ScrapeProgress = {
  branch: ScrapeBranchId;
  province: ScrapeRegionId;
  discoveryComplete: boolean;
  discoveryCursor: DiscoveryCursor;
  placeQueue: QueuedPlace[];
  enrichedPlaceIds: string[];
  updatedAt: string;
  active?: boolean;
  phase?: ScrapePhase;
  percent?: number;
  statusMessage?: string;
  log?: string[];
  enrichingDone?: number;
  enrichingTotal?: number;
};

export type BedrijvenCache = {
  branch: ScrapeBranchId;
  province: ScrapeRegionId;
  provinceName: string;
  scrapedAt: string;
  count: number;
  dataSource: "google";
  businesses: Bedrijf[];
};

export type ScrapeBatchResult = {
  cache: BedrijvenCache;
  batchAdded: number;
  totalEnriched: number;
  queueTotal: number;
  remaining: number;
  discoveryComplete: boolean;
  done: boolean;
};
