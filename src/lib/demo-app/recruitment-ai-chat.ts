export type RecruitmentChatContext =
  | { kind: "match"; id: string }
  | { kind: "candidate"; id: string }
  | { kind: "vacancy"; id: string }
  | { kind: "followup"; id: string };

export type RecruitmentChatPrompt = {
  id: string;
  label: string;
};

export type RecruitmentChatExchange = {
  promptId: string;
  question: string;
  answer: string;
};

const MATCH_ANSWERS: Record<string, Record<string, string>> = {
  m1: {
    score: `De totaalscore van 94% is een gewogen gemiddelde van vier factoren:

• Vakinhoud & certificaten (35%) → 96% — helpende zorg + medicatiebegeleiding
• Beschikbaarheid (25%) → 92% — per direct, avond OK, 22 min reistijd
• Cultuurfit (25%) → 94% — intake: "persoonlijke benadering" ↔ Samira's profiel
• Taal (15%) → 78% — B2 schriftelijk; mondelinge check bij intake

Zonder zwarte doos: elke factor is traceerbaar naar CV, intake-transcript en responsgedrag.`,
    risks: `Belangrijkste risico's voor deze match:

1. Taal NL mondeling B1+ is verplicht — Samira heeft B2 schriftelijk; plan een korte telefonische check in de intake.
2. Geen blokkerende factoren op certificaten of beschikbaarheid.

Na geslaagde taalcheck kan de consultant de score in één klik naar ~97% zetten.`,
    improve: `Advies om de match te versterken vóór shortlist:

• Plan intake deze week (werkgever verwacht shortlist).
• Noteer mondeling taalniveau in dossier → +3% op taalfactor.
• Voeg motivatie toe aan ATS met de gegenereerde concepttekst.

De AI-motivatie is al afgestemd op Sandra (contactpersoon) en het gesprek van dinsdag.`,
    compare: `Vergelijking met andere kandidaten op deze vacature:

• Samira — 94% (top) — thuiszorg + avond
• Tweede in shortlist — nog niet gedeeld; AI wacht op jouw feedback na gesprek

Op poolniveau voldoen 4 van 6 kandidaten aan certificaat-eis; Samira scoort het hoogst op cultuurfit.`,
  },
  m2: {
    score: `Rajesh scoort 89% op monteur installatietechniek:

• Techniek & VCA (40%) → 95%
• Beschikbaarheid (20%) → 100%
• Groeipad teamlead (20%) → 88%
• Salarisband (20%) → 72% — bespreek vóór gesprek

Werkgever heeft zijn profiel al bekeken (tracking in ATS).`,
    risks: `Risico: salarisverwachting aan bovenkant bandbreedte. Geen issues op VCA of beschikbaarheid.`,
    improve: `Bel eerst salarisverwachting uit, daarna technische proefdag voorstellen.`,
    compare: `3 kandidaten in pool; Rajesh is #1 op techniek, #2 op salarisrisico.`,
  },
  m3: {
    score: `Erik scoort 86% voor De Veste:

• Onderwijservaring (45%) → 90%
• Timing start over 2 weken (30%) → 80%
• Regio Delft (25%) → 88%

Motivatiebrief bevat dezelfde terminologie als schoolvisie "samen groeien".`,
    risks: `Start pas over 2 weken — check of school echt kan wachten (nu: past).`,
    improve: `Plan kennismaking direct na meivakantie-rooster bekend is.`,
    compare: `4 kandidaten op vacature; Erik beste cultuurfit, niet de snelste start.`,
  },
};

const CANDIDATE_ANSWERS: Record<string, Record<string, string>> = {
  c1: {
    match: `Topmatch: Helpende zorg avonddienst bij Zorgcentrum Delft-West (94%).

AI-baseert dit op certificaten, avond beschikbaarheid en cultuurfit met het intake-gesprek van de werkgever.`,
    intake: `Voorstel intake-vragen (AI gegenereerd):

1. Bevestig mondeling Nederlands (B2 schriftelijk bekend).
2. Avonddiensten: structureel of incidenteel?
3. Ervaring medicatiebegeleiding onder supervisie — concreet voorbeeld.
4. Reistijd Delft-West 22 min — acceptabel in winterdiensten?`,
    risks: `Aandachtspunten: taal mondeling checken; reistijd 22 min is acceptabel maar benoemen.`,
    growth: `Groeipotentieel 88%: hoge betrouwbaarheid en respons op mails (gem. 4u). AI verwacht goede retentie na plaatsing.`,
  },
  c5: {
    match: `Geen actieve match — CV ontbreekt. AI kan pas matchen na upload.

Wel: 2 eerdere reacties op bouw-vacatures in gedragssignaal.`,
    intake: `Stuur eerst CV-herinnering (concept klaar, 52u SLA). Daarna koffie-intake Delft 20 min.`,
    risks: `Hoog SLA-risico: 52u zonder reactie. Prioriteit vandaag bellen of conceptmail.`,
    growth: `Groeipotentieel 54% — laag door ontbrekend dossier; stijgt naar ~70% na CV.`,
  },
};

