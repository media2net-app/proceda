/** Eerste outreach-mail voor installatie / technische dienst. */
export function buildInstallatieDemoProposalDraft(businessName: string): string {
  return `Beste ${businessName},

Wij zijn Proceda. Wij bouwen maatwerk webapplicaties en koppelen AI aan uw bedrijfsprocessen — van offertes en werkbonnen tot planning en klantopvolging.

Concreet voor ${businessName}: we hebben een concept voorbereid in uw huisstijl — een overzichtelijk klant- en werkportaal met uw logo en kleuren, waarin aanvragen, opdrachten en planning samenkomen. AI helpt bij het verwerken van e-mails en formulieren, prioriteit van klussen en snellere opvolging.

In deze e-mail vindt u een visuele preview. Tijdens een vrijblijvend gesprek van 30 minuten laten we dat live zien — zonder verplichtingen.

Met vriendelijke groet,
Proceda`;
}

export function buildInstallatieMailSubject(businessName: string): string {
  return `Maatwerk portaal + AI — minder handwerk voor ${businessName}`;
}
