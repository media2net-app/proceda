export type MailServerConfig = {
  user: string;
  password: string;
  from: string;
  fromName: string;
  imap: { host: string; port: number; secure: boolean };
  smtp: { host: string; port: number; secure: boolean };
};

const DEFAULTS = {
  imapHost: "imap.hostinger.com",
  imapPort: 993,
  smtpHost: "smtp.hostinger.com",
  smtpPort: 465,
  fromName: "Proceda",
};

function parsePort(raw: string | undefined, fallback: number): number {
  const n = parseInt(raw ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/** Hostinger IMAP/SMTP — credentials via env (nooit in code committen). */
export function getMailConfig(): MailServerConfig | null {
  const user = process.env.MAIL_USER?.trim();
  const password = process.env.MAIL_PASSWORD?.trim();
  if (!user || !password) return null;

  const from = process.env.MAIL_FROM?.trim() || user;
  const smtpPort = parsePort(process.env.MAIL_SMTP_PORT, DEFAULTS.smtpPort);
  const imapPort = parsePort(process.env.MAIL_IMAP_PORT, DEFAULTS.imapPort);

  return {
    user,
    password,
    from,
    fromName: process.env.MAIL_FROM_NAME?.trim() || DEFAULTS.fromName,
    imap: {
      host: process.env.MAIL_IMAP_HOST?.trim() || DEFAULTS.imapHost,
      port: imapPort,
      secure: process.env.MAIL_IMAP_SECURE !== "false",
    },
    smtp: {
      host: process.env.MAIL_SMTP_HOST?.trim() || DEFAULTS.smtpHost,
      port: smtpPort,
      secure:
        process.env.MAIL_SMTP_SECURE === "true" ||
        (process.env.MAIL_SMTP_SECURE !== "false" && smtpPort === 465),
    },
  };
}

export function isMailConfigured(): boolean {
  return getMailConfig() !== null;
}