const VACANCY_ANSWERS: Record<string, Record<string, string>> = {
  v1: {
    intake: `AI-samenvatting intake (18 min):

Werkgever wil persoonlijke benadering boven snelheid. Avond 16:00–22:00. Team 8 FTE, turnover vorig kwartaal hoog → retentie belangrijk.

3 harde eisen geparsed; 4 kandidaten voldoen aan certificaat.`,
    shortlist: `Huidige AI-shortlist:

1. Samira El Amrani — 94% — aanbevolen voor gesprek
2. Rajesh Kumar — cross-check logistiek profiel (minder fit, 62% op deze vacature)

Actie: shortlist delen met Sandra vóór vrijdag.`,
    eisen: `Eisen vs pool:

• Helpende zorg certificaat — 4/6
• NL mondeling B1+ — 5/6 (1 mondelinge check nodig)
• Avond beschikbaar — 3/6
• Ervaring thuiszorg — 2/6 (nice-to-have)`,
  },
};

const FOLLOWUP_ANSWERS: Record<string, Record<string, string>> = {
  f1: {
    personalize: `Personalisatie in conceptmail:

• Voornaam Sandra uit CRM
• Verwijzing intake dinsdag
• Topmatch Samira met korte motivatie (94%)
• CTA belafspraak morgen 10:30`,
    tone: `Toon is zakelijk-warm — past bij zorgsector en eerdere mailwisseling. Wil je formeler: AI kan "u" en kortere alinea's gebruiken.`,
  },
  f2: {
    personalize: `Kevin: informele toon (WhatsApp-contact), bouw-opdracht Den Haag genoemd, koffie Delft voorgesteld.`,
    tone: `Kort en vriendelijk — geen corporate taal. SLA overschreden: onderwerp benadrukt CV zonder druk.`,
  },
};

const DEFAULT_PROMPTS: Record<RecruitmentChatContext["kind"], RecruitmentChatPrompt[]> = {
  match: [
    { id: "score", label: "Waarom deze score?" },
    { id: "risks", label: "Wat zijn de risico's?" },
    { id: "improve", label: "Hoe verbeter ik de match?" },
    { id: "compare", label: "Vergelijk kandidaten" },
  ],
  candidate: [
    { id: "match", label: "Beste vacatures?" },
    { id: "intake", label: "Intake-vragen" },
    { id: "risks", label: "Aandachtspunten" },
    { id: "growth", label: "Groeipotentieel?" },
  ],
  vacancy: [
    { id: "intake", label: "Samenvatting intake" },
    { id: "shortlist", label: "Shortlist advies" },
    { id: "eisen", label: "Eisen vs pool" },
  ],
  followup: [
    { id: "personalize", label: "Wat is gepersonaliseerd?" },
    { id: "tone", label: "Past de toon?" },
  ],
};

export function getRecruitmentChatPrompts(
  context: RecruitmentChatContext,
): RecruitmentChatPrompt[] {
  return DEFAULT_PROMPTS[context.kind];
}

const GENERIC: Record<string, string> = {
  score:
    "De score weegt vakinhoud, beschikbaarheid, cultuurfit en taal. Open de score-opbouw voor percentages per factor.",
  risks:
    "AI heeft geen blokkerende risico's gevonden; check dossier op taal, beschikbaarheid en salarisverwachting.",
  improve:
    "Plan intake of werkgevercontact, werk conceptmail bij en sync naar ATS na goedkeuring.",
  compare:
    "Vergelijk via de shortlist op de vacaturepagina — AI rangschikt op gewogen factoren.",
  match:
    "Zie tab Matches of AI matching voor gekoppelde vacatures met motivatie en score.",
  intake:
    "Intake-vragen worden gegenereerd uit CV, vacature-eisen en eerdere gesprekken.",
  growth:
    "Groeipotentieel combineert retentie-signalen, respons op mail en sectorervaring.",
  personalize:
    "Conceptmail gebruikt CRM-naam, recente touchpoints en topmatch uit het dossier.",
  tone: "Toon is afgestemd op sector en eerdere communicatie — gebruik 'Herschrijf' voor formeler/informeler.",
};

export function getRecruitmentChatAnswer(
  context: RecruitmentChatContext,
  promptId: string,
): string | null {
  const table =
    context.kind === "match"
      ? MATCH_ANSWERS[context.id]
      : context.kind === "candidate"
        ? CANDIDATE_ANSWERS[context.id]
        : context.kind === "vacancy"
          ? VACANCY_ANSWERS[context.id]
          : FOLLOWUP_ANSWERS[context.id];

  return table?.[promptId] ?? GENERIC[promptId] ?? null;
}
