export type DemoAppNavId =
  | "dashboard"
  | "woningaanbod"
  | "leads"
  | "bezichtigingen"
  | "taken"
  | "dossiers"
  | "communicatie"
  | "biedlogboek"
  | "publicatie"
  | "taxaties"
  | "rapportages"
  | "funda-markt";

export type DemoAppNavItem = {
  id: DemoAppNavId;
  label: string;
  segment: string;
};

export const DEMO_APP_NAV: DemoAppNavItem[] = [
  { id: "dashboard", label: "Dashboard", segment: "" },
  { id: "woningaanbod", label: "Woningaanbod", segment: "woningaanbod" },
  { id: "leads", label: "Leads & contacten", segment: "leads" },
  { id: "bezichtigingen", label: "Bezichtigingen", segment: "bezichtigingen" },
  { id: "taken", label: "Taken", segment: "taken" },
  { id: "dossiers", label: "Dossiers", segment: "dossiers" },
  { id: "communicatie", label: "E-mail & tijdlijn", segment: "communicatie" },
  { id: "biedlogboek", label: "Biedlogboek", segment: "biedlogboek" },
  { id: "publicatie", label: "Publicatie", segment: "publicatie" },
  { id: "taxaties", label: "Taxaties", segment: "taxaties" },
  { id: "rapportages", label: "Rapportages", segment: "rapportages" },
  { id: "funda-markt", label: "Funda markt", segment: "funda-markt" },
];

export function demoAppHref(slug: string, segment?: string): string {
  const base = `/demos/${slug}/app`;
  return segment ? `${base}/${segment}` : base;
}

export function demoAppNavActive(pathname: string, slug: string, segment: string): boolean {
  const base = `/demos/${slug}/app`;
  if (!segment) {
    return pathname === base || pathname === `${base}/`;
  }
  return pathname === `${base}/${segment}` || pathname.startsWith(`${base}/${segment}/`);
}
