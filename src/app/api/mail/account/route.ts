import { NextResponse } from "next/server";
import { getMailConfig, isMailConfigured } from "@/lib/mail/email-config";
import { verifyImapConnection } from "@/lib/mail/imap-client";
import { verifySmtpConnection } from "@/lib/mail/smtp-client";
import type { MailAccountStatus } from "@/lib/mail/types";

export async function GET() {
  const configured = isMailConfigured();
  const config = getMailConfig();

  const status: MailAccountStatus = {
    configured,
    from: config?.from,
    imapHost: config?.imap.host,
    smtpHost: config?.smtp.host,
  };

  if (!configured) {
    return NextResponse.json(status);
  }

  try {
    await verifySmtpConnection();
    status.smtpOk = true;
  } catch (e) {
    status.smtpOk = false;
    status.error = e instanceof Error ? e.message : "SMTP failed";
  }

  try {
    await verifyImapConnection();
    status.imapOk = true;
  } catch (e) {
    status.imapOk = false;
    status.error =
      (status.error ? `${status.error}; ` : "") +
      (e instanceof Error ? e.message : "IMAP failed");
  }

  return NextResponse.json(status);
}
