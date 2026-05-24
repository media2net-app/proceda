import type { Bedrijf } from "@/lib/bedrijven/types";
import type { DeepScrapeResult } from "@/lib/bedrijven/deep-scrape-types";

/** Branche-variant voor één universele demo — copy & placeholders per outreach-verticale. */
export type DemoBranch =
  | "makelaar"
  | "installatie"
  | "vastgoedbeheer"
  | "accountants"
  | "recruitment"
  | "verzekering"
  | "auto"
  | "retail"
  | "horeca"
  | "health"
  | "services";

/** Vaste koppeling NL outreach-verticale → demo-template. */
export const SCRAPE_BRANCH_DEMO: Record<string, DemoBranch> = {
  makelaardij: "makelaar",
  installatie: "installatie",
  vastgoedbeheer: "vastgoedbeheer",
  accountants: "accountants",
  recruitment: "recruitment",
  verzekering: "verzekering",
};

export type BranchCopy = {
  navAanbod: string;
  navDiensten: string;
  aanbodTitle: string;
  aanbodSubtitle: string;
  aanbodCta: string;
  heroBadge: string;
  heroCtaPrimary: string;
  heroCtaSecondary: string;
  stats: { value: string; label: string }[];
  trustTitle: string;
  trustBody: string;
  trustBadge: string;
  ctaTitle: string;
  ctaBody: string;
  ctaButton: string;
  defaultItemBadge: string;
  placeholderTitle: string;
  placeholderMeta: string;
  placeholderPrice: string;
  heroImage: string;
  servicesTitle: string;
  servicesSubtitle: string;
  defaultServices: { title: string; desc: string }[];
};

