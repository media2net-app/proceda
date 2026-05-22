import type { ProvinceConfig } from "./provinces";

/** Roemeense județe — apart van Nederlandse provincies. */
export const ROMANIA_COUNTY_IDS = [
  "ro-alba",
  "ro-arad",
  "ro-arges",
  "ro-bacau",
  "ro-bihor",
  "ro-bistrita-nasaud",
  "ro-botosani",
  "ro-braila",
  "ro-brasov",
  "ro-bucuresti",
  "ro-buzau",
  "ro-calarasi",
  "ro-caras-severin",
  "ro-cluj",
  "ro-constanta",
  "ro-covasna",
  "ro-dambovita",
  "ro-dolj",
  "ro-galati",
  "ro-giurgiu",
  "ro-gorj",
  "ro-harghita",
  "ro-hunedoara",
  "ro-ialomita",
  "ro-iasi",
  "ro-ilfov",
  "ro-maramures",
  "ro-mehedinti",
  "ro-mures",
  "ro-neamt",
  "ro-olt",
  "ro-prahova",
  "ro-satu-mare",
  "ro-salaj",
  "ro-sibiu",
  "ro-suceava",
  "ro-teleorman",
  "ro-timis",
  "ro-tulcea",
  "ro-vaslui",
  "ro-valcea",
  "ro-vrancea",
] as const;

export type RomaniaCountyId = (typeof ROMANIA_COUNTY_IDS)[number];

type CountySeed = {
  id: RomaniaCountyId;
  name: string;
  center: { lat: number; lon: number };
  span: { lat: number; lon: number };
  cities: string[];
};

