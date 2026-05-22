import type { DemoAiInsight } from "./types";

export function buildDemoAiInsight(params: {
  businessName: string;
  regionLabel: string;
  isSchenkel?: boolean;
}): DemoAiInsight {
  const { businessName, regionLabel, isSchenkel } = params;

  if (isSchenkel) {
    return {
      agentName: "Proceda AI",
      headline: "Marktprognose & concurrentie — Zuid-West Drenthe (Q2 2026)",
      summary:
        "Op basis van Funda-data, NVM-trends en uw huidige aanbod verwacht ik voor Q2 een licht stijgende markt in Hoogeveen en omliggende dorpen. Gemiddelde verkooptijd daalt; vraagprijzen blijven stabiel met meer onder-bod-situaties bij starterswoningen.",
      generatedAt: "Vandaag 08:15 · automatische analyse",
      confidence: "hoog",
      items: [
        {
          id: "markt",
          category: "markt",
          title: "Marktprognose Q2",
          detail:
            "Verwachte omzet +12% t.o.v. Q1; 68 dagen gemiddeld op markt (−5). Starterssegment (< €300k) het snelst verkocht.",
          metric: "+12% omzet",
        },
        {
          id: "conc",
          category: "concurrentie",
          title: "Concurrentie in regio",
          detail:
            "4 actieve makelaars binnen 15 km; uw aanbod scoort +18% meer Funda-weergaven dan regionaal gemiddelde.",
          metric: "4 kantoren",
        },
        {
          id: "leads",
          category: "leads",
          title: "Leadkansen",
          detail:
            "3 warme leads wachten op opvolging; Swammerdamstraat 37 en De Plecht 56 hebben hoge conversiekans op bezichtiging.",
          metric: "3 leads",
        },
        {
          id: "advies",
          category: "advies",
          title: "Advies deze week",
          detail:
            "Plan extra bezichtigingen op vrijdagmiddag — historisch hoogste conversie. Overweeg prijsherziening Tapuitlaan na 45 dagen online.",
          metric: "Actie",
        },
      ],
    };
  }

  const city = regionLabel || "uw regio";

  return {
    agentName: "Proceda AI",
    headline: `Marktprognose & concurrentie — ${city} (Q2 2026)`,
    summary: `Voor ${businessName} in ${city} signaleert de AI-medewerker een stabiele Q2-markt: vraag blijft aanwezig in het middensegment, met lichte druk op hoger geprijsde objecten. Automatische monitoring van concurrentie-aanbod en lokale prijsontwikkelingen wordt wekelijks bijgewerkt.`,
    generatedAt: "Vandaag 08:15 · automatische analyse",
    confidence: "gemiddeld",
    items: [
      {
        id: "markt",
        category: "markt",
        title: "Marktprognose Q2",
        detail:
          "Prognose: +8–11% meer bezichtigingen; gemiddelde verkooptijd richting 64–70 dagen. Vraagprijzen vlak tot licht positief.",
        metric: "+9% volume",
      },
      {
        id: "conc",
        category: "concurrentie",
        title: "Concurrentie-analyse",
        detail: `In en rond ${city} zijn circa 5–7 makelaars actief online. Uw dashboard-aanbod presteert boven gemiddeld op website-weergaven.`,
        metric: "5–7 partijen",
      },
      {
        id: "leads",
        category: "leads",
        title: "AI leadopvolging",
        detail:
          "2 nieuwe website-leads deze week; AI stelt opvolgmail en bezichtigingsslot voor binnen 24 uur.",
        metric: "2 leads",
      },
      {
        id: "advies",
        category: "advies",
        title: "Aanbeveling",
        detail:
          "Zet AI-automatisering in op leadopvolging en taxatie-intake — bespaart ~4 uur per week per makelaar.",
        metric: "−4 u/wk",
      },
    ],
  };
}