const BRANCH_COPY: Record<DemoBranch, BranchCopy> = {
  makelaar: {
    navAanbod: "Aanbod",
    navDiensten: "Diensten",
    aanbodTitle: "Recent woningaanbod",
    aanbodSubtitle:
      "Modern overzicht met filters, grote foto's en duidelijke status — zoals kopers dat verwachten.",
    aanbodCta: "Bekijk woning →",
    heroBadge: "Vastgoed · lokaal vertrouwd",
    heroCtaPrimary: "Bekijk aanbod",
    heroCtaSecondary: "Plan een gesprek",
    stats: [
      { value: "25+", label: "Objecten in aanbod" },
      { value: "NVM", label: "Branchekwaliteit" },
      { value: "30+", label: "Jaar ervaring" },
      { value: "100%", label: "Persoonlijke begeleiding" },
    ],
    trustTitle: "Betrouwbaar & transparant",
    trustBody:
      "Professionele begeleiding bij koop, verkoop en taxatie — helder, persoonlijk en lokaal.",
    trustBadge: "Vastgoed",
    ctaTitle: "Benieuwd wat uw woning waard is?",
    ctaBody: "Plan een vrijblijvend adviesgesprek — wij denken graag met u mee.",
    ctaButton: "Neem contact op",
    defaultItemBadge: "Te koop",
    placeholderTitle: "Voorbeeldwoning",
    placeholderMeta: "Regio",
    placeholderPrice: "€ — k.k.",
    heroImage:
      "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1600&q=80",
    servicesTitle: "Onze diensten",
    servicesSubtitle: "Van verkoop tot aankoop — één aanspreekpunt voor al uw vastgoedvragen.",
    defaultServices: [
      { title: "Woning verkopen", desc: "Maximale opbrengst met een doordachte verkoopstrategie." },
      { title: "Woning kopen", desc: "Helder advies en begeleiding tot aan de overdracht." },
      { title: "Taxaties", desc: "Betrouwbare waardebepaling voor financiering of verkoop." },
      { title: "Advies & begeleiding", desc: "Persoonlijk, transparant en altijd bereikbaar." },
    ],
  },
  installatie: {
    navAanbod: "Diensten",
    navDiensten: "Specialismen",
    aanbodTitle: "Onze installatiediensten",
    aanbodSubtitle:
      "Van cv-onderhoud tot complete renovatie — helder overzicht met directe offerte-aanvraag.",
    aanbodCta: "Offerte aanvragen →",
    heroBadge: "Installatie · techniek & service",
    heroCtaPrimary: "Bekijk diensten",
    heroCtaSecondary: "Bel voor spoed",
    stats: [
      { value: "15+", label: "Vakgebieden" },
      { value: "24/7", label: "Storingsdienst" },
      { value: "4.9", label: "Klantscore" },
      { value: "100%", label: "Gecertificeerd" },
    ],
    trustTitle: "Vakmanschap dat u merkt",
    trustBody:
      "Eerlijke prijzen, duidelijke planning en netjes opgeleverd werk — voor particulier en zakelijk.",
    trustBadge: "Techniek",
    ctaTitle: "Project of onderhoud gepland?",
    ctaBody: "Vraag een vrijblijvende offerte of plan een inspectie in.",
    ctaButton: "Contact opnemen",
    defaultItemBadge: "Populair",
    placeholderTitle: "Installatiepakket",
    placeholderMeta: "Particulier · Zakelijk",
    placeholderPrice: "Op maat",
    heroImage:
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1600&q=80",
    servicesTitle: "Specialismen",
    servicesSubtitle: "Elektra, sanitair, cv, dak en meer — één aanspreekpunt.",
    defaultServices: [
      { title: "Elektra & verlichting", desc: "Veilige installaties en slimme oplossingen." },
      { title: "Sanitair & cv", desc: "Onderhoud, vervanging en energiezuinige systemen." },
      { title: "Renovatie", desc: "Complete badkamer- en keukenprojecten." },
      { title: "Storing & service", desc: "Snel ter plaatse bij urgentie." },
    ],
  },
  vastgoedbeheer: {
    navAanbod: "Beheer",
    navDiensten: "Diensten",
    aanbodTitle: "Vastgoed in beheer",
    aanbodSubtitle:
      "VvE, verhuur en beheer met transparante rapportages en een vast aanspreekpunt.",
    aanbodCta: "Bekijk diensten →",
    heroBadge: "Vastgoedbeheer · VvE & verhuur",
    heroCtaPrimary: "Plan overleg",
    heroCtaSecondary: "Onze aanpak",
    stats: [
      { value: "500+", label: "Eenheden beheerd" },
      { value: "VvE", label: "Specialist" },
      { value: "24u", label: "Meldingen" },
      { value: "100%", label: "Transparant" },
    ],
    trustTitle: "Beheer zonder verrassingen",
    trustBody:
      "Heldere jaarafrekeningen, onderhoudsplanning en communicatie die bewoners en eigenaren begrijpen.",
    trustBadge: "Beheer",
    ctaTitle: "VvE of portefeuille uitbesteden?",
    ctaBody: "Plan een kennismaking — wij laten zien hoe overzichtelijk beheer kan zijn.",
    ctaButton: "Kennismaken",
    defaultItemBadge: "Actief",
    placeholderTitle: "Complex / object",
    placeholderMeta: "Regio",
    placeholderPrice: "Beheer op maat",
    heroImage:
      "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1600&q=80",
    servicesTitle: "Beheerdiensten",
    servicesSubtitle: "Van technisch beheer tot huurderscommunicatie.",
    defaultServices: [
      { title: "VvE-beheer", desc: "ALV, begroting en onderhoud geregeld." },
      { title: "Verhuurbeheer", desc: "Screening, contracten en incasso." },
      { title: "Technisch beheer", desc: "Inspecties, onderhoud en opvolging." },
      { title: "Rapportage", desc: "Online inzicht voor eigenaren en bestuur." },
    ],
  },
  accountants: {
    navAanbod: "Diensten",
    navDiensten: "Specialisaties",
    aanbodTitle: "Administratie & advies",
    aanbodSubtitle:
      "Boekhouding, belasting en salaris — persoonlijk contact en moderne online inzichten.",
    aanbodCta: "Meer informatie →",
    heroBadge: "Accountancy · helder advies",
    heroCtaPrimary: "Plan gesprek",
    heroCtaSecondary: "Onze diensten",
    stats: [
      { value: "20+", label: "Jaar ervaring" },
      { value: "MKB", label: "Specialist" },
      { value: "100%", label: "Digitaal dossier" },
      { value: "NL", label: "Landelijk" },
    ],
    trustTitle: "Cijfers die kloppen",
    trustBody:
      "Proactief meedenken over fiscale kansen en rust in uw administratie — jaarronde zonder stress.",
    trustBadge: "Finance",
    ctaTitle: "Administratie uit handen geven?",
    ctaBody: "Vrijblijvend kennismaken en een passend pakket samenstellen.",
    ctaButton: "Afspraak plannen",
    defaultItemBadge: "Advies",
    placeholderTitle: "Dienstpakket",
    placeholderMeta: "ZZP · BV",
    placeholderPrice: "Vanaf € — p/m",
    heroImage:
      "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1600&q=80",
    servicesTitle: "Wat wij doen",
    servicesSubtitle: "Van boekhouding tot jaarrekening en belastingaangifte.",
    defaultServices: [
      { title: "Boekhouding", desc: "Compleet bijgehouden administratie." },
      { title: "Belastingadvies", desc: "Aangiften en fiscale planning." },
      { title: "Salarisadministratie", desc: "Nauwkeurig en op tijd." },
      { title: "Bedrijfsadvies", desc: "Groei, structuur en financiële inzichten." },
    ],
  },
  recruitment: {
    navAanbod: "Vacatures",
    navDiensten: "Werkwijze",
    aanbodTitle: "Open opdrachten",
    aanbodSubtitle:
      "Werving, selectie en detachering — snel de juiste match voor vaste en tijdelijke rollen.",
    aanbodCta: "Bekijk vacature →",
    heroBadge: "Recruitment · mensen eerst",
    heroCtaPrimary: "Ik zoek talent",
    heroCtaSecondary: "Ik zoek werk",
    stats: [
      { value: "48u", label: "Eerste shortlist" },
      { value: "500+", label: "Plaatsingen" },
      { value: "4.8", label: "Opdrachtgevers" },
      { value: "NL", label: "Netwerk" },
    ],
    trustTitle: "Matches die blijven",
    trustBody:
      "Diep interviewen, duidelijke verwachtingen en begeleiding na plaatsing — voor kandidaat en opdrachtgever.",
    trustBadge: "HR",
    ctaTitle: "Vacature of CV delen?",
    ctaBody: "Binnen één werkdag reactie van een vaste consultant.",
    ctaButton: "Neem contact op",
    defaultItemBadge: "Nieuw",
    placeholderTitle: "Functie",
    placeholderMeta: "Regio · Fulltime",
    placeholderPrice: "Salaris in overleg",
    heroImage:
      "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1600&q=80",
    servicesTitle: "Onze diensten",
    servicesSubtitle: "Werving & selectie, detachering en interim management.",
    defaultServices: [
      { title: "Werving & selectie", desc: "Van profiel tot contract." },
      { title: "Detachering", desc: "Flexibel specialisten inzetten." },
      { title: "Executive search", desc: "Leiderschap en specialistische rollen." },
      { title: "Carrière-advies", desc: "CV, sollicitatie en arbeidsmarkt." },
    ],
  },
  verzekering: {
    navAanbod: "Verzekeringen",
    navDiensten: "Advies",
    aanbodTitle: "Oplossingen op maat",
    aanbodSubtitle:
      "Particulier en zakelijk — vergelijken, afsluiten en schade begeleiden met één vast contact.",
    aanbodCta: "Bekijk pakket →",
    heroBadge: "Verzekering · onafhankelijk advies",
    heroCtaPrimary: "Vraag advies",
    heroCtaSecondary: "Schade melden",
    stats: [
      { value: "30+", label: "Jaar advies" },
      { value: "100%", label: "Onafhankelijk" },
      { value: "24u", label: "Schademelding" },
      { value: "4.9", label: "Klantwaardering" },
    ],
    trustTitle: "Dekking die past",
    trustBody:
      "Geen standaardpakketten — we leggen helder uit wat wel en niet verzekerd is, zonder kleine lettertjes.",
    trustBadge: "Assurantie",
    ctaTitle: "Polis vergelijken of vernieuwen?",
    ctaBody: "Gratis inventarisatie van uw huidige dekking.",
    ctaButton: "Bel mij terug",
    defaultItemBadge: "Aanbevolen",
    placeholderTitle: "Verzekeringspakket",
    placeholderMeta: "Particulier · Zakelijk",
    placeholderPrice: "Premie op maat",
    heroImage:
      "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1600&q=80",
    servicesTitle: "Adviesgebieden",
    servicesSubtitle: "Van aansprakelijkheid tot pensioen en schade.",
    defaultServices: [
      { title: "Particulier", desc: "Woon, auto, reis en aansprakelijkheid." },
      { title: "Zakelijk", desc: "Bedrijfsrisico's en arbeidsongeschiktheid." },
      { title: "Schadebegeleiding", desc: "Snel en duidelijk bij een melding." },
      { title: "Periodieke check", desc: "Jaarlijks dekking en premie toetsen." },
    ],
  },
  auto: {
    navAanbod: "Voorraad",
    navDiensten: "Diensten",
    aanbodTitle: "Nieuw & occasion in voorraad",
    aanbodSubtitle:
      "Overzichtelijke voorraadpagina met filters op merk, prijs en bouwjaar — direct contact met de verkoper.",
    aanbodCta: "Bekijk auto →",
    heroBadge: "Mobiliteit · service & kwaliteit",
    heroCtaPrimary: "Bekijk voorraad",
    heroCtaSecondary: "Plan proefrit",
    stats: [
      { value: "40+", label: "Auto's op voorraad" },
      { value: "BOVAG", label: "Branchegarantie" },
      { value: "4.8", label: "Klantwaardering" },
      { value: "7d", label: "Service & onderhoud" },
    ],
    trustTitle: "Kwaliteit die u kunt vertrouwen",
    trustBody:
      "Occasions met volledige historie, transparante prijzen en onderhoud door vakmensen.",
    trustBadge: "Mobiliteit",
    ctaTitle: "Op zoek naar uw volgende auto?",
    ctaBody: "Plan een proefrit of vraag een vrijblijvende offerte aan.",
    ctaButton: "Contact opnemen",
    defaultItemBadge: "Nieuw binnen",
    placeholderTitle: "Voorbeeldmodel",
    placeholderMeta: "Benzine · Automaat",
    placeholderPrice: "€ —",
    heroImage:
      "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1600&q=80",
    servicesTitle: "Onze diensten",
    servicesSubtitle: "Verkoop, onderhoud en lease — alles onder één dak.",
    defaultServices: [
      { title: "Occasions & nieuw", desc: "Ruime keuze met eerlijke prijsopbouw." },
      { title: "Onderhoud & APK", desc: "Snelle service met originele onderdelen." },
      { title: "Financiering & lease", desc: "Maatwerk voor particulier en zakelijk." },
      { title: "Inruil", desc: "Eenvoudig uw huidige auto inruilen." },
    ],
  },
  retail: {
    navAanbod: "Assortiment",
    navDiensten: "Diensten",
    aanbodTitle: "Uitgelichte producten",
    aanbodSubtitle:
      "Shop-ervaring met duidelijke categorieën, voorraadstatus en snelle checkout.",
    aanbodCta: "Bekijk product →",
    heroBadge: "Retail · lokaal & online",
    heroCtaPrimary: "Shop assortiment",
    heroCtaSecondary: "Bezoek winkel",
    stats: [
      { value: "500+", label: "Producten" },
      { value: "24u", label: "Snelle levering" },
      { value: "4.9", label: "Reviews" },
      { value: "100%", label: "Retourgarantie" },
    ],
    trustTitle: "Kwaliteit & service",
    trustBody: "Vakkundig advies, heldere prijzen en een soepele online én winkelervaring.",
    trustBadge: "Retail",
    ctaTitle: "Klaar om te bestellen?",
    ctaBody: "Bekijk het assortiment of kom langs in de winkel.",
    ctaButton: "Naar shop",
    defaultItemBadge: "Nieuw",
    placeholderTitle: "Uitgelicht product",
    placeholderMeta: "Collectie",
    placeholderPrice: "€ —",
    heroImage:
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=80",
    servicesTitle: "Waarom bij ons",
    servicesSubtitle: "Service, advies en een assortiment dat past bij uw behoefte.",
    defaultServices: [
      { title: "Online shop", desc: "Bestel eenvoudig, thuisbezorgd of afhalen in de winkel." },
      { title: "Advies op maat", desc: "Onze specialisten helpen u de juiste keuze te maken." },
      { title: "Zakelijke orders", desc: "Offertes en levering op rekening voor bedrijven." },
      { title: "Service & garantie", desc: "Snelle afhandeling bij vragen of retouren." },
    ],
  },
  horeca: {
    navAanbod: "Menu & reserveren",
    navDiensten: "Ervaring",
    aanbodTitle: "Populaire keuzes",
    aanbodSubtitle:
      "Reserveren in twee klikken, seizoensmenu's en duidelijke allergenen — modern horecaportaal.",
    aanbodCta: "Reserveer →",
    heroBadge: "Horeca · gastvrijheid",
    heroCtaPrimary: "Reserveer tafel",
    heroCtaSecondary: "Bekijk menu",
    stats: [
      { value: "4.8", label: "Gasten score" },
      { value: "7d", label: "Geopend" },
      { value: "50+", label: "Gerechten" },
      { value: "15m", label: "Gem. wachttijd" },
    ],
    trustTitle: "Gastvrij & vers",
    trustBody: "Seizoensproducten, sfeervolle setting en team dat met u meedenkt.",
    trustBadge: "Horeca",
    ctaTitle: "Reserveer uw tafel",
    ctaBody: "Kies datum, tijd en aantal personen — bevestiging direct in uw mailbox.",
    ctaButton: "Reserveren",
    defaultItemBadge: "Seizoen",
    placeholderTitle: "Chef's special",
    placeholderMeta: "Diner",
    placeholderPrice: "€ —",
    heroImage:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1600&q=80",
    servicesTitle: "Ervaring",
    servicesSubtitle: "Diner, events en catering — voor elk moment de juiste setting.",
    defaultServices: [
      { title: "Reserveren", desc: "Online tafel boeken, ook voor groepen." },
      { title: "Seizoensmenu", desc: "Verse ingrediënten, wekelijks vernieuwd." },
      { title: "Events & catering", desc: "Van bruiloft tot bedrijfsborrel." },
      { title: "Take-away", desc: "Bestel vooraf en haal op of laat bezorgen." },
    ],
  },
  health: {
    navAanbod: "Aanbod",
    navDiensten: "Zorg",
    aanbodTitle: "Behandelingen & trajecten",
    aanbodSubtitle:
      "Overzichtelijke informatie, online afspraak en heldere tarieven — rust voor de patiënt.",
    aanbodCta: "Meer info →",
    heroBadge: "Zorg · persoonlijk",
    heroCtaPrimary: "Plan afspraak",
    heroCtaSecondary: "Onze zorg",
    stats: [
      { value: "10+", label: "Specialisten" },
      { value: "AGB", label: "Gecertificeerd" },
      { value: "4.9", label: "Patiëntscore" },
      { value: "48u", label: "Snelle intake" },
    ],
    trustTitle: "Zorg met aandacht",
    trustBody: "Veilige omgeving, duidelijke uitleg en behandeling op maat.",
    trustBadge: "Zorg",
    ctaTitle: "Plan uw eerste afspraak",
    ctaBody: "Online inschrijven of bel ons — wij plannen u snel in.",
    ctaButton: "Afspraak maken",
    defaultItemBadge: "Beschikbaar",
    placeholderTitle: "Behandeling",
    placeholderMeta: "Consult",
    placeholderPrice: "Vanaf € —",
    heroImage:
      "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1600&q=80",
    servicesTitle: "Onze zorg",
    servicesSubtitle: "Preventie, behandeling en nazorg — helder en toegankelijk.",
    defaultServices: [
      { title: "Intake & diagnose", desc: "Tijd voor uw vragen en een helder plan." },
      { title: "Behandeling", desc: "Evidence-based zorg door ervaren specialisten." },
      { title: "Online afspraak", desc: "Plan en beheer afspraken in uw eigen tijd." },
      { title: "Nazorg", desc: "Blijvend bereikbaar na uw behandeling." },
    ],
  },
  services: {
    navAanbod: "Oplossingen",
    navDiensten: "Diensten",
    aanbodTitle: "Uitgelichte oplossingen",
    aanbodSubtitle:
      "Overzicht van diensten en cases — professioneel, scanbaar en gericht op conversie.",
    aanbodCta: "Meer lezen →",
    heroBadge: "Dienstverlening · lokaal",
    heroCtaPrimary: "Bekijk diensten",
    heroCtaSecondary: "Vraag offerte",
    stats: [
      { value: "15+", label: "Jaar actief" },
      { value: "200+", label: "Klanten" },
      { value: "4.9", label: "Tevredenheid" },
      { value: "24u", label: "Reactietijd" },
    ],
    trustTitle: "Partner die meedenkt",
    trustBody: "Duidelijke afspraken, vaste contactpersoon en resultaatgerichte aanpak.",
    trustBadge: "Pro",
    ctaTitle: "Klaar voor de volgende stap?",
    ctaBody: "Vraag een vrijblijvend gesprek of offerte aan — we reageren snel.",
    ctaButton: "Contact",
    defaultItemBadge: "Populair",
    placeholderTitle: "Dienstpakket",
    placeholderMeta: "Maatwerk",
    placeholderPrice: "Op aanvraag",
    heroImage:
      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&q=80",
    servicesTitle: "Onze diensten",
    servicesSubtitle: "Van advies tot uitvoering — één team, één aanspreekpunt.",
    defaultServices: [
      { title: "Advies", desc: "Strategie en haalbaarheid helder in kaart." },
      { title: "Uitvoering", desc: "Vakkundig team dat levert wat is afgesproken." },
      { title: "Beheer", desc: "Doorlopend onderhoud en optimalisatie." },
      { title: "Support", desc: "Bereikbaar wanneer u ons nodig heeft." },
    ],
  },
};