const COUNTY_SEEDS: CountySeed[] = [
  { id: "ro-alba", name: "Alba", center: { lat: 46.07, lon: 23.57 }, span: { lat: 0.4, lon: 0.45 }, cities: ["Alba Iulia", "Sebeș", "Aiud"] },
  { id: "ro-arad", name: "Arad", center: { lat: 46.17, lon: 21.32 }, span: { lat: 0.45, lon: 0.55 }, cities: ["Arad", "Ineu", "Lipova"] },
  { id: "ro-arges", name: "Argeș", center: { lat: 44.86, lon: 24.87 }, span: { lat: 0.45, lon: 0.5 }, cities: ["Pitești", "Curtea de Argeș", "Câmpulung"] },
  { id: "ro-bacau", name: "Bacău", center: { lat: 46.57, lon: 26.91 }, span: { lat: 0.45, lon: 0.5 }, cities: ["Bacău", "Onești", "Moinești"] },
  { id: "ro-bihor", name: "Bihor", center: { lat: 47.05, lon: 21.92 }, span: { lat: 0.45, lon: 0.55 }, cities: ["Oradea", "Beiuș", "Salonta"] },
  { id: "ro-bistrita-nasaud", name: "Bistrița-Năsud", center: { lat: 47.13, lon: 24.5 }, span: { lat: 0.45, lon: 0.5 }, cities: ["Bistrița", "Beclean", "Năsăud"] },
  { id: "ro-botosani", name: "Botoșani", center: { lat: 47.75, lon: 26.67 }, span: { lat: 0.4, lon: 0.45 }, cities: ["Botoșani", "Dorohoi", "Suceava"] },
  { id: "ro-braila", name: "Brăila", center: { lat: 45.27, lon: 27.97 }, span: { lat: 0.4, lon: 0.45 }, cities: ["Brăila", "Ianca", "Însurăței"] },
  { id: "ro-brasov", name: "Brașov", center: { lat: 45.66, lon: 25.61 }, span: { lat: 0.45, lon: 0.5 }, cities: ["Brașov", "Făgăraș", "Săcele", "Predeal"] },
  { id: "ro-bucuresti", name: "București", center: { lat: 44.43, lon: 26.1 }, span: { lat: 0.25, lon: 0.3 }, cities: ["București", "Sector 1", "Sector 2", "Sector 3"] },
  { id: "ro-buzau", name: "Buzău", center: { lat: 45.15, lon: 26.82 }, span: { lat: 0.4, lon: 0.45 }, cities: ["Buzău", "Râmnicu Sărat", "Pătârlagele"] },
  { id: "ro-calarasi", name: "Călărași", center: { lat: 44.2, lon: 27.33 }, span: { lat: 0.4, lon: 0.45 }, cities: ["Călărași", "Oltenița", "Lehliu Gară"] },
  { id: "ro-caras-severin", name: "Caraș-Severin", center: { lat: 45.3, lon: 21.89 }, span: { lat: 0.5, lon: 0.55 }, cities: ["Reșița", "Caransebeș", "Moldova Nouă"] },
  { id: "ro-cluj", name: "Cluj", center: { lat: 46.77, lon: 23.59 }, span: { lat: 0.45, lon: 0.5 }, cities: ["Cluj-Napoca", "Turda", "Dej", "Gherla"] },
  { id: "ro-constanta", name: "Constanța", center: { lat: 44.18, lon: 28.63 }, span: { lat: 0.45, lon: 0.55 }, cities: ["Constanța", "Mangalia", "Medgidia", "Năvodari"] },
  { id: "ro-covasna", name: "Covasna", center: { lat: 45.86, lon: 25.79 }, span: { lat: 0.35, lon: 0.4 }, cities: ["Sfântu Gheorghe", "Târgu Secuiesc", "Covasna"] },
  { id: "ro-dambovita", name: "Dâmbovița", center: { lat: 44.92, lon: 25.46 }, span: { lat: 0.4, lon: 0.45 }, cities: ["Târgoviște", "Moreni", "Pucioasa"] },
  { id: "ro-dolj", name: "Dolj", center: { lat: 44.32, lon: 23.8 }, span: { lat: 0.5, lon: 0.55 }, cities: ["Craiova", "Băilești", "Calafat"] },
  { id: "ro-galati", name: "Galați", center: { lat: 45.44, lon: 28.01 }, span: { lat: 0.4, lon: 0.45 }, cities: ["Galați", "Tecuci", "Tulucești"] },
  { id: "ro-giurgiu", name: "Giurgiu", center: { lat: 43.9, lon: 25.97 }, span: { lat: 0.4, lon: 0.45 }, cities: ["Giurgiu", "Bolintin-Vale", "Mihăilești"] },
  { id: "ro-gorj", name: "Gorj", center: { lat: 45.03, lon: 23.27 }, span: { lat: 0.45, lon: 0.5 }, cities: ["Târgu Jiu", "Motru", "Rovinari"] },
  { id: "ro-harghita", name: "Harghita", center: { lat: 46.36, lon: 25.8 }, span: { lat: 0.45, lon: 0.5 }, cities: ["Miercurea Ciuc", "Odorheiu Secuiesc", "Gheorgheni"] },
  { id: "ro-hunedoara", name: "Hunedoara", center: { lat: 45.75, lon: 22.91 }, span: { lat: 0.5, lon: 0.55 }, cities: ["Deva", "Hunedoara", "Petroșani", "Lupeni"] },
  { id: "ro-ialomita", name: "Ialomița", center: { lat: 44.56, lon: 27.37 }, span: { lat: 0.4, lon: 0.45 }, cities: ["Slobozia", "Fetești", "Uruziceni"] },
  { id: "ro-iasi", name: "Iași", center: { lat: 47.16, lon: 27.59 }, span: { lat: 0.45, lon: 0.5 }, cities: ["Iași", "Pașcani", "Hârlău"] },
  { id: "ro-ilfov", name: "Ilfov", center: { lat: 44.5, lon: 26.1 }, span: { lat: 0.3, lon: 0.35 }, cities: ["Buftea", "Voluntari", "Pantelimon", "Otopeni"] },
  { id: "ro-maramures", name: "Maramureș", center: { lat: 47.66, lon: 23.58 }, span: { lat: 0.45, lon: 0.5 }, cities: ["Baia Mare", "Sighetu Marmației", "Borșa"] },
  { id: "ro-mehedinti", name: "Mehedinți", center: { lat: 44.63, lon: 22.66 }, span: { lat: 0.5, lon: 0.55 }, cities: ["Drobeta-Turnu Severin", "Orșova", "Vânju Mare"] },
  { id: "ro-mures", name: "Mureș", center: { lat: 46.55, lon: 24.56 }, span: { lat: 0.45, lon: 0.5 }, cities: ["Târgu Mureș", "Reghin", "Sighișoara"] },
  { id: "ro-neamt", name: "Neamț", center: { lat: 46.93, lon: 26.37 }, span: { lat: 0.45, lon: 0.5 }, cities: ["Piatra Neamț", "Roman", "Târgu Neamț"] },
  { id: "ro-olt", name: "Olt", center: { lat: 44.43, lon: 24.36 }, span: { lat: 0.45, lon: 0.5 }, cities: ["Slatina", "Caracal", "Corabia"] },
  { id: "ro-prahova", name: "Prahova", center: { lat: 44.94, lon: 26.02 }, span: { lat: 0.4, lon: 0.45 }, cities: ["Ploiești", "Câmpina", "Sinaia", "Băicoi"] },
  { id: "ro-satu-mare", name: "Satu Mare", center: { lat: 47.8, lon: 22.88 }, span: { lat: 0.4, lon: 0.45 }, cities: ["Satu Mare", "Carei", "Negrești-Oaș"] },
  { id: "ro-salaj", name: "Sălaj", center: { lat: 47.19, lon: 23.06 }, span: { lat: 0.4, lon: 0.45 }, cities: ["Zalău", "Jibou", "Șimleu Silvaniei"] },
  { id: "ro-sibiu", name: "Sibiu", center: { lat: 45.8, lon: 24.15 }, span: { lat: 0.45, lon: 0.5 }, cities: ["Sibiu", "Mediaș", "Cisnădie"] },
  { id: "ro-suceava", name: "Suceava", center: { lat: 47.65, lon: 26.26 }, span: { lat: 0.5, lon: 0.55 }, cities: ["Suceava", "Fălticeni", "Rădăuți", "Câmpulung Moldovenesc"] },
  { id: "ro-teleorman", name: "Teleorman", center: { lat: 43.97, lon: 25.33 }, span: { lat: 0.4, lon: 0.45 }, cities: ["Alexandria", "Roșiorii de Vede", "Turnu Măgurele"] },
  { id: "ro-timis", name: "Timiș", center: { lat: 45.76, lon: 21.23 }, span: { lat: 0.5, lon: 0.55 }, cities: ["Timișoara", "Lugoj", "Jimbolia"] },
  { id: "ro-tulcea", name: "Tulcea", center: { lat: 45.17, lon: 28.79 }, span: { lat: 0.5, lon: 0.6 }, cities: ["Tulcea", "Babadag", "Măcin"] },
  { id: "ro-vaslui", name: "Vaslui", center: { lat: 46.64, lon: 27.73 }, span: { lat: 0.45, lon: 0.5 }, cities: ["Vaslui", "Bârlad", "Huși"] },
  { id: "ro-valcea", name: "Vâlcea", center: { lat: 45.1, lon: 24.37 }, span: { lat: 0.45, lon: 0.5 }, cities: ["Râmnicu Vâlcea", "Drăgășani", "Horezu"] },
  { id: "ro-vrancea", name: "Vrancea", center: { lat: 45.7, lon: 27.18 }, span: { lat: 0.4, lon: 0.45 }, cities: ["Focșani", "Adjud", "Mărășești"] },
];

