/** Gedeelde outreach-copy: verhaal, USP's en opbouw van de e-mailtekst. */

export const OUTREACH_SIGNATURE = `Met vriendelijke groet,

Chiel van der Zee
Proceda`;

/** Persoonlijk verhaal + kansen door AI (alle branches). */
export const PROCEDA_STORY_PARAGRAPHS = [
  `Mijn naam is **Chiel van der Zee**, oprichter van **Proceda**. Sinds 2013 leid ik **Media2Net**, waar we honderden websites en webwinkels voor ondernemers in Nederland hebben gebouwd. Ruim twee jaar geleden heb ik dat bedrijf verkocht om me volledig te richten op wat er nu het verschil maakt: **AI in je bedrijfsprocessen**.`,
  `Met Proceda helpen we **ZZP'ers, het MKB en grotere organisaties** om slimmer te werken en weer grip te krijgen op hun omzet. Door de snelle opkomst van AI liggen er grote kansen: veel bedrijven laten naar schatting **30 tot 40 procent omzet** liggen, omdat medewerkers nog veel tijd kwijt zijn aan taken die eenvoudig te automatiseren zijn. Met onze aanpak kan **jouw team** zich richten op **het werk dat er écht toe doet** — klanten, projecten en groei.`,
];

/** Algemene USP's (alle branches). */
export const PROCEDA_USP_PARAGRAPHS = [
  `Wat je bij ons kunt verwachten: **volledig overzicht** over je bedrijf. **AI genereert rapportages en prognoses**; in combinatie met de **maatwerk webapplicatie** die we voor je bouwen, wordt je hele bedrijfsproces **24/7 inzichtelijk** — ook onderweg via **je eigen webapp**. Geen losse Excel-bestanden of systemen die niet met elkaar praten, maar één omgeving die past bij hoe jij werkt.`,
];

/** API-koppelingen en vervanging van dure licenties (alle branches). */
export const PROCEDA_INTEGRATION_PARAGRAPHS = [
  `We maken via **API-koppelingen** aansluiting op software die je al gebruikt — denk aan CRM, boekhouding, planning, ERP of branchepakketten. Waar het slim is, **bouwen we die functies ook in je eigen webapplicatie**, zodat je **minder afhankelijk bent van hoge maandelijkse licentiekosten** per gebruiker of module.`,
];

/** Prijsmodel (alle branches). */
export const PROCEDA_PRICING_PARAGRAPHS = [
  `Transparant in kosten: na een **eenmalige investering op basis van jouw wensen** betaal je bij Proceda enkel **vaste hostingkosten van € 29,95 per maand** — geen verrassingen en geen dure per-seat abonnementen op software die je al bezit.`,
];

/** Scheidt HTML-secties in outreach-copy (plain-text gebruikt alleen dubbele newlines). */
export const OUTREACH_SECTION_DELIMITER = "\n\n---\n\n";

export function outreachMeetingClosing(businessName: string): string[] {
  return [
    `Via onderstaande knop kun je een **persoonlijke afspraak met mij** maken. Via **Google Meet** (videogesprek) laat ik je in **30 minuten** live zien wat Proceda voor **${businessName}** kan betekenen.`,
    `Het bekijken van de demo is **geheel vrijblijvend** — baat het niet, dan schaadt het niet. Ik wil je in ieder geval op de hoogte brengen van de mogelijkheden en kennis laten maken met **het automatiseren van bedrijfsprocessen met behulp van AI**.`,
  ];
}

/** Eerste outreach — secties voor HTML-layout (wit / paars afwisselend). */
export function composeOutreachSections(
  businessName: string,
  branchParagraphs: string[],
): string[] {
  return [
    [`Beste ${businessName},`, ...PROCEDA_STORY_PARAGRAPHS].join("\n\n"),
    [
      ...PROCEDA_USP_PARAGRAPHS,
      ...PROCEDA_INTEGRATION_PARAGRAPHS,
      ...PROCEDA_PRICING_PARAGRAPHS,
    ].join("\n\n"),
    branchParagraphs.join("\n\n"),
    outreachMeetingClosing(businessName).join("\n\n"),
    OUTREACH_SIGNATURE,
  ];
}

/** Eerste outreach: begroeting + verhaal + USP's + integratie/prijs + branchetekst + afspraak-CTA + handtekening. */
export function composeOutreachDraft(
  businessName: string,
  branchParagraphs: string[],
): string {
  return composeOutreachSections(businessName, branchParagraphs).join(
    OUTREACH_SECTION_DELIMITER,
  );
}

/** Follow-up — secties voor HTML-layout. */
export function composeFollowUpSections(
  businessName: string,
  branchParagraphs: string[],
): string[] {
  return [
    [
      `Beste ${businessName},`,
      `Je hebt onze link geopend — bedankt. Mijn naam is **Chiel van der Zee** (Proceda); we helpen bedrijven met **maatwerk webapps en AI-automatisering**, met **API-koppelingen** naar bestaande software en **hosting vanaf € 29,95 per maand** na een eenmalige investering.`,
    ].join("\n\n"),
    branchParagraphs.join("\n\n"),
    outreachMeetingClosing(businessName).join("\n\n"),
    OUTREACH_SIGNATURE,
  ];
}

/** Follow-up: korter, zonder volledig verhaal opnieuw. */
export function composeFollowUpDraft(
  businessName: string,
  branchParagraphs: string[],
): string {
  return composeFollowUpSections(businessName, branchParagraphs).join(
    OUTREACH_SECTION_DELIMITER,
  );
}
