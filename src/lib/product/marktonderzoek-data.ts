export type FeaturePriority = "must" | "should" | "could";

export type MarktonderzoekFeature = {
  id: string;
  title: string;
  description: string;
  priority: FeaturePriority;
  /** Waar makelaars dit vandaag oplossen */
  marketRefs?: string[];
  /** Al in Proceda-demo of pipeline */
  procedaStatus?: "demo" | "planned" | "gap";
};

export type MarktonderzoekModule = {
  id: string;
  title: string;
  summary: string;
  features: MarktonderzoekFeature[];
};

export type MarktonderzoekInsight = {
  title: string;
  body: string;
};

export const MARKTONDERZOEK_META = {
  title: "Marktonderzoek — Makelaarsportaal",
  subtitle:
    "Wat Nederlandse makelaars echt nodig hebben in één webapplicatie, op basis van marktleiders (Realworks, Kolibri), NVM-regelgeving en onze demo’s.",
  updatedAt: "2026-05-22",
  sources: [
    { name: "Realworks CRM + Move.nl", url: "https://www.realworks.nl/" },
    { name: "Kolibri CRM", url: "https://kolibri.software/crm/" },
    { name: "NVM Biedlogboek & protocol", url: "https://www.nvm.nl/wonen/biedlogboek/" },
    { name: "Proceda makelaars-demo", url: "/demos/schenkel-makelaardij/app" },
  ],
};

export const MARKTONDERZOEK_INSIGHTS: MarktonderzoekInsight[] = [
  {
    title: "Eén systeem van lead tot overdracht",
    body: "Makelaars willen geen losse tools meer: CRM, agenda, objecten, documenten en klantportaal moeten dezelfde tijdlijn en status delen. Realworks positioneert dit expliciet; Kolibri automatiseert dagelijkse taken in hetzelfde scherm.",
  },
  {
    title: "Klantportaal is geen luxe meer",
    body: "Verkopers vullen vragenlijsten en documenten in (Jouwmakelaar.online); kopers volgen bezichtigingen en biedingen (Move.nl). Het portaal moet gekoppeld zijn aan het kantoor-CRM, niet een losse link.",
  },
  {
    title: "Compliance wordt product",
    body: "Digitaal biedlogboek (verplicht voor branche-aangesloten makelaars), NVM Protocol Transparant Bieden (feb 2026), Wwft-checks en eHerkenning voor Kadaster — dit hoort in de workflow, niet als aparte checklist.",
  },
  {
    title: "Publicatie & sync zijn kritisch",
    body: "Funda/Tiara, eigen website en NVM-uitwisseling moeten vanuit het objectbeheer met één klik (of geautomatiseerd). Fouten in publicatiestatus kosten direct zichtbaarheid en leads.",
  },
  {
    title: "Mobiel = buiten op pad",
    body: "Bezichtigingen, eindinspecties, sleutels en notities gebeuren op locatie. Kantoor en app moeten realtime syncen — anders belt de makelaar ’s avonds alsnog naar kantoor.",
  },
  {
    title: "Proceda-kans: modern & AI-first",
    body: "Incumbenten zijn volledig maar zwaar en duur. Kleinere kantoren en ongebonden makelaars zoeken een lichter portaal met sterke dashboards, AI-leads en snelle onboarding — precies waar onze demo en outreach al op inspelen.",
  },
];

