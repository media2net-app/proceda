import {
  buildSearchGrid,
  getRegionConfig,
  resolveRegionId,
  type ScrapeRegionId,
} from "./regions";
import {
  PROVINCES,
  type ProvinceConfig,
  type ProvinceId,
} from "./provinces";

/** Verticale markt voor scrape + rapportage (landelijk per regio). */
export const BRANCH_IDS = ["makelaardij", "installatie", "lenjerii-hotel"] as const;

export type ScrapeBranchId = (typeof BRANCH_IDS)[number];

export const DEFAULT_BRANCH: ScrapeBranchId = "makelaardij";

export type BranchConfig = {
  id: ScrapeBranchId;
  name: string;
  /** Google Places nearby `type` waarden voor de types-fase. */
  googleNearbyTypes: string[];
};

export const BRANCHES: Record<ScrapeBranchId, BranchConfig> = {
  makelaardij: {
    id: "makelaardij",
    name: "Makelaardij",
    googleNearbyTypes: ["real_estate_agency"],
  },
  installatie: {
    id: "installatie",
    name: "Installatie & techniek",
    googleNearbyTypes: [
      "electrician",
      "plumber",
      "general_contractor",
      "roofing_contractor",
    ],
  },
  "lenjerii-hotel": {
    id: "lenjerii-hotel",
    name: "Lenjerii hotel",
    googleNearbyTypes: ["lodging", "restaurant", "spa"],
  },
};

/** Doelgroep-segmenten voor Lenjerii hotel (hotels, pensiuni, restaurants, spa). */
export type LenjeriiSegment = "hotel" | "pension" | "restaurant" | "spa";

export const LENJERII_SEGMENTS: LenjeriiSegment[] = [
  "hotel",
  "pension",
  "restaurant",
  "spa",
];

/** Grote plaatsen per provincie voor tekstzoekopdrachten. */
const PROVINCE_CITIES: Record<ProvinceId, string[]> = {
  "noord-holland": [
    "Amsterdam",
    "Haarlem",
    "Alkmaar",
    "Zaandam",
    "Hilversum",
    "Purmerend",
    "Hoorn",
    "Haarlemmermeer",
  ],
  "zuid-holland": [
    "Rotterdam",
    "Den Haag",
    "Leiden",
    "Dordrecht",
    "Zoetermeer",
    "Delft",
    "Gouda",
    "Alphen aan den Rijn",
  ],
  "noord-brabant": [
    "Eindhoven",
    "Tilburg",
    "Breda",
    "'s-Hertogenbosch",
    "Helmond",
    "Roosendaal",
  ],
  gelderland: [
    "Arnhem",
    "Nijmegen",
    "Apeldoorn",
    "Ede",
    "Zutphen",
    "Doetinchem",
  ],
  utrecht: ["Utrecht", "Amersfoort", "Nieuwegein", "Zeist", "Houten"],
  overijssel: ["Zwolle", "Enschede", "Deventer", "Almelo", "Hengelo"],
  limburg: ["Maastricht", "Venlo", "Roermond", "Heerlen", "Sittard"],
  flevoland: ["Almere", "Lelystad", "Dronten", "Emmeloord"],
  friesland: ["Leeuwarden", "Sneek", "Heerenveen", "Drachten"],
  groningen: ["Groningen", "Delfzijl", "Stadskanaal", "Veendam"],
  drenthe: ["Assen", "Emmen", "Hoogeveen", "Meppel", "Coevorden"],
  zeeland: ["Middelburg", "Vlissingen", "Goes", "Terneuzen"],
};

export function isValidBranchId(id: string): id is ScrapeBranchId {
  return BRANCH_IDS.includes(id as ScrapeBranchId);
}

export function getBranch(id: string): BranchConfig | undefined {
  if (!isValidBranchId(id)) return undefined;
  return BRANCHES[id];
}

export function resolveBranchId(value: string | null): ScrapeBranchId {
  if (value && isValidBranchId(value)) return value;
  return DEFAULT_BRANCH;
}

