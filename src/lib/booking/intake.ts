export type WebsiteBookingIntake = {
  role?: string;
  teamSize?: string;
  interest?: string;
  message?: string;
};

export function formatWebsiteBookingNotes(intake?: WebsiteBookingIntake): string {
  const lines = ["Website booking — Plan gesprek (homepage)"];
  if (intake?.role) lines.push(`Rol: ${intake.role}`);
  if (intake?.teamSize) lines.push(`Teamgrootte: ${intake.teamSize}`);
  if (intake?.interest) lines.push(`Interesse: ${intake.interest}`);
  if (intake?.message?.trim()) lines.push(`Bericht: ${intake.message.trim()}`);
  return lines.join("\n");
}
