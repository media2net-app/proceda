/** Follow-up na eerste outreach-mail (zelfde demo-link / token). */
export function buildFollowUpMailSubject(businessName: string): string {
  return `Herinnering — vrijblijvende demo voor ${businessName}`;
}

export function buildFollowUpProposalDraft(businessName: string): string {
  return `Beste ${businessName},

Ik stuur u kort een herinnering naar aanleiding van mijn e-mail van vorige week over maatwerk software en AI-automatisering voor ${businessName}.

We hebben een concept-dashboard in uw huisstijl klaarstaan. In een gratis gesprek van 30 minuten laten we dat live zien en bespreken we wat dit concreet voor uw kantoor kan betekenen — zonder verplichtingen.

Staat het u deze of volgende week schikt? Via onderstaande knop kiest u zelf een tijdslot (ma–vr, 08:00–20:00).

Met vriendelijke groet,
Proceda`;
}
