import type { Bedrijf, BedrijfCategory } from "./types";
import type { AppTypeKey } from "./lead-score";

export type ServiceDetectionInput = {
  businessName: string;
  category: BedrijfCategory;
  subcategory: string;
  pageTitle?: string | null;
  metaDescription?: string | null;
  extractedSnippet: string;
  navTexts?: string[];
};

export type ServiceDetectionResult = {
  /** Korte Nederlandse labels, bv. "Bankieren", "Webshop" */
  labels: string[];
  /** Eén regel voor UI */
  servicesSummary: string;
  primaryAppType: AppTypeKey;
  confidence: number;
};

type Signal = {
  type: AppTypeKey;
  label: string;
  patterns: RegExp[];
  weight: number;
};

const SIGNALS: Signal[] = [
  {
    type: "customer-portal",
    label: "Bankieren & financiën",
    patterns: [
      /\bbank\b/i,
      /\bhypotheek/i,
      /\bspaarrekening/i,
      /\bbeleggen/i,
      /\bverzekering/i,
      /\bcredit\s*card/i,
      /\bpensioen/i,
      /\bklantenservice/i,
    ],
    weight: 4,
  },
  {
    type: "ecommerce",
    label: "Webshop & retail",
    patterns: [
      /\bwebshop\b/i,
      /\bonline\s*bestellen/i,
      /\bwinkelwagen/i,
      /\bproducten\b/i,
      /\bcollectie\b/i,
      /\bsupermarkt/i,
      /\bassortiment/i,
    ],
    weight: 4,
  },
  {
    type: "booking-portal",
    label: "Reserveren & afspraken",
    patterns: [
      /\breserveren\b/i,
      /\btafel\s*reserv/i,
      /\bafspraak\s*maak/i,
      /\bonline\s*boeken\b/i,
      /\bovernachten\b/i,
      /\bkamer\s*boeken/i,
      /\bmenu\b/i,
      /\brestaurant\b/i,
      /\bhotel\b/i,
      /\bbehandeling\s*boeken/i,
    ],
    weight: 4,
  },
  {
    type: "crm-dashboard",
    label: "Sales & vastgoed",
    patterns: [
      /\bmakelaar/i,
      /\bvastgoed/i,
      /\bwoning\s*(?:te\s*)?koop/i,
      /\bobjecten\b/i,
      /\bofferte\s*aanvr/i,
      /\bwholesale/i,
      /\bb2b\b/i,
      /\bzakelijke\s*klanten/i,
    ],
    weight: 3,
  },
  {
    type: "ai-assistant",
    label: "Klantenservice & FAQ",
    patterns: [
      /\bchatbot\b/i,
      /\bchat\s*met\b/i,
      /\bveelgestelde\s*vragen/i,
      /\b24\/7\b/i,
      /\bklantenservice/i,
      /\bhelpdesk/i,
    ],
    weight: 3,
  },
  {
    type: "internal-tools",
    label: "Interne processen",
    patterns: [
      /\bwerkplaats/i,
      /\bgarage\b/i,
      /\bonderhoud\s*plan/i,
      /\bmedewerker/i,
      /\binventory/i,
      /\bvoorraadbeheer/i,
      /\blogistiek/i,
    ],
    weight: 3,
  },
  {
    type: "customer-portal",
    label: "Onderwijs & training",
    patterns: [
      /\bons\s*onderwijs/i,
      /\bopleiding/i,
      /\bcursus/i,
      /\bstudent/i,
      /\bschool\b/i,
      /\buniversiteit/i,
      /\binschrijven\b/i,
    ],
    weight: 3,
  },
  {
    type: "booking-portal",
    label: "Zorg & welzijn",
    patterns: [
      /\bpraktijk\b/i,
      /\btandarts/i,
      /\bhuisarts/i,
      /\btherapie/i,
      /\bkliniek/i,
      /\bzorg\b/i,
      /\bapotheek/i,
    ],
    weight: 3,
  },
  {
    type: "new-website",
    label: "Presentatie & bereikbaarheid",
    patterns: [
      /\bover\s*ons\b/i,
      /\bcontact\b/i,
      /\blocatie\b/i,
      /\bbezoek\b/i,
      /\binformatie\b/i,
    ],
    weight: 1,
  },
];

