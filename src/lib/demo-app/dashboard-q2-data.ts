/** Gedeelde Q2 2026 demo-metrics (apr–jun) — rijkere grafiekpunten. */

/** 12 weken Q2 — pipeline verkoopwaarde (oplopend). */
export const Q2_PIPELINE_POINTS =
  "0,82 9,78 18,74 27,68 36,64 45,58 54,54 63,48 72,44 81,40 90,36 100,30";

/** 12 weken Q2 — website-bezoeken (sterke groei). */
export const Q2_VIEWS_POINTS =
  "0,94 9,88 18,82 27,76 36,70 45,64 54,56 63,50 72,44 81,38 90,32 100,26";

export type DemoKpiSeed = {
  label: string;
  value: string;
  trend: string;
  trendUp: boolean;
  chartPoints: string;
};

/** 12-punts sparklines per KPI voor Q2 2026. */
export const Q2_KPI_SEEDS: DemoKpiSeed[] = [
  {
    label: "Woningen in aanbod",
    value: "28",
    trend: "+4",
    trendUp: true,
    chartPoints:
      "0,68 9,64 18,60 27,56 36,52 45,50 54,46 63,42 72,38 81,34 90,30 100,26",
  },
  {
    label: "Onder bod",
    value: "6",
    trend: "+2",
    trendUp: true,
    chartPoints:
      "0,86 9,80 18,74 27,70 36,64 45,58 54,54 63,48 72,44 81,40 90,36 100,32",
  },
  {
    label: "Bezichtigingen (Q2)",
    value: "47",
    trend: "+22%",
    trendUp: true,
    chartPoints:
      "0,90 9,84 18,78 27,72 36,66 45,60 54,54 63,48 72,42 81,36 90,30 100,24",
  },
  {
    label: "Nieuwe leads (Q2)",
    value: "34",
    trend: "+11",
    trendUp: true,
    chartPoints:
      "0,84 9,78 18,72 27,68 36,62 45,58 54,52 63,46 72,40 81,36 90,32 100,28",
  },
  {
    label: "Taxaties lopend",
    value: "5",
    trend: "+1",
    trendUp: true,
    chartPoints:
      "0,72 9,70 18,68 27,66 36,64 45,62 54,60 63,58 72,56 81,54 90,52 100,50",
  },
  {
    label: "Gem. dagen op markt",
    value: "64",
    trend: "-6",
    trendUp: true,
    chartPoints:
      "0,48 9,44 18,46 27,42 36,44 45,40 54,38 63,36 72,34 81,32 90,30 100,28",
  },
];

export function buildQ2Kpis(overrides?: Partial<Record<string, Partial<DemoKpiSeed>>>): DemoKpiSeed[] {
  return Q2_KPI_SEEDS.map((kpi) => {
    const patch = overrides?.[kpi.label];
    return patch ? { ...kpi, ...patch } : { ...kpi };
  });
}