export function resolveDemoBranch(
  business: Bedrijf,
  deep: DeepScrapeResult,
): DemoBranch {
  const fromBranch = business.branchId
    ? SCRAPE_BRANCH_DEMO[business.branchId]
    : undefined;
  if (fromBranch) return fromBranch;

  const hay = [
    business.category,
    business.subcategory,
    deep.tagline ?? "",
    ...deep.services,
    ...deep.allNavTexts,
  ]
    .join(" ")
    .toLowerCase();

  if (/makelaar|vastgoed|nvm|estate_agent|real_estate|woning/i.test(hay)) {
    return "makelaar";
  }
  if (
    /elektr|loodgieter|installat|sanitair|verwarm|aannemer|dakdek|monteur|technisch|cv\b/i.test(
      hay,
    )
  ) {
    return "services";
  }
  if (
    business.category === "auto" ||
    /car_dealer|autodealer|autobedrijf|garage|occasion/i.test(hay)
  ) {
    return "auto";
  }
  if (business.category === "horeca" || /restaurant|hotel|cafe|horeca/i.test(hay)) {
    return "horeca";
  }
  if (
    business.category === "retail" ||
    /winkel|webshop|retail|producten|assortiment/i.test(hay)
  ) {
    return "retail";
  }
  if (
    business.category === "health" ||
    /tandarts|kliniek|zorg|apotheek|fysio|dokter/i.test(hay)
  ) {
    return "health";
  }
  return "services";
}

export function getBranchCopy(branch: DemoBranch): BranchCopy {
  return BRANCH_COPY[branch];
}
