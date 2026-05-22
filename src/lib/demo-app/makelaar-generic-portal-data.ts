import type { DemoListingRow, MakelaarPortalData } from "./types";
import { buildDemoAiInsight } from "./ai-insight";
import {
  buildQ2Kpis,
  Q2_PIPELINE_POINTS,
  Q2_VIEWS_POINTS,
} from "./dashboard-q2-data";

const GENERIC_AGENTS = [
  { initials: "MV", name: "Mark de Vries" },
  { initials: "SB", name: "Sophie Bakker" },
  { initials: "TJ", name: "Tom Jansen" },
  { initials: "LK", name: "Laura Koning" },
] as const;

export function buildGenericMakelaarPortalData(
  listings: DemoListingRow[],
): MakelaarPortalData {
  const onderBod = listings.filter((r) => r.statusStyle === "bid").length;
  const actief = Math.max(25, listings.length + 19);
  const first = listings[0];
  const second = listings[1];
  const regionLabel = first?.city ?? listings[1]?.city ?? "uw regio";

  return {
    agents: [...GENERIC_AGENTS],
    kpis: buildQ2Kpis({
      "Woningen in aanbod": {
        value: String(actief),
        trend: "+4",
      },
      "Onder bod": {
        value: String(Math.max(onderBod, 4)),
        trend: "+2",
      },
    }),
    listings,
    activities: [
      "Bezichtiging gepland — morgen 14:00 (SB)",
      "Bod ontvangen — onder voorbehoud financiering",
      "Nieuwe lead via website",
      "Funda-sync voltooid — aanbod bijgewerkt",
      "Taxatierapport in review",
    ],
    tasks: [
      {
        id: "t1",
        title: "Taxatierapport afronden",
        due: "Vandaag",
        done: false,
        assignee: "MV",
        assigneeName: "Mark de Vries",
        property: first?.address,
        priority: "hoog",
        category: "taxatie",
      },
      {
        id: "t2",
        title: "Bezichtiging bevestigen",
        due: "Morgen",
        done: false,
        assignee: "SB",
        assigneeName: "Sophie Bakker",
        property: second?.address,
        priority: "hoog",
        category: "bezichtiging",
      },
      {
        id: "t3",
        title: "Verkoopbrochure uploaden",
        due: "Deze week",
        done: true,
        assignee: "TJ",
        assigneeName: "Tom Jansen",
        priority: "normaal",
        category: "marketing",
      },
      {
        id: "t4",
        title: "NVM-marktupdate delen",
        due: "Vrijdag",
        done: false,
        assignee: "LK",
        assigneeName: "Laura Koning",
        priority: "normaal",
        category: "marketing",
      },
    ],
    pipelinePoints: Q2_PIPELINE_POINTS,
    viewsPoints: Q2_VIEWS_POINTS,
    aiInsight: buildDemoAiInsight({
      businessName: "uw kantoor",
      regionLabel,
    }),
    leads: [
      {
        id: "lead-1",
        name: "Familie Jansen",
        type: "verkoper",
        stage: "onderhandeling",
        source: "Website",
        property: first?.address,
        agent: "MV",
        agentName: "Mark de Vries",
        email: "jansen@email.nl",
        phone: "06-12345678",
        lastContact: "Gisteren",
        score: 88,
      },
      {
        id: "lead-2",
        name: "R. Meijer",
        type: "koper",
        stage: "bezichtiging",
        source: "Funda",
        property: second?.address,
        agent: "SB",
        agentName: "Sophie Bakker",
        email: "meijer@email.nl",
        phone: "06-87654321",
        lastContact: "Vandaag",
        score: 74,
      },
    ],
    viewings: [
      {
        id: "view-1",
        date: "Morgen",
        time: "14:00",
        property: second?.address ?? "Woning A",
        city: second?.city ?? "—",
        contact: "R. Meijer",
        agent: "SB",
        agentName: "Sophie Bakker",
        status: "bevestigd",
        attendees: 2,
      },
    ],
    appraisals: [
      {
        id: "tax-1",
        address: first?.address ?? "Object 1",
        city: first?.city ?? "—",
        client: "Familie Jansen",
        status: "rapport",
        dueDate: "Vandaag",
        agent: "MV",
        agentName: "Mark de Vries",
        indicativeValue: first?.price,
      },
    ],
    reportMetrics: [
      { label: "Omzet Q2 (prognose)", value: "€ 142.800", change: "+9%", positive: true },
      { label: "Conversie lead → bezichtiging", value: "31%", change: "+2%", positive: true },
      { label: "Gem. verkooptijd", value: "72 dagen", change: "-4 dagen", positive: true },
      { label: "Funda-weergaven (30d)", value: "9.240", change: "+15%", positive: true },
    ],
    documents: [],
    sellerChecklists: [],
    emails: [],
    timeline: [
      {
        id: "tl-1",
        at: "Vandaag 09:00",
        title: "Funda-sync voltooid",
        detail: "Aanbod bijgewerkt",
        type: "sync",
      },
      {
        id: "tl-2",
        at: "Gisteren 15:30",
        title: "Nieuwe lead",
        detail: "Via website",
        type: "lead",
      },
    ],
    bidProperty: {
      listingId: listings[0]?.id ?? "listing-0",
      address: listings[0]?.address ?? "—",
      askingPrice: listings[0]?.price ?? "€ —",
      protocolCompliant: true,
      bids: [
        {
          id: "bid-1",
          amount: "€ 320.000 k.k.",
          amountNum: 320000,
          bidder: "Anoniem",
          date: "18 mei",
          status: "actief",
          financing: "Hypotheek",
        },
      ],
    },
  };
}
