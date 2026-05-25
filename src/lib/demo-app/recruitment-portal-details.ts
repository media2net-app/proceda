import type {
  RecruitmentCandidateDetail,
  RecruitmentFollowUpDetail,
  RecruitmentMatchDetail,
  RecruitmentPortalData,
  RecruitmentVacancyDetail,
} from "./types";

export function buildRecruitmentPortalDetails(): Pick<
  RecruitmentPortalData,
  "candidateDetails" | "vacancyDetails" | "matchDetails" | "followUpDetails"
> {
  const candidateDetails: Record<string, RecruitmentCandidateDetail> = {
    c1: {
      id: "c1",
      name: "Samira El Amrani",
      sector: "Zorg",
      status: "Intake gepland",
      statusStyle: "new",
      lastContact: "Vandaag",
      language: "NL B2",
      growthScore: 88,
      email: "s.elamrani@email.nl",
      phone: "06-12345678",
      availability: "Per direct · avonddiensten voorkeur",
      experienceYears: 4,
      aiSummary:
        "Samira combineert 4 jaar thuiszorg met sterke motivatie voor avonddiensten. AI signaleert hoge betrouwbaarheid en past bij de persoonlijke begeleidingslijn van Zorgcentrum Delft-West.",
      aiStrengths: [
        "Certificaat helpende zorg + medicatiebegeleiding",
        "Eerdere plaatsing in vergelijkbare setting",
        "Hoge respons op opvolgmails (gem. 4u)",
      ],
      aiRisks: [
        "Taalniveau B2 — check mondeling bij intake",
        "Reistijd 22 min buiten piek (acceptabel)",
      ],
      skills: [
        { label: "Zorgervaring", score: 92, note: "Thuiszorg + dagbesteding" },
        { label: "Betrouwbaarheid", score: 95 },
        { label: "Taal NL", score: 78 },
        { label: "Avond beschikbaar", score: 90 },
        { label: "Teamfit cultuur", score: 86 },
      ],
      topMatchIds: ["m1"],
      timeline: [
        {
          id: "t1",
          at: "Vandaag 09:12",
          title: "AI-profiel verrijkt",
          detail: "CV + intake-notities samengevoegd tot één consultant-dossier.",
          aiGenerated: true,
        },
        {
          id: "t2",
          at: "Gisteren 16:40",
          title: "Reactie op vacature-link",
          detail: "Interesse bevestigd voor avonddienst Delft-West.",
        },
        {
          id: "t3",
          at: "3 dagen geleden",
          title: "Eerste contact",
          detail: "Via website — 48u-belofte: terugbel binnen 26u (ingehouden).",
        },
      ],
      consultantNote:
        "Prioriteit: intake inplannen vóór vrijdag; werkgever verwacht shortlist.",
    },
    c2: {
      id: "c2",
      name: "Erik de Vries",
      sector: "Onderwijs",
      status: "In bemiddeling",
      statusStyle: "active",
      lastContact: "Gisteren",
      language: "NL",
      growthScore: 72,
      email: "erik.devries@email.nl",
      phone: "06-23456789",
      availability: "Over 2 weken",
      experienceYears: 6,
      aiSummary:
        "Ervaren onderwijsondersteuner met affiniteit voor basisonderwijs in Delft. AI adviseert focus op De Veste — sterke culturele match met schoolvisie.",
      aiStrengths: ["6 jaar IB-ondersteuning", "VCA niet nodig — direct inzetbaar"],
      aiRisks: ["Start pas over 2 weken — check urgentie opdracht"],
      skills: [
        { label: "Onderwijservaring", score: 88 },
        { label: "Pedagogiek", score: 82 },
        { label: "Beschikbaarheid", score: 65 },
        { label: "Regio Delft", score: 90 },
      ],
      topMatchIds: ["m3"],
      timeline: [
        {
          id: "t1",
          at: "Gisteren 11:00",
          title: "Gesprek consultant",
          detail: "Motivatiebrief goedgekeurd voor De Veste.",
        },
      ],
      consultantNote: "Werkgever wil kennismaking volgende week.",
    },
    c3: {
      id: "c3",
      name: "Rajesh Kumar",
      sector: "Engineering",
      status: "Voorgesteld",
      statusStyle: "active",
      lastContact: "2 dagen",
      language: "EN/NL",
      growthScore: 91,
      email: "rajesh.k@email.nl",
      phone: "06-34567890",
      availability: "Per direct",
      experienceYears: 8,
      aiSummary:
        "Technisch profiel met VCA en groeipad richting teamlead. AI matcht sterk op installatietechniek Rijswijk.",
      aiStrengths: ["VCA VOL", "Meertalig EN/NL", "Groeipotentieel teamlead"],
      aiRisks: ["Salarisverwachting aan bovenkant bandbreedte"],
      skills: [
        { label: "Techniek", score: 94 },
        { label: "VCA", score: 100 },
        { label: "Taal", score: 85 },
        { label: "Leiderschap", score: 78 },
      ],
      topMatchIds: ["m2"],
      timeline: [
        {
          id: "t1",
          at: "2 dagen geleden",
          title: "Shortlist gedeeld",
          detail: "Werkgever Techniek Service BV heeft profiel geopend.",
          aiGenerated: true,
        },
      ],
      consultantNote: "Volgende stap: technische proefdag voorstellen.",
    },
    c4: {
      id: "c4",
      name: "Fatima Hassan",
      sector: "Logistiek",
      status: "Geplaatst",
      statusStyle: "placed",
      lastContact: "1 week",
      language: "NL B1",
      growthScore: 65,
      email: "f.hassan@email.nl",
      phone: "06-45678901",
      availability: "—",
      experienceYears: 3,
      aiSummary: "Geplaatst bij Logistiek Partners. AI nazorg: check-in week 2 — tevredenheid stabiel.",
      aiStrengths: ["Plaatsing succesvol afgerond"],
      aiRisks: ["Taal B1 — nazorg focus communicatie werkplek"],
      skills: [
        { label: "Magazijn", score: 80 },
        { label: "Nazorg signaal", score: 70 },
      ],
      topMatchIds: [],
      timeline: [
        {
          id: "t1",
          at: "1 week geleden",
          title: "Startdatum bevestigd",
          detail: "Contract getekend — nazorg ingepland.",
        },
      ],
      consultantNote: "Belcheck gepland over 3 dagen.",
    },
    c5: {
      id: "c5",
      name: "Kevin Jansen",
      sector: "Bouw",
      status: "Wacht op CV",
      statusStyle: "wait",
      lastContact: "3 dagen",
      language: "NL",
      growthScore: 54,
      email: "kevin.jansen@email.nl",
      phone: "06-56789012",
      availability: "Onbekend",
      experienceYears: 2,
      aiSummary:
        "Potentieel bouwprofiel maar ontbrekend CV blokkeert matching. AI heeft concept-herinnering klaarstaan (>48u SLA).",
      aiStrengths: ["Eerdere reactie op bouw-vacatures"],
      aiRisks: ["Geen CV", "52u zonder reactie — SLA risico"],
      skills: [
        { label: "Bouw", score: 60, note: "Op basis LinkedIn-snippet" },
        { label: "Respons", score: 35 },
      ],
      topMatchIds: [],
      timeline: [
        {
          id: "t1",
          at: "52u geleden",
          title: "Herinnering concept",
          detail: "AI-mail: CV + koffie-intake — nog niet verstuurd.",
          aiGenerated: true,
        },
      ],
      consultantNote: "Vandaag bellen of conceptmail versturen.",
    },
  };

  const vacancyDetails: Record<string, RecruitmentVacancyDetail> = {
    v1: {
      id: "v1",
      title: "Helpende zorg — avonddienst",
      client: "Zorgcentrum Delft-West",
      sector: "Zorg",
      location: "Delft",
      urgency: "Hoog",
      candidates: 6,
      slaHours: 18,
      description:
        "Ondersteuning avonddienst bewoners; medicatiebegeleiding onder supervisie; nauwe samenwerking vaste team.",
      hoursPerWeek: "24–32 uur",
      startDate: "Zo snel mogelijk",
      aiIntakeSummary:
        "Werkgever benadrukt persoonlijke benadering en betrouwbaarheid boven snelheid. Avond voorkeur 16:00–22:00. Team van 8; hoge turnover vorig kwartaal — focus op retentie.",
      requirements: [
        { id: "r1", label: "Helpende zorg certificaat", required: true, met: 4 },
        { id: "r2", label: "NL mondeling B1+", required: true, met: 5 },
        { id: "r3", label: "Avond beschikbaar", required: true, met: 3 },
        { id: "r4", label: "Ervaring thuiszorg", required: false, met: 2 },
      ],
      shortlistCandidateIds: ["c1", "c3"],
      timeline: [
        {
          id: "t1",
          at: "Vandaag 08:00",
          title: "Intake call samengevat",
          detail: "AI transcribeerde 18 min gesprek → consultant-check klaar.",
          aiGenerated: true,
        },
      ],
    },
    v2: {
      id: "v2",
      title: "Leerkracht ondersteuning B",
      client: "Basisschool De Veste",
      sector: "Onderwijs",
      location: "Delft",
      urgency: "Normaal",
      candidates: 4,
      slaHours: 36,
      description: "Ondersteuning leerkracht groep 5–6; begeleiding SWV-leerlingen.",
      hoursPerWeek: "32 uur",
      startDate: "Over 2 weken",
      aiIntakeSummary:
        "School zoekt rustige, structurele ondersteuner; visie ‘samen groeien’ uit website meegenomen in matchcultuur.",
      requirements: [
        { id: "r1", label: "Onderwijservaring", required: true, met: 3 },
        { id: "r2", label: "Pedagogische affiniteit", required: true, met: 4 },
      ],
      shortlistCandidateIds: ["c2"],
      timeline: [],
    },
    v3: {
      id: "v3",
      title: "Magazijnmedewerker",
      client: "Logistiek Partners",
      sector: "Logistiek",
      location: "Den Haag",
      urgency: "Hoog",
      candidates: 8,
      slaHours: 12,
      description: "Orderpicken, heftruck certificaat gewenst, 2-ploegendienst.",
      hoursPerWeek: "40 uur",
      startDate: "Per direct",
      aiIntakeSummary: "Spoedopdracht; heftruck verplicht; 48u-belofte kritisch.",
      requirements: [
        { id: "r1", label: "Heftruck", required: true, met: 6 },
        { id: "r2", label: "Fysiek belastbaar", required: true, met: 7 },
      ],
      shortlistCandidateIds: ["c4"],
      timeline: [],
    },
    v4: {
      id: "v4",
      title: "Monteur installatietechniek",
      client: "Techniek Service BV",
      sector: "Engineering",
      location: "Rijswijk",
      urgency: "Normaal",
      candidates: 3,
      slaHours: 40,
      description: "Service & onderhoud installaties; klantcontact op locatie.",
      hoursPerWeek: "36–40 uur",
      startDate: "Flexibel",
      aiIntakeSummary:
        "VCA verplicht; groeipad naar senior; Engels handig voor internationale klanten.",
      requirements: [
        { id: "r1", label: "VCA", required: true, met: 2 },
        { id: "r2", label: "Installatie-ervaring", required: true, met: 2 },
      ],
      shortlistCandidateIds: ["c3"],
      timeline: [],
    },
  };

  const matchDetails: Record<string, RecruitmentMatchDetail> = {
    m1: {
      id: "m1",
      candidateId: "c1",
      vacancyId: "v1",
      candidateName: "Samira El Amrani",
      vacancyTitle: "Helpende zorg — avonddienst",
      sector: "Zorg",
      score: 94,
      reason:
        "Ervaring thuiszorg + motivatie avonddiensten; past bij persoonlijke begeleidingslijn.",
      factors: [
        {
          label: "Vakinhoud & certificaten",
          weight: 35,
          score: 96,
          explanation: "Helpende zorg + medicatiebegeleiding sluit aan op eisen.",
        },
        {
          label: "Beschikbaarheid & reistijd",
          weight: 25,
          score: 92,
          explanation: "Per direct; avond OK; 22 min reistijd.",
        },
        {
          label: "Cultuur & visie match",
          weight: 25,
          score: 94,
          explanation: "Intake-notities: persoonlijke benadering = Samira’s profiel.",
        },
        {
          label: "Taal & communicatie",
          weight: 15,
          score: 78,
          explanation: "B2 schriftelijk; mondelinge check aanbevolen bij intake.",
        },
      ],
      reasonSteps: [
        {
          step: 1,
          title: "Vacature-eisen geparsed",
          detail: "AI haalde 4 harde eisen uit intake-transcript + ATS-vacature.",
        },
        {
          step: 2,
          title: "Kandidaatprofiel vergeleken",
          detail: "CV, eerdere plaatsingen en responsgedrag gewogen.",
        },
        {
          step: 3,
          title: "Cultuurfit berekend",
          detail: "Keywords ‘persoonlijk’ en ‘team’ uit werkgever-call ↔ profieltekst.",
        },
        {
          step: 4,
          title: "Motivatie gegenereerd",
          detail: "Concepttekst voor werkgever klaar — consultant kan aanpassen.",
        },
      ],
      motivationDraft: `Beste team Zorgcentrum Delft-West,

Graag stellen wij Samira El Amrani voor op de avonddienst. Zij brengt 4 jaar ervaring in thuiszorg mee, is gecertificeerd helpende zorg en heeft expliciet aangegeven gemotiveerd te zijn voor avonddiensten — aansluitend op jullie wens voor persoonlijke begeleiding.

Wij plannen graag een kennismaking deze week. Past dit in jullie agenda?`,
      consultantTip:
        "Verhoog score naar 97% na geslaagde mondelinge taalcheck — één klik in dossier.",
      atsNote: "Sync naar ATS: velden ‘match_score’ en ‘ai_motivation’ beschikbaar via API.",
    },
    m2: {
      id: "m2",
      candidateId: "c3",
      vacancyId: "v4",
      candidateName: "Rajesh Kumar",
      vacancyTitle: "Monteur installatietechniek",
      sector: "Engineering",
      score: 89,
      reason:
        "Technische achtergrond + VCA; groeipotentieel richting teamlead.",
      factors: [
        {
          label: "Techniek & VCA",
          weight: 40,
          score: 95,
          explanation: "VCA VOL + 8 jaar ervaring.",
        },
        {
          label: "Beschikbaarheid",
          weight: 20,
          score: 100,
          explanation: "Per direct beschikbaar.",
        },
        {
          label: "Groeipad",
          weight: 20,
          score: 88,
          explanation: "Werkgever zoekt senior — Rajesh op traject teamlead.",
        },
        {
          label: "Salarisband",
          weight: 20,
          score: 72,
          explanation: "Verwachting aan bovenkant — bespreek voor shortlist.",
        },
      ],
      reasonSteps: [
        { step: 1, title: "Technische eisen", detail: "VCA + installatie-ervaring bevestigd." },
        { step: 2, title: "Groeipotentieel", detail: "AI koppelt leiderschapssignalen uit CV." },
      ],
      motivationDraft: `Beste Techniek Service BV,

Rajesh Kumar is per direct beschikbaar, VCA-volledig en past bij jullie groeipad richting senior monteur.`,
      consultantTip: "Bespreek salaris vóór gesprek om verrassingen te voorkomen.",
      atsNote: "Profiel al bekeken door contactpersoon (tracking).",
    },
    m3: {
      id: "m3",
      candidateId: "c2",
      vacancyId: "v2",
      candidateName: "Erik de Vries",
      vacancyTitle: "Leerkracht ondersteuning B",
      sector: "Onderwijs",
      score: 86,
      reason:
        "Onderwijservaring + affiniteit Delft-West; beschikbaar binnen 2 weken.",
      factors: [
        {
          label: "Onderwijservaring",
          weight: 45,
          score: 90,
          explanation: "6 jaar IB-ondersteuning.",
        },
        {
          label: "Timing",
          weight: 30,
          score: 80,
          explanation: "Start over 2 weken = exact school-timing.",
        },
        {
          label: "Regio",
          weight: 25,
          score: 88,
          explanation: "Woont in Delft — geen reistijd-issue.",
        },
      ],
      reasonSteps: [
        { step: 1, title: "Schoolvisie", detail: "Website De Veste gescand voor cultuurwoorden." },
        { step: 2, title: "Kandidaat-match", detail: "Erik’s motivatiebrief bevat zelfde terminologie." },
      ],
      motivationDraft: `Beste Basisschool De Veste,

Erik de Vries sluit aan op jullie visie ‘samen groeien’ en kan starten over 2 weken.`,
      consultantTip: "Plan kennismaking direct na meivakantie-rooster bekend is.",
      atsNote: "",
    },
  };

  const followUpDetails: Record<string, RecruitmentFollowUpDetail> = {
    f1: {
      id: "f1",
      party: "Zorgcentrum Delft-West",
      type: "werkgever",
      waitingSince: "26 uur",
      action: "Concept shortlist + belafspraak",
      draftReady: true,
      subject: "Shortlist avonddienst — 2 sterke kandidaten",
      slaDeadline: "Nog 22 uur binnen 48u-belofte",
      relatedVacancyId: "v1",
      aiPersonalization: [
        "Naam contactpersoon uit CRM: Sandra",
        "Verwijzing naar intake-gesprek van dinsdag",
        "Topmatch Samira 94% met korte motivatie",
      ],
      draftBody: `Beste Sandra,

Naar aanleiding van ons gesprek dinsdag stuur ik je graag een eerste shortlist voor de avonddienst.

1. Samira El Amrani (94% match) — 4 jaar thuiszorg, gecertificeerd helpende zorg, gemotiveerd voor avond.
2. [Tweede kandidaat op verzoek na jouw feedback]

Zullen we morgen 10:30 bellen om Samira te bespreken?

Met vriendelijke groet,
Het team van Hiebami`,
    },
    f2: {
      id: "f2",
      party: "Kevin Jansen",
      type: "kandidaat",
      waitingSince: "52 uur",
      action: "Herinnering CV + intake koffie",
      draftReady: true,
      subject: "Even je CV — dan plannen we een koffie-intake",
      slaDeadline: "SLA overschreden — prioriteit hoog",
      relatedCandidateId: "c5",
      aiPersonalization: [
        "Informele toon passend bij eerdere WhatsApp-contact",
        "Verwijzing naar bouw-opdracht Den Haag",
        "Koffie-intake locatie Delft voorgesteld",
      ],
      draftBody: `Hoi Kevin,

Leuk dat je interesse hebt in onze bouw-opdrachten! Om je goed te kunnen matchen hebben we je CV nog nodig.

Zullen we volgende week een koffie-intake inplannen in Delft? Duurt maar 20 minuten.

Groet,
[Consultant] · Hiebami`,
    },
    f3: {
      id: "f3",
      party: "Logistiek Partners",
      type: "werkgever",
      waitingSince: "14 uur",
      action: "Bevestiging gesprek morgen 10:00",
      draftReady: false,
      subject: "Bevestiging gesprek morgen 10:00",
      slaDeadline: "Ruim binnen SLA",
      relatedVacancyId: "v3",
      aiPersonalization: ["Gesprek al in agenda — concept nog niet gegenereerd"],
      draftBody: "",
    },
  };

  return {
    candidateDetails,
    vacancyDetails,
    matchDetails,
    followUpDetails,
  };
}