export const MARKTONDERZOEK_MODULES: MarktonderzoekModule[] = [
  {
    id: "core",
    title: "Kern — dagelijks werk",
    summary: "Minimaal viable makelaarsportaal: waar elke makelaar elke ochtend begint.",
    features: [
      {
        id: "dashboard",
        title: "Team-dashboard & KPI’s",
        description:
          "Woningen in aanbod, onder bod, bezichtigingen, leads, taxaties lopend, gemiddelde dagen op markt — per makelaar en kantoor.",
        priority: "must",
        marketRefs: ["Realworks", "Kolibri"],
        procedaStatus: "demo",
      },
      {
        id: "listings",
        title: "Woningaanbod / objectbeheer",
        description:
          "Adres, status (nieuw / te koop / onder bod / verkocht), prijs, dagen op markt, toegewezen makelaar, foto’s, zoekfilters.",
        priority: "must",
        marketRefs: ["Realworks", "Kolibri", "Funda/Tiara"],
        procedaStatus: "demo",
      },
      {
        id: "crm",
        title: "Relaties & leads",
        description:
          "Verkopers, kopers, zoekers en prospects met kenmerken, bron (website/Funda), stadium in pipeline en volledige communicatiehistorie.",
        priority: "must",
        marketRefs: ["Realworks CRM", "Kolibri prospectbeheer"],
        procedaStatus: "demo",
      },
      {
        id: "agenda",
        title: "Agenda & bezichtigingen",
        description:
          "Plannen, bevestigingen, herinneringen; gekoppeld aan woning én relatie; zichtbaar in tijdlijn en mobiel.",
        priority: "must",
        marketRefs: ["Kolibri agenda", "Realworks agenda"],
        procedaStatus: "demo",
      },
      {
        id: "tasks",
        title: "Taken & activiteitenfeed",
        description:
          "Interne to-do’s (taxatierapport, brochure, NVM-update) plus automatische feed (bod ontvangen, lead, sync voltooid).",
        priority: "must",
        marketRefs: ["Kolibri taakbeheer", "Realworks To-Do"],
        procedaStatus: "demo",
      },
    ],
  },
  {
    id: "sales",
    title: "Verkoopproces",
    summary: "Van intake verkoper tot overdracht — inclusief transparant bieden.",
    features: [
      {
        id: "seller-portal",
        title: "Verkoper-portaal (documenten & vragenlijst)",
        description:
          "Verkoper vult NVM-vragenlijst, lijst van zaken en documenten in op eigen domein/huisstijl; makelaar ziet voortgang in dossier.",
        priority: "must",
        marketRefs: ["Jouwmakelaar.online", "Move.nl verkoper"],
        procedaStatus: "demo",
      },
      {
        id: "contracts",
        title: "Verkoopovereenkomst & contracten",
        description:
          "Standaard NVM / Vastgoed Nederland / VEH-overeenkomsten genereren, versies beheren, koppeling met object en partijen.",
        priority: "must",
        marketRefs: ["Kolibri contractbeheer"],
        procedaStatus: "gap",
      },
      {
        id: "esign",
        title: "Digitaal ondertekenen",
        description:
          "Integratie Signhost, Zynyo of CM Sign; getekende PDF’s terug in dossier en tijdlijn.",
        priority: "should",
        marketRefs: ["Kolibri", "Realworks"],
        procedaStatus: "demo",
      },
      {
        id: "bid-log",
        title: "Biedlogboek (NVM-protocol)",
        description:
          "Alle biedingen vastleggen, na afloop transparant voor verkoper en bieders; audittrail; aansluiting Protocol Transparant Bieden.",
        priority: "must",
        marketRefs: ["Move.nl biedlogboek", "NVM"],
        procedaStatus: "demo",
      },
      {
        id: "viewing-dossier",
        title: "Bezichtigingsdossier / woondossier",
        description:
          "Digitale map voor bezichtigers: woninginfo, omgeving, energielabel, eventueel klimaatrisico’s — verstuurd na afspraak.",
        priority: "should",
        marketRefs: ["Kolibri Woondossier"],
        procedaStatus: "gap",
      },
    ],
  },
  {
    id: "data",
    title: "Data, publicatie & integraties",
    summary: "Zonder uitwisseling geen aanbod; zonder documenten geen verkoop.",
    features: [
      {
        id: "funda-sync",
        title: "Funda / Tiara / website-publicatie",
        description:
          "Object publiceren, status en fouten inzichtelijk, sync naar eigen site; responses als leads in CRM.",
        priority: "must",
        marketRefs: ["Realworks", "Kolibri"],
        procedaStatus: "demo",
      },
      {
        id: "documents",
        title: "Dossier- & documentbeheer",
        description:
          "Upload, preview (PDF/Word/beeld), versies, mappen per woning/relatie; Kadaster-uittreksel via eHerkenning.",
        priority: "must",
        marketRefs: ["Kolibri dossiers", "Realworks"],
        procedaStatus: "demo",
      },
      {
        id: "email",
        title: "Geïntegreerde e-mail",
        description:
          "Mail vanuit relatie/woning; templates; correspondentie automatisch in tijdlijn.",
        priority: "should",
        marketRefs: ["Realworks mail", "Kolibri e-mail"],
        procedaStatus: "demo",
      },
      {
        id: "keys",
        title: "Sleutelbeheer",
        description:
          "Uitgifte, inname, wie heeft welke sleutel — gekoppeld aan bezichtigingen.",
        priority: "could",
        marketRefs: ["Kolibri"],
        procedaStatus: "gap",
      },
    ],
  },
  {
    id: "compliance",
    title: "Compliance & vertrouwen",
    summary: "Regelgeving die makelaars niet kunnen overslaan.",
    features: [
      {
        id: "wwft",
        title: "Wwft & digitale identificatie",
        description:
          "Cliëntonderzoek en ID-checks ingebouwd in verkoop- en aankoopflow (zoals Move.nl + Realworks).",
        priority: "must",
        marketRefs: ["Realworks", "Move.nl"],
        procedaStatus: "gap",
      },
      {
        id: "inspection",
        title: "Inspectie- & eindinspectieformulieren",
        description:
          "Digitaal invullen op locatie (mobiel), foto’s, ondertekening, archief in dossier.",
        priority: "should",
        marketRefs: ["Kolibri app"],
        procedaStatus: "gap",
      },
    ],
  },
  {
    id: "valuation",
    title: "Taxaties & advies",
    summary: "Aparte workflow naast verkoop, vaakzelfde kantoor.",
    features: [
      {
        id: "appraisals",
        title: "Taxatie-opdrachten",
        description:
          "Lopende taxaties, deadlines, rapport opleveren, koppeling aan object en opdrachtgever.",
        priority: "should",
        marketRefs: ["Realworks taxaties"],
        procedaStatus: "demo",
      },
      {
        id: "market-data",
        title: "Woningmarktcijfers & NVM-data",
        description:
          "Referentieprijzen, buurtstatistieken, marktupdates delen met team en klant.",
        priority: "should",
        marketRefs: ["Kolibri woningmarktcijfers", "NVM"],
        procedaStatus: "gap",
      },
    ],
  },
  {
    id: "growth",
    title: "Groei, marketing & AI",
    summary: "Differentiatie en efficiency — waar Proceda kan winnen.",
    features: [
      {
        id: "reports",
        title: "Rapportages & pipeline-waarde",
        description:
          "Verkoopwaarde in pipeline, website-bezoeken per object, conversie leads → bezichtiging → bod.",
        priority: "should",
        marketRefs: ["Kolibri dashboards", "Realworks"],
        procedaStatus: "demo",
      },
      {
        id: "marketing",
        title: "Marketing & buurtmail",
        description:
          "Segmentatie op kenmerken, gepersonaliseerde mail/print, campagnebudget.",
        priority: "could",
        marketRefs: ["Realworks buurtmail"],
        procedaStatus: "gap",
      },
      {
        id: "ai-assistant",
        title: "AI-assistent",
        description:
          "Notities samenvatten, e-mailconcepten, lead-scoring, automatische opvolg-suggesties — differentiator t.o.v. legacy CRM.",
        priority: "should",
        marketRefs: ["Kolibri ChatGPT"],
        procedaStatus: "demo",
      },
      {
        id: "proceda-outreach",
        title: "Proceda: lead-intelligence & demo-generatie",
        description:
          "Website-scan, SEO/moderniteitsscore, auto-demo homepage + makelaarsportaal voor salesgesprek — uniek in de markt.",
        priority: "should",
        marketRefs: ["Proceda platform"],
        procedaStatus: "demo",
      },
    ],
  },
];

export function countFeaturesByPriority() {
  const counts = { must: 0, should: 0, could: 0, demo: 0, planned: 0, gap: 0 };
  for (const mod of MARKTONDERZOEK_MODULES) {
    for (const f of mod.features) {
      counts[f.priority]++;
      if (f.procedaStatus === "demo") counts.demo++;
      else if (f.procedaStatus === "planned") counts.planned++;
      else if (f.procedaStatus === "gap") counts.gap++;
    }
  }
  return counts;
}
