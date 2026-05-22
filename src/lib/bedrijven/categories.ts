import type { BedrijfCategory } from "./types";

const HORECA = new Set([
  "restaurant",
  "cafe",
  "fast_food",
  "bar",
  "pub",
  "biergarten",
  "food_court",
  "ice_cream",
]);

const RETAIL = new Set([
  "supermarket",
  "convenience",
  "general",
  "clothes",
  "shoes",
  "bakery",
  "butcher",
  "greengrocer",
  "hardware",
  "furniture",
  "electronics",
  "mobile_phone",
  "beauty",
  "chemist",
  "variety_store",
  "department_store",
  "kiosk",
  "mall",
  "tyres",
  "car_parts",
]);

const SERVICES = new Set([
  "hairdresser",
  "beauty",
  "dry_cleaning",
  "laundry",
  "tailor",
  "repair",
  "travel_agency",
  "insurance",
  "estate_agent",
  "lawyer",
  "accountant",
  "bank",
  "atm",
  "post_office",
  "veterinary",
]);

const HEALTH = new Set([
  "pharmacy",
  "clinic",
  "doctors",
  "dentist",
  "hospital",
  "social_facility",
]);

const AUTO = new Set([
  "fuel",
  "car_repair",
  "car_wash",
  "car",
  "motorcycle",
]);

const EDUCATION = new Set([
  "school",
  "kindergarten",
  "college",
  "university",
  "library",
]);

const OFFICE = new Set([
  "company",
  "government",
  "ngo",
  "employment_agency",
  "it",
  "architect",
  "consulting",
]);

export function categorize(tags: Record<string, string>): {
  category: BedrijfCategory;
  subcategory: string;
} {
  const shop = tags.shop;
  const amenity = tags.amenity;
  const office = tags.office;
  const craft = tags.craft;
  const key = shop || amenity || office || craft || "unknown";

  if (HORECA.has(amenity ?? "") || HORECA.has(shop ?? ""))
    return { category: "horeca", subcategory: key };
  if (RETAIL.has(shop ?? "")) return { category: "retail", subcategory: key };
  if (HEALTH.has(amenity ?? "") || shop === "chemist")
    return { category: "health", subcategory: key };
  if (AUTO.has(shop ?? "") || AUTO.has(amenity ?? ""))
    return { category: "auto", subcategory: key };
  if (EDUCATION.has(amenity ?? ""))
    return { category: "education", subcategory: key };
  if (OFFICE.has(office ?? "")) return { category: "office", subcategory: key };
  if (SERVICES.has(shop ?? "") || SERVICES.has(amenity ?? ""))
    return { category: "services", subcategory: key };

  return { category: "other", subcategory: key };
}

export const CATEGORY_ORDER: BedrijfCategory[] = [
  "retail",
  "horeca",
  "services",
  "health",
  "auto",
  "office",
  "education",
  "other",
];
