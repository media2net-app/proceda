import type { InboxMessage } from "./types";

/** Automatische bounce / delivery-failure meldingen (niet tonen in inbox-UI). */
export const INBOX_BOUNCE_SUBJECT =
  /undeliver|delivery status|mail delivery failed|returned mail|failure notice|niet afgeleverd|permanent error|returned to sender/i;

export const INBOX_BOUNCE_FROM =
  /mailer-daemon|mail delivery system|postmaster@|MAILER-DAEMON/i;

export function isInboxBounceMessage(msg: {
  subject?: string;
  from?: string;
  preview?: string;
}): boolean {
  const subject = msg.subject ?? "";
  const from = msg.from ?? "";
  if (INBOX_BOUNCE_SUBJECT.test(subject)) return true;
  if (INBOX_BOUNCE_FROM.test(from)) return true;
  return false;
}

export function filterInboxForDisplay(messages: InboxMessage[]): InboxMessage[] {
  return messages.filter((m) => !isInboxBounceMessage(m));
}