const ROMANIA_CITIES: Record<string, string[]> = {
  "ro-alba": ["Alba Iulia", "Sebeș", "Aiud"],
  "ro-arad": ["Arad", "Ineu"],
  "ro-arges": ["Pitești", "Curtea de Argeș"],
  "ro-bacau": ["Bacău", "Onești"],
  "ro-bihor": ["Oradea", "Beiuș"],
  "ro-bistrita-nasaud": ["Bistrița", "Beclean"],
  "ro-botosani": ["Botoșani", "Dorohoi"],
  "ro-braila": ["Brăila"],
  "ro-brasov": ["Brașov", "Făgăraș", "Săcele", "Predeal"],
  "ro-bucuresti": ["București"],
  "ro-buzau": ["Buzău", "Râmnicu Sărat"],
  "ro-calarasi": ["Călărași", "Oltenița"],
  "ro-caras-severin": ["Reșița", "Caransebeș"],
  "ro-cluj": ["Cluj-Napoca", "Turda", "Dej"],
  "ro-constanta": ["Constanța", "Mangalia", "Mamaia"],
  "ro-covasna": ["Sfântu Gheorghe", "Covasna"],
  "ro-dambovita": ["Târgoviște", "Moreni", "Pucioasa"],
  "ro-dolj": ["Craiova", "Băilești"],
  "ro-galati": ["Galați", "Tecuci"],
  "ro-giurgiu": ["Giurgiu"],
  "ro-gorj": ["Târgu Jiu", "Motru"],
  "ro-harghita": ["Miercurea Ciuc", "Gheorgheni"],
  "ro-hunedoara": ["Deva", "Hunedoara", "Petroșani"],
  "ro-ialomita": ["Slobozia", "Fetești"],
  "ro-iasi": ["Iași", "Pașcani"],
  "ro-ilfov": ["Buftea", "Voluntari", "Otopeni"],
  "ro-maramures": ["Baia Mare", "Sighetu Marmației"],
  "ro-mehedinti": ["Drobeta-Turnu Severin", "Orșova"],
  "ro-mures": ["Târgu Mureș", "Reghin", "Sighișoara"],
  "ro-neamt": ["Piatra Neamț", "Roman"],
  "ro-olt": ["Slatina", "Caracal"],
  "ro-prahova": ["Ploiești", "Câmpina", "Sinaia"],
  "ro-satu-mare": ["Satu Mare", "Carei"],
  "ro-salaj": ["Zalău", "Jibou"],
  "ro-sibiu": ["Sibiu", "Mediaș"],
  "ro-suceava": ["Suceava", "Fălticeni", "Rădăuți"],
  "ro-teleorman": ["Alexandria", "Roșiorii de Vede"],
  "ro-timis": ["Timișoara", "Lugoj"],
  "ro-tulcea": ["Tulcea", "Măcin"],
  "ro-vaslui": ["Vaslui", "Bârlad"],
  "ro-valcea": ["Râmnicu Vâlcea", "Horezu"],
  "ro-vrancea": ["Focșani", "Adjud"],
};

function buildLenjeriiTextQueries(
  countyName: string,
  regionId: ScrapeRegionId,
): string[] {
  const cities =
    ROMANIA_CITIES[regionId as keyof typeof ROMANIA_CITIES] ?? [countyName];
  const queries: string[] = [];
  for (const city of cities) {
    queries.push(`hotel ${city}`);
    queries.push(`pensiune ${city}`);
    queries.push(`restaurant ${city}`);
    queries.push(`spa ${city}`);
    queries.push(`cazare ${city}`);
    queries.push(`hoteluri ${city}`);
  }
  queries.push(`hotel ${countyName}`);
  queries.push(`pensiune ${countyName}`);
  queries.push(`restaurant ${countyName}`);
  queries.push(`spa ${countyName}`);
  return [...new Set(queries)];
}

export function buildMakelaardijTextQueries(province: ProvinceConfig): string[] {
  const cities = PROVINCE_CITIES[province.id as ProvinceId] ?? [];
  const queries: string[] = [];
  for (const city of cities) {
    queries.push(`makelaar ${city}`);
    queries.push(`makelaardij ${city}`);
    queries.push(`vastgoedmakelaar ${city}`);
    queries.push(`NVM makelaar ${city}`);
  }
  queries.push(`makelaar ${province.name}`);
  queries.push(`makelaardij ${province.name}`);
  return [...new Set(queries)];
}

export function buildInstallatieTextQueries(province: ProvinceConfig): string[] {
  const cities = PROVINCE_CITIES[province.id as ProvinceId] ?? [];
  const trades = [
    "elektricien",
    "loodgieter",
    "installatiebedrijf",
    "cv monteur",
    "verwarming",
    "sanitair",
    "aannemer",
    "dakdekker",
    "zonnepanelen installateur",
  ];
  const queries: string[] = [];
  for (const city of cities) {
    for (const trade of trades) {
      queries.push(`${trade} ${city}`);
    }
  }
  for (const trade of trades) {
    queries.push(`${trade} ${province.name}`);
  }
  return [...new Set(queries)];
}

