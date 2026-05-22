import type { FundaOfficeRef } from "./parse-nuxt-offices";

/** Bekende NVM-kantoren in Hoogeveen (UUID = Funda agent_office_id). */
export const HOOGEVEN_OFFICE_FALLBACKS: FundaOfficeRef[] = [
  {
    numId: "4060",
    name: "Schenkel Makelaardij",
    url: "/makelaar/4060-schenkel-makelaardij/",
    uuid: "f196aa40-4342-4c47-b0d9-0486047493f0",
  },
  {
    numId: "4091",
    name: "Hentenaar Makelaardij",
    url: "/makelaar/4091-hentenaar-makelaardij/",
    uuid: "f023d293-bbe6-4ba2-b800-6b7e8b9f7f2e",
  },
  {
    numId: "4281",
    name: "Otten Makelaardij",
    url: "/makelaar/4281-otten-makelaardij/",
    uuid: "9064caad-91b9-448a-9cbb-a40d96164d64",
  },
  {
    numId: "4327",
    name: "Spang & Van Velsen Makelaardij",
    url: "/makelaar/4327-spang-en-van-velsen-makelaardij/",
    uuid: "dfffc755-b1a2-4943-a423-d098699abc3f",
  },
  {
    numId: "62219",
    name: "Huys Makelaars",
    url: "/makelaar/62219-huys-makelaars/",
    uuid: "dd068d59-1a7b-4f7a-8bac-612f037a314e",
  },
  {
    numId: "4185",
    name: "Lamberink Makelaars & Adviseurs",
    url: "/makelaar/4185-lamberink-makelaars-en-adviseurs/",
    uuid: "f3b4bdfe-7ccd-4cec-b138-d3a38ba45214",
  },
];

export function mergeOfficeRefs(
  fromPage: FundaOfficeRef[],
  fallbacks = HOOGEVEN_OFFICE_FALLBACKS,
): FundaOfficeRef[] {
  const map = new Map<string, FundaOfficeRef>();
  for (const o of fallbacks) map.set(o.numId, o);
  for (const o of fromPage) {
    const existing = map.get(o.numId);
    map.set(o.numId, {
      ...existing,
      ...o,
      name: o.name.startsWith("Makelaar ") && existing ? existing.name : o.name,
    });
  }
  return [...map.values()];
}

export function isOwnOfficeName(name: string): boolean {
  return /schenkel/i.test(name);
}
