import type { Bedrijf } from "@/lib/bedrijven/types";
import type { DeepScrapeResult } from "@/lib/bedrijven/deep-scrape-types";

/** Branche-variant voor één universele demo — alleen copy & placeholders verschillen. */
export type DemoBranch =
  | "makelaar"
  | "auto"
  | "retail"
  | "horeca"
  | "health"
  | "services";

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
