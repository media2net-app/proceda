import nodemailer from "nodemailer";
import type Mail from "nodemailer/lib/mailer";
import { getMailConfig } from "./email-config";

export type MailAttachment = {
  filename: string;
  content: Buffer;
  cid: string;
  contentType?: string;
};

export type SendOutreachParams = {
  to: string;
  subject: string;
  text: string;
  html: string;
  attachments?: MailAttachment[];
};

export type SendResult = {
  messageId: string;
  accepted: string[];
};

function createTransport() {
  const config = getMailConfig();
  if (!config) throw new Error("MAIL_NOT_CONFIGURED");

  return nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    auth: {
      user: config.user,
      pass: config.password,
    },
    tls: { minVersion: "TLSv1.2" },
  });
}

export async function verifySmtpConnection(): Promise<void> {
  const transport = createTransport();
  await transport.verify();
}

export async function sendOutreachEmail(
  params: SendOutreachParams,
): Promise<SendResult> {
  const config = getMailConfig();
  if (!config) throw new Error("MAIL_NOT_CONFIGURED");

  const transport = createTransport();
  const mailOptions: Mail.Options = {
    from: `"${config.fromName}" <${config.from}>`,
    to: params.to,
    replyTo: config.from,
    subject: params.subject,
    text: params.text,
    html: params.html,
    attachments: params.attachments?.map((a) => ({
      filename: a.filename,
      content: a.content,
      cid: a.cid,
      contentType: a.contentType ?? "image/png",
    })),
  };

  const info = await transport.sendMail(mailOptions);
  return {
    messageId: info.messageId ?? "",
    accepted: (info.accepted as string[]) ?? [],
  };
}
