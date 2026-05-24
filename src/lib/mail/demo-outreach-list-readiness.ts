import { isLikelyGuessedEmail } from "@/lib/bedrijven/contact-utils";
import type { Bedrijf } from "@/lib/bedrijven/types";
import type { MailLeadStatus } from "./types";

/** Snelle readiness voor de verzendlijst (zware checks bij versturen via assertOutreachSendReady). */
export function deriveListSendReadiness(
  business: Bedrijf,
  email: string,
  status: MailLeadStatus,
): { sendReady: boolean; sendBlockers: string[] } {
  if (status !== "draft") {
    return { sendReady: true, sendBlockers: [] };
  }

  const blockers: string[] = [];
  if (isLikelyGuessedEmail(email, business.website)) {
    blockers.push("EMAIL_NOT_VERIFIED");
  }

  return { sendReady: blockers.length === 0, sendBlockers: blockers };
}
