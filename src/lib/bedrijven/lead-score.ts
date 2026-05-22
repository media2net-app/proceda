import type { Bedrijf, BedrijfCategory } from "./types";
import type { ServiceDetectionResult } from "./service-detection";

export type LeadQuality = "hot" | "warm" | "cold";

export type AppTypeKey =
  | "booking-portal"
  | "customer-portal"
  | "new-website"
  | "crm-dashboard"
  | "ai-assistant"
  | "ecommerce"
  | "internal-tools"
  | "other";

export type LeadScoreInput = {
  seoScore: number;
  modernityScore: number;
  usesHttps: boolean;
  extractedSnippet: string;
  fetchError?: string;
  webApplicationIdeas: string[];
  category: BedrijfCategory;
  serviceDetection?: ServiceDetectionResult;
};

export type LeadScores = {
  overallScore: number;
  leadQuality: LeadQuality;
  primaryAppType: AppTypeKey;
};

const CATEGORY_WEIGHT: Record<BedrijfCategory, number> = {
  horeca: 88,
  retail: 82,
  health: 78,
  services: 80,
  auto: 72,
  education: 70,
  office: 68,
  other: 62,
};

const DEFAULT_APP_BY_CATEGORY: Record<BedrijfCategory, AppTypeKey> = {
  horeca: "booking-portal",
  retail: "ecommerce",
  health: "customer-portal",
  services: "crm-dashboard",
  auto: "customer-portal",
  education: "customer-portal",
  office: "crm-dashboard",
  other: "new-website",
};

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/** Drempels voor leadkwaliteit (op overallScore 0–100). */
export const LEAD_QUALITY_THRESHOLDS = {
  hot: { min: 75, max: 100 },
  warm: { min: 50, max: 74 },
  cold: { min: 0, max: 49 },
} as const;

export const LEAD_SCORE_WEIGHTS = {
  websitePain: 0.48,
  categoryFit: 0.32,
  contentBonusMax: 12,
  httpsBonus: 4,
  fetchPenalty: 28,
} as const;

export function qualityFromScore(score: number): LeadQuality {
  if (score >= LEAD_QUALITY_THRESHOLDS.hot.min) return "hot";
  if (score >= LEAD_QUALITY_THRESHOLDS.warm.min) return "warm";
  return "cold";
}

function inferAppType(
  category: BedrijfCategory,
  ideas: string[],
  serviceDetection?: ServiceDetectionResult,
): AppTypeKey {
  if (serviceDetection && serviceDetection.confidence >= 2) {
    return serviceDetection.primaryAppType;
  }

  const text = ideas.join(" ").toLowerCase();
  const rules: { type: AppTypeKey; patterns: RegExp[] }[] = [
    {
      type: "ecommerce",
      patterns: [/\bwebshop\b/, /\be-commerce\b/, /\bonline bestellen\b/],
    },
    {
      type: "booking-portal",
      patterns: [
        /\breserveringsportaal\b/,
        /\btafel reserv/i,
        /\bonline boeken\b/,
        /\bafspraakportaal\b/,
      ],
    },
    {
      type: "ai-assistant",
      patterns: [/\bchatbot\b/, /\bai-assistent\b/, /\b24\/7 assistent/i],
    },
    {
      type: "crm-dashboard",
      patterns: [/\bcrm\b/, /\bsales dashboard\b/, /\bpipeline\b/],
    },
    {
      type: "customer-portal",
      patterns: [/\bklantportaal\b/, /\bmijn account\b/, /\bklantzone\b/],
    },
    {
      type: "internal-tools",
      patterns: [/\binterne tool\b/, /\bbackoffice\b/, /\bwerkplaatsportaal\b/],
    },
    {
      type: "new-website",
      patterns: [/\bnieuwe website\b/, /\bsite vervangen\b/],
    },
  ];

  for (const { type, patterns } of rules) {
    if (patterns.some((p) => p.test(text))) return type;
  }

  if (serviceDetection) return serviceDetection.primaryAppType;

  return DEFAULT_APP_BY_CATEGORY[category] ?? "other";
}

export function computeLeadScores(input: LeadScoreInput): LeadScores {
  const avgSiteQuality = (input.seoScore + input.modernityScore) / 2;
  const websitePain = 100 - avgSiteQuality;
  const categoryFit = CATEGORY_WEIGHT[input.category] ?? 65;
  const contentBonus =
    input.extractedSnippet.trim().length > 120 ? 12 : input.extractedSnippet.length > 40 ? 6 : 0;
  const httpsBonus = input.usesHttps ? 4 : 0;
  const fetchPenalty = input.fetchError ? 28 : 0;

  const raw =
    websitePain * 0.48 +
    categoryFit * 0.32 +
    contentBonus +
    httpsBonus -
    fetchPenalty;

  const overallScore = clamp(Math.round(raw), 0, 100);
  const primaryAppType = inferAppType(
    input.category,
    input.webApplicationIdeas,
    input.serviceDetection,
  );

  return {
    overallScore,
    leadQuality: qualityFromScore(overallScore),
    primaryAppType,
  };
}

export function computeLeadScoresForBusiness(
  business: Bedrijf,
  data: Omit<LeadScoreInput, "category">,
): LeadScores {
  return computeLeadScores({ ...data, category: business.category });
}
