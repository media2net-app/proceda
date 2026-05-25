import { businessIdToDemoSlug } from "@/lib/bedrijven/demo-slug";

/** Vaste lead-id uit recruitment-batch (Hiebami). */
export const HIEBAMI_BUSINESS_ID = "browser/d82758eef56945a7748c";

/** Vriendelijke slug + browser-lead slug. */
export const HIEBAMI_DEMO_SLUGS = [
  "hiebami",
  businessIdToDemoSlug(HIEBAMI_BUSINESS_ID),
] as const;