/** Zoekqueries voor gratis browser-lead scrape (geen Google API). */
export function getBrowserLeadSearchQueries(
  branchId: ScrapeBranchId,
  province: ProvinceConfig,
): string[] {
  if (branchId === "installatie") {
    return buildInstallatieTextQueries(province);
  }
  if (branchId === "makelaardij") {
    return buildMakelaardijTextQueries(province);
  }
  return [`bedrijf ${province.name}`];
}

export type ScrapeRegionConfig = ProvinceConfig & {
  branchId: ScrapeBranchId;
  nearbyTypes: string[];
  country: "nl" | "ro";
  language: string;
  regionCode: string;
};

/** Regioconfig voor een branche (NL-provincie of RO-județ). */
export function getScrapeProvinceConfig(
  branchId: ScrapeBranchId,
  regionId: ScrapeRegionId,
): ScrapeRegionConfig | undefined {
  const branch = getBranch(branchId);
  const base = getRegionConfig(branchId, regionId);
  if (!branch || !base) return undefined;

  const searchGrid = buildSearchGrid(base);
  const country = base.country ?? (branchId === "lenjerii-hotel" ? "ro" : "nl");
  const textQueries =
    branchId === "makelaardij"
      ? buildMakelaardijTextQueries(base as ProvinceConfig)
      : branchId === "installatie"
        ? buildInstallatieTextQueries(base as ProvinceConfig)
        : branchId === "lenjerii-hotel"
          ? buildLenjeriiTextQueries(base.name, regionId)
          : base.textQueries;

  return {
    ...base,
    id: regionId as ProvinceConfig["id"],
    branchId,
    name: `${base.name} · ${branch.name}`,
    focusCity: undefined,
    enabled: true,
    searchGrid,
    textQueries,
    nearbyTypes: branch.googleNearbyTypes,
    country,
    language: country === "ro" ? "ro" : "nl",
    regionCode: country,
  };
}

export function isInstallatieCandidate(place: {
  name?: string;
  types?: string[];
}): boolean {
  const types = (place.types ?? []).join(" ").toLowerCase();
  const name = (place.name ?? "").toLowerCase();
  const installTypes = [
    "electrician",
    "plumber",
    "general_contractor",
    "roofing_contractor",
    "home_goods_store",
  ];
  if (installTypes.some((t) => types.includes(t))) return true;
  return (
    name.includes("elektr") ||
    name.includes("loodgieter") ||
    name.includes("installat") ||
    name.includes("sanitair") ||
    name.includes("verwarm") ||
    name.includes("cv ") ||
    name.includes(" cv") ||
    name.includes("aannemer") ||
    name.includes("dakdek") ||
    name.includes("zonnepanel") ||
    name.includes("airco") ||
    name.includes("klimaat") ||
    name.includes("monteur") ||
    name.includes("technisch")
  );
}

export function isMakelaardijCandidate(place: {
  name?: string;
  types?: string[];
}): boolean {
  const types = (place.types ?? []).join(" ").toLowerCase();
  const name = (place.name ?? "").toLowerCase();
  if (types.includes("real_estate")) return true;
  return (
    name.includes("makelaar") ||
    name.includes("makelaardij") ||
    name.includes("vastgoed") ||
    name.includes(" nvm") ||
    name.startsWith("nvm ")
  );
}

export function classifyLenjeriiSegment(place: {
  name?: string;
  types?: string[];
}): LenjeriiSegment | null {
  const types = (place.types ?? []).join(" ").toLowerCase();
  const name = (place.name ?? "").toLowerCase();

  if (
    types.includes("spa") ||
    name.includes(" spa") ||
    name.startsWith("spa ") ||
    name.includes("wellness")
  ) {
    return "spa";
  }
  if (
    types.includes("restaurant") ||
    types.includes("meal") ||
    types.includes("food") ||
    types.includes("cafe") ||
    name.includes("restaurant") ||
    name.includes("restaur")
  ) {
    return "restaurant";
  }
  if (
    name.includes("pensiune") ||
    name.includes("pension") ||
    name.includes("cazare") ||
    name.includes("guest house") ||
    name.includes("guesthouse") ||
    types.includes("guest_house") ||
    types.includes("hostel")
  ) {
    return "pension";
  }
  if (
    types.includes("lodging") ||
    types.includes("hotel") ||
    name.includes("hotel") ||
    name.includes("motel") ||
    name.includes("resort")
  ) {
    return "hotel";
  }
  return null;
}

export function placeMatchesBranch(
  branchId: ScrapeBranchId,
  place: { name?: string; types?: string[] },
): boolean {
  if (branchId === "makelaardij") return isMakelaardijCandidate(place);
  if (branchId === "installatie") return isInstallatieCandidate(place);
  if (branchId === "lenjerii-hotel") return classifyLenjeriiSegment(place) != null;
  return true;
}

export { resolveRegionId };