function buildLenjeriiTextQueries(county: CountySeed): string[] {
  const queries: string[] = [];
  for (const city of county.cities) {
    queries.push(`hotel ${city}`);
    queries.push(`pensiune ${city}`);
    queries.push(`restaurant ${city}`);
    queries.push(`spa ${city}`);
    queries.push(`cazare ${city}`);
    queries.push(`hoteluri ${city}`);
  }
  queries.push(`hotel ${county.name}`);
  queries.push(`pensiune ${county.name}`);
  queries.push(`restaurant ${county.name}`);
  queries.push(`spa ${county.name}`);
  queries.push(`hotel ${county.name} România`);
  return [...new Set(queries)];
}

function seedToConfig(seed: CountySeed): ProvinceConfig & { country: "ro" } {
  const { center, span } = seed;
  return {
    id: seed.id as unknown as ProvinceConfig["id"],
    name: seed.name,
    enabled: true,
    center,
    bbox: {
      minLat: center.lat - span.lat,
      maxLat: center.lat + span.lat,
      minLon: center.lon - span.lon,
      maxLon: center.lon + span.lon,
    },
    searchGrid: [],
    textQueries: buildLenjeriiTextQueries(seed),
    nearbyRadius: 12_000,
    maxDistanceMeters: 45_000,
    country: "ro",
  };
}

export const ROMANIA_COUNTIES: Record<
  RomaniaCountyId,
  ProvinceConfig & { country: "ro" }
> = Object.fromEntries(
  COUNTY_SEEDS.map((s) => [s.id, seedToConfig(s)]),
) as Record<RomaniaCountyId, ProvinceConfig & { country: "ro" }>;

export const ROMANIA_CENTER = { lat: 45.94, lon: 24.97 };

export function isValidRomaniaCountyId(id: string): id is RomaniaCountyId {
  return ROMANIA_COUNTY_IDS.includes(id as RomaniaCountyId);
}

export function getRomaniaCounty(id: string) {
  if (!isValidRomaniaCountyId(id)) return undefined;
  return ROMANIA_COUNTIES[id];
}
