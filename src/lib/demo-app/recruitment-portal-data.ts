import type { DemoAiInsight, RecruitmentPortalData } from "./types";
import { buildRecruitmentPortalDetails } from "./recruitment-portal-details";

function buildRecruitmentAiInsight(businessName: string): DemoAiInsight {
  return {
    agentName: "Proceda AI",
    headline: `Detachering & matching — ${businessName}`,
    summary: `AI ondersteunt intake, kandidaatprofielen en opvolging naast jullie ATS. Focus op persoonlijke matching in onderwijs, zorg, logistiek en techniek — inclusief jullie 48-uursbelofte richting werkgevers en kandidaten.`,
    generatedAt: "Vandaag 08:15 · automatische analyse",
    confidence: "hoog",
    items: [
      {
        id: "intake",
        category: "leads",
        title: "Werkgever-intake",
        detail:
          "3 nieuwe opdrachten deze week; AI vat wensen en cultuur/visie samen voor de consultant.",
        metric: "3 opdrachten",
      },
      {
        id: "match",
        category: "advies",
        title: "Matchvoorstellen",
        detail:
          "17 kandidaten met score + motivatie klaar om te beoordelen; 2 cross-sector tips (logistiek → bouw).",
        metric: "17 matches",
      },
      {
        id: "sla",
        category: "markt",
        title: "48u-opvolging",
        detail:
          "5 openstaande reacties; conceptmails staan klaar voor werkgevers en kandidaten.",
        metric: "5 open",
      },
      {
        id: "nazorg",
        category: "concurrentie",
        title: "Nazorg & retentie",
        detail:
          "2 plaatsingen in check-in-week; één signaal gemiddeld verlooprisico — consultant bellen aanbevolen.",
        metric: "2 check-ins",
      },
    ],
  };
}

/** Demo-data voor Hiebami — sectoren en propositie van hiebami.com. */
export function buildRecruitmentPortalData(
  businessName: string,
): RecruitmentPortalData {
  const kpis = [
    {
      label: "Open vacatures",
      value: "24",
      trend: "+3",
      trendUp: true,
      chartPoints: "12,14,15,16,18,19,21,22,23,24,24,24",
    },
    {
      label: "Actieve kandidaten",
      value: "186",
      trend: "+12",
      trendUp: true,
      chartPoints: "140,145,150,158,162,168,172,176,180,182,184,186",
    },
    {
      label: "Wacht op reactie (>48u)",
      value: "5",
      trend: "-2",
      trendUp: false,
      chartPoints: "9,8,8,7,7,6,6,6,5,5,5,5",
    },
    {
      label: "AI-matchvoorstellen",
      value: "17",
      trend: "+6",
      trendUp: true,
      chartPoints: "4,5,6,7,8,9,10,11,12,14,15,17",
    },
  ];

  const aiInsight = buildRecruitmentAiInsight(businessName);

  return {
    kpis,
    aiInsight,
    candidates: [
      {
        id: "c1",
        name: "Samira El Amrani",
        sector: "Zorg",
        status: "Intake gepland",
        statusStyle: "new",
        lastContact: "Vandaag",
        language: "NL B2",
        growthScore: 88,
      },
      {
        id: "c2",
        name: "Erik de Vries",
        sector: "Onderwijs",
        status: "In bemiddeling",
        statusStyle: "active",
        lastContact: "Gisteren",
        language: "NL",
        growthScore: 72,
      },
      {
        id: "c3",
        name: "Rajesh Kumar",
        sector: "Engineering",
        status: "Voorgesteld",
        statusStyle: "active",
        lastContact: "2 dagen",
        language: "EN/NL",
        growthScore: 91,
      },
      {
        id: "c4",
        name: "Fatima Hassan",
        sector: "Logistiek",
        status: "Geplaatst",
        statusStyle: "placed",
        lastContact: "1 week",
        language: "NL B1",
        growthScore: 65,
      },
      {
        id: "c5",
        name: "Kevin Jansen",
        sector: "Bouw",
        status: "Wacht op CV",
        statusStyle: "wait",
        lastContact: "3 dagen",
        language: "NL",
        growthScore: 54,
      },
    ],
    vacancies: [
      {
        id: "v1",
        title: "Helpende zorg — avonddienst",
        client: "Zorgcentrum Delft-West",
        sector: "Zorg",
        location: "Delft",
        urgency: "Hoog",
        candidates: 6,
        slaHours: 18,
      },
      {
        id: "v2",
        title: "Leerkracht ondersteuning B",
        client: "Basisschool De Veste",
        sector: "Onderwijs",
        location: "Delft",
        urgency: "Normaal",
        candidates: 4,
        slaHours: 36,
      },
      {
        id: "v3",
        title: "Magazijnmedewerker",
        client: "Logistiek Partners",
        sector: "Logistiek",
        location: "Den Haag",
        urgency: "Hoog",
        candidates: 8,
        slaHours: 12,
      },
      {
        id: "v4",
        title: "Monteur installatietechniek",
        client: "Techniek Service BV",
        sector: "Engineering",
        location: "Rijswijk",
        urgency: "Normaal",
        candidates: 3,
        slaHours: 40,
      },
    ],
    aiMatches: [
      {
        id: "m1",
        candidateName: "Samira El Amrani",
        vacancyTitle: "Helpende zorg — avonddienst",
        sector: "Zorg",
        score: 94,
        reason:
          "Ervaring thuiszorg + motivatie avonddiensten; past bij persoonlijke begeleidingslijn.",
      },
      {
        id: "m2",
        candidateName: "Rajesh Kumar",
        vacancyTitle: "Monteur installatietechniek",
        sector: "Engineering",
        score: 89,
        reason:
          "Technische achtergrond + VCA; groeipotentieel richting teamlead.",
      },
      {
        id: "m3",
        candidateName: "Erik de Vries",
        vacancyTitle: "Leerkracht ondersteuning B",
        sector: "Onderwijs",
        score: 86,
        reason:
          "Onderwijservaring + affiniteit Delft-West; beschikbaar binnen 2 weken.",
      },
    ],
    followUps: [
      {
        id: "f1",
        party: "Zorgcentrum Delft-West",
        type: "werkgever",
        waitingSince: "26 uur",
        action: "Concept shortlist + belafspraak",
        draftReady: true,
      },
      {
        id: "f2",
        party: "Kevin Jansen",
        type: "kandidaat",
        waitingSince: "52 uur",
        action: "Herinnering CV + intake koffie",
        draftReady: true,
      },
      {
        id: "f3",
        party: "Logistiek Partners",
        type: "werkgever",
        waitingSince: "14 uur",
        action: "Bevestiging gesprek morgen 10:00",
        draftReady: false,
      },
    ],
    ...buildRecruitmentPortalDetails(),
  };
}
