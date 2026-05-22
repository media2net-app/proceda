import type { Bedrijf } from "./types";
import type { ProcedaAiAnalysis } from "./business-report-types";
import type { ServiceDetectionResult } from "./service-detection";
import type { WebsiteScanResult } from "./website-scan";
import type { AppTypeKey } from "./lead-score";

const CATEGORY_CONTEXT: Record<string, string> = {
  horeca: "horeca (restaurant, café, catering)",
  retail: "retail en winkel",
  services: "dienstverlening",
  health: "gezondheidszorg",
  auto: "automotive",
  education: "onderwijs en training",
  office: "kantoor en zakelijke diensten",
  other: "algemene bedrijfsdienstverlening",
};

const APP_IDEA_TEMPLATES: Record<AppTypeKey, string> = {
  "booking-portal":
    "Online reserverings- en afsprakenportaal gekoppeld aan agenda en bevestigingsmails.",
  "customer-portal":
    "Klantportaal met self-service, documenten en persoonlijke gegevens — minder telefoontjes.",
  ecommerce:
    "Webshop of online catalogus met voorraad, bestellingen en betalingen.",
  "crm-dashboard":
    "CRM-dashboard voor leads, offertes en opvolging — alles in één overzicht.",
  "ai-assistant":
    "AI-assistent op de website voor FAQ, intake en doorverwijzing naar het juiste team.",
  "internal-tools":
    "Interne webapp voor planning, werkorders en team — vervangt Excel en mail.",
  "new-website":
    "Moderne website/webapp die vertrouwen wekt en conversie verhoogt (mobiel-first).",
  other: "Maatwerk webapplicatie afgestemd op de kernactiviteit van het bedrijf.",
};

function fallbackAnalysis(
  business: Bedrijf,
  scan: WebsiteScanResult,
  services: ServiceDetectionResult,
): ProcedaAiAnalysis {
  const sector = CATEGORY_CONTEXT[business.category] ?? "bedrijf";
  const snippet =
    scan.extractedSnippet ||
    scan.metaDescription ||
    `Website van ${business.name} in ${business.city}.`;

  const primaryIdea = `${APP_IDEA_TEMPLATES[services.primaryAppType]} (${services.servicesSummary}).`;

  const webApplicationIdeas = [
    primaryIdea,
    `Procesdashboard voor ${business.name}: inzicht in aanvragen, omzet en teamtaken.`,
    `Mobiel-vriendelijke front-end die aansluit op wat bezoekers nu op de site zoeken (SEO ${scan.seoScore}/100).`,
  ];

  const automationOpportunities = [
    "Automatische bevestigingsmails en herinneringen na formulieren of afspraken.",
    "Koppeling website → CRM/boekhouding zodat gegevens niet dubbel worden ingevoerd.",
    "AI-assistent voor veelgestelde vragen en eerste intake van aanvragen.",
    "Meldingen bij nieuwe leads of afwijkende KPI's voor de eigenaar.",
  ];

  const processImprovements = [
    "Eén overzicht van alle aanvragen en opvolging i.p.v. losse e-mails.",
    "Standaard workflows voor offerte, akkoord en nazorg.",
    "Koppeling met bestaande tools (mail, agenda, boekhouding) waar het team nu handmatig schakelt.",
  ];

  const proposalEmailDraft = `Beste ${business.name},

We hebben uw website (${scan.url}) bekeken. U bent vooral actief in: ${services.servicesSummary}.

Proceda bouwt maatwerk webapplicaties — geen standaard templates. Op basis van uw diensten zien wij concreet:
• ${primaryIdea}
• ${automationOpportunities[0]}

Graag plannen we een vrijblijvend gesprek van 30 minuten.

Met vriendelijke groet,
Proceda`;

  return {
    companySummary: `${business.name} (${services.servicesSummary}) in ${business.city}. ${sector}.`,
    servicesOffered: snippet.slice(0, 600),
    webApplicationIdeas,
    automationOpportunities,
    processImprovements,
    proposalEmailDraft,
    generatedAt: new Date().toISOString(),
    model: "proceda-template",
  };
}

export async function generateProcedaAnalysis(
  business: Bedrijf,
  scan: WebsiteScanResult,
  services: ServiceDetectionResult,
): Promise<ProcedaAiAnalysis> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return fallbackAnalysis(business, scan, services);
  }

  const sector = CATEGORY_CONTEXT[business.category] ?? business.category;
  const navHint =
    scan.navTexts.length > 0
      ? `Menu/navigatie: ${scan.navTexts.slice(0, 15).join(" | ")}`
      : "";

  const prompt = `Je bent sales consultant bij Proceda (maatwerk webapplicaties, Next.js/React, AI & procesautomatisering in Nederland).

Analyseer wat dit bedrijf ECHT verkoopt/doet op basis van de website — niet standaard aannemen dat het horeca/reserveringen is.

Antwoord ALLEEN met geldig JSON (geen markdown):
{
  "companySummary": "2-3 zinnen Nederlands",
  "servicesOffered": "concrete diensten/producten van dit bedrijf, op basis van site",
  "primaryAppType": "één van: booking-portal, customer-portal, new-website, crm-dashboard, ai-assistant, ecommerce, internal-tools, other",
  "webApplicationIdeas": ["3-5 maatwerk app-ideeën die passen bij de ECHTE diensten — geen generiek boekingssysteem tenzij relevant"],
  "automationOpportunities": ["3-5 AI/automatisering kansen"],
  "processImprovements": ["3-4 procesverbeteringen"],
  "proposalEmailDraft": "volledige Nederlandse e-mail, 150-220 woorden"
}

Bedrijf: ${business.name}
Google-type: ${business.subcategory}
Branche: ${sector}
Gedetecteerde diensten (heuristiek): ${services.servicesSummary}
Voorgesteld app-type (heuristiek): ${services.primaryAppType}
Plaats: ${business.city}, ${business.province}
Website: ${scan.url}
Paginatitel: ${scan.pageTitle ?? "—"}
Meta: ${scan.metaDescription ?? "—"}
${navHint}
Website-tekst: ${scan.extractedSnippet.slice(0, 1800)}
SEO: ${scan.seoScore}/100, Moderniteit: ${scan.modernityScore}/100`;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "Je analyseert Nederlandse MKB-websites en stelt passende maatwerk apps voor. Gebruik primaryAppType die past bij de werkelijke diensten. Antwoord alleen met JSON.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.5,
        response_format: { type: "json_object" },
      }),
      signal: AbortSignal.timeout(90000),
    });

    if (!res.ok) {
      console.warn("[ai] OpenAI error", await res.text());
      return fallbackAnalysis(business, scan, services);
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) return fallbackAnalysis(business, scan, services);

    const parsed = JSON.parse(content) as Omit<
      ProcedaAiAnalysis,
      "generatedAt" | "model"
    > & { primaryAppType?: AppTypeKey };

    return {
      companySummary: parsed.companySummary,
      servicesOffered: parsed.servicesOffered,
      webApplicationIdeas: parsed.webApplicationIdeas ?? [],
      automationOpportunities: parsed.automationOpportunities ?? [],
      processImprovements: parsed.processImprovements ?? [],
      proposalEmailDraft: parsed.proposalEmailDraft,
      generatedAt: new Date().toISOString(),
      model: process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini",
    };
  } catch (e) {
    console.warn("[ai] failed:", e);
    return fallbackAnalysis(business, scan, services);
  }
}
