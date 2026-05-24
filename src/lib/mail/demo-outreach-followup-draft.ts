/** Follow-up na eerste outreach — warme leads die de demo-link openden. */
export function buildFollowUpMailSubject(businessName: string): string {
  return `Je opende onze demo-link — 30 min live voor ${businessName}?`;
}

export function buildFollowUpProposalDraft(businessName: string): string {
  return `Beste ${businessName},

Je hebt onze link geopend — bedankt. Dat is meestal het moment waarop een kantoor wil zien of het voor hen werkt.

Voor ${businessName} staat al een maatwerk portaal klaar: leads, woningaanbod en AI-ondersteuning in één omgeving. In 30 minuten lopen we live door wat dit concreet oplevert: minder handwerk, snellere opvolging, meer overzicht voor je team.

Kies hieronder een moment dat past (ma–vr, 08:00–20:00). Geen verplichtingen — wel een helder beeld of we verder praten.

Met vriendelijke groet,
Chiel van der Zee
Proceda`;
}