const GOOGLE_SUB_TO_APP: Record<string, { type: AppTypeKey; label: string }> = {
  bank: { type: "customer-portal", label: "Bankieren" },
  atm: { type: "customer-portal", label: "Bankieren" },
  restaurant: { type: "booking-portal", label: "Restaurant" },
  cafe: { type: "booking-portal", label: "Horeca" },
  bar: { type: "booking-portal", label: "Horeca" },
  bakery: { type: "ecommerce", label: "Bakkerij / retail" },
  meal_takeaway: { type: "booking-portal", label: "Takeaway" },
  lodging: { type: "booking-portal", label: "Hotel & overnachting" },
  supermarket: { type: "ecommerce", label: "Supermarkt" },
  store: { type: "ecommerce", label: "Winkel" },
  electronics_store: { type: "ecommerce", label: "Elektronica" },
  clothing_store: { type: "ecommerce", label: "Mode" },
  pet_store: { type: "ecommerce", label: "Dierenwinkel" },
  florist: { type: "ecommerce", label: "Bloemist" },
  car_dealer: { type: "customer-portal", label: "Automotive" },
  car_repair: { type: "internal-tools", label: "Garage & onderhoud" },
  gas_station: { type: "other", label: "Tankstation" },
  real_estate_agency: { type: "crm-dashboard", label: "Vastgoed" },
  insurance_agency: { type: "customer-portal", label: "Verzekeringen" },
  lawyer: { type: "crm-dashboard", label: "Juridische diensten" },
  accounting: { type: "crm-dashboard", label: "Administratie" },
  school: { type: "customer-portal", label: "Onderwijs" },
  secondary_school: { type: "customer-portal", label: "Onderwijs" },
  university: { type: "customer-portal", label: "Hoger onderwijs" },
  doctor: { type: "booking-portal", label: "Gezondheidszorg" },
  dentist: { type: "booking-portal", label: "Tandarts" },
  pharmacy: { type: "ecommerce", label: "Apotheek" },
  hospital: { type: "booking-portal", label: "Ziekenhuis" },
  gym: { type: "booking-portal", label: "Fitness" },
  spa: { type: "booking-portal", label: "Wellness" },
  beauty_salon: { type: "booking-portal", label: "Salon" },
  hair_care: { type: "booking-portal", label: "Kapper" },
  travel_agency: { type: "booking-portal", label: "Reizen" },
  museum: { type: "booking-portal", label: "Cultuur & tickets" },
  amusement_park: { type: "booking-portal", label: "Attractiepark" },
  park: { type: "booking-portal", label: "Recreatie" },
};

function buildCorpus(input: ServiceDetectionInput): string {
  return [
    input.businessName,
    input.subcategory.replace(/_/g, " "),
    input.pageTitle ?? "",
    input.metaDescription ?? "",
    input.extractedSnippet,
    ...(input.navTexts ?? []),
  ]
    .join(" ")
    .toLowerCase();
}

export function detectBusinessServices(
  input: ServiceDetectionInput,
): ServiceDetectionResult {
  const corpus = buildCorpus(input);
  const typeScores = new Map<AppTypeKey, number>();
  const matchedLabels: string[] = [];

  const bump = (type: AppTypeKey, score: number) => {
    typeScores.set(type, (typeScores.get(type) ?? 0) + score);
  };

  const sub = input.subcategory.toLowerCase();
  const googleHint = GOOGLE_SUB_TO_APP[sub];
  if (googleHint) {
    bump(googleHint.type, 6);
    matchedLabels.push(googleHint.label);
  }

  for (const signal of SIGNALS) {
    const hits = signal.patterns.filter((p) => p.test(corpus)).length;
    if (hits > 0) {
      bump(signal.type, signal.weight * hits);
      matchedLabels.push(signal.label);
    }
  }

  const name = input.businessName.toLowerCase();
  if (/\babn\b|ing\b|rabobank|sns|asn bank/i.test(name)) {
    bump("customer-portal", 8);
    matchedLabels.push("Bankieren");
  }
  if (/\bhotel\b|bastion|fletcher|van der valk/i.test(name)) {
    bump("booking-portal", 5);
    matchedLabels.push("Hotel");
  }
  if (/\bbruna\b|action\b|albert heijn|jumbo|hema\b/i.test(name)) {
    bump("ecommerce", 5);
    matchedLabels.push("Retail");
  }
  if (/\bbroekhuis\b|volkswagen|dealer|garage\b/i.test(name)) {
    bump("customer-portal", 4);
    matchedLabels.push("Automotive");
  }

  let primaryAppType: AppTypeKey = "other";
  let confidence = 0;
  let best = 0;
  for (const [type, score] of typeScores) {
    if (score > best) {
      best = score;
      primaryAppType = type;
      confidence = score;
    }
  }

  if (confidence < 2) {
    const categoryFallback: Record<BedrijfCategory, AppTypeKey> = {
      horeca: "booking-portal",
      retail: "ecommerce",
      health: "booking-portal",
      services: "crm-dashboard",
      auto: "customer-portal",
      education: "customer-portal",
      office: "crm-dashboard",
      other: "new-website",
    };
    primaryAppType = categoryFallback[input.category] ?? "other";
    confidence = 1;
  }

  const uniqueLabels = [...new Set(matchedLabels)].slice(0, 4);
  if (uniqueLabels.length === 0) {
    uniqueLabels.push(
      GOOGLE_SUB_TO_APP[sub]?.label ??
        ({ horeca: "Horeca", retail: "Retail", health: "Zorg", auto: "Auto", education: "Onderwijs", office: "Zakelijk", services: "Diensten", other: "Dienstverlening" }[
          input.category
        ] as string),
    );
  }

  const servicesSummary = uniqueLabels.slice(0, 3).join(" · ");

  return {
    labels: uniqueLabels,
    servicesSummary,
    primaryAppType,
    confidence,
  };
}

export function detectServicesForBusiness(
  business: Bedrijf,
  scan: {
    pageTitle?: string | null;
    metaDescription?: string | null;
    extractedSnippet: string;
    navTexts?: string[];
  },
): ServiceDetectionResult {
  return detectBusinessServices({
    businessName: business.name,
    category: business.category,
    subcategory: business.subcategory,
    pageTitle: scan.pageTitle,
    metaDescription: scan.metaDescription,
    extractedSnippet: scan.extractedSnippet,
    navTexts: scan.navTexts,
  });
}
