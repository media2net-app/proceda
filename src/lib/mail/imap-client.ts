import { ImapFlow } from "imapflow";
import { getMailConfig } from "./email-config";
import { parseEmailSource } from "./parse-message";
import type { InboxMessage } from "./types";

const UID_FOLDER_OFFSET = 10_000_000;

const SENT_FOLDER_CANDIDATES = [
  "INBOX.Sent",
  "Sent",
  "Sent Items",
  "Sent Mail",
  "[Gmail]/Sent Mail",
  "Verzonden",
];

function toIsoDate(value: Date | string | undefined): string {
  if (!value) return new Date().toISOString();
  if (value instanceof Date) return value.toISOString();
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

function formatAddress(
  list: { name?: string; address?: string }[] | undefined,
): string {
  if (!list?.length) return "";
  return list
    .map((a) => (a.name ? `${a.name} <${a.address}>` : (a.address ?? "")))
    .filter(Boolean)
    .join(", ");
}

async function resolveSentMailboxPath(client: ImapFlow): Promise<string | null> {
  const boxes = await client.list();
  for (const name of SENT_FOLDER_CANDIDATES) {
    if (boxes.some((b) => b.path === name)) return name;
  }
  const fuzzy = boxes.find(
    (b) =>
      /sent|verzonden/i.test(b.path) &&
      !/draft|trash|junk|spam|deleted/i.test(b.path),
  );
  return fuzzy?.path ?? null;
}

async function fetchFromMailbox(
  client: ImapFlow,
  mailboxPath: string,
  direction: InboxMessage["direction"],
  uidOffset: number,
  ourAddr: string,
  limit: number,
): Promise<InboxMessage[]> {
  const messages: InboxMessage[] = [];
  await client.mailboxOpen(mailboxPath);
  const lock = await client.getMailboxLock(mailboxPath);
  try {
    const mb = client.mailbox;
    const total = mb && typeof mb !== "boolean" ? (mb.exists ?? 0) : 0;
    if (total === 0) return [];

    const start = Math.max(1, total - limit + 1);
    const range = `${start}:*`;

    for await (const msg of client.fetch(range, {
      uid: true,
      envelope: true,
      internalDate: true,
      flags: true,
      source: true,
    })) {
      const env = msg.envelope;
      if (!env) continue;

      const from = formatAddress(env.from);
      const to = formatAddress(env.to);
      const fromLower = from.toLowerCase();
      const resolvedDirection: InboxMessage["direction"] =
        direction === "inbound"
          ? fromLower.includes(ourAddr)
            ? "outbound"
            : "inbound"
          : "outbound";

      let preview = "";
      let bodyText = "";
      let bodyHtml: string | null = null;

      const raw = Buffer.isBuffer(msg.source)
        ? msg.source
        : typeof msg.source === "string"
          ? Buffer.from(msg.source)
          : null;

      if (raw?.length) {
        try {
          const parsed = await parseEmailSource(raw);
          preview = parsed.preview;
          bodyText = parsed.bodyText;
          bodyHtml = parsed.bodyHtml;
        } catch {
          preview = "";
        }
      }

      const messageId = env.messageId ?? `${mailboxPath}-uid-${msg.uid}`;

      messages.push({
        uid: uidOffset + msg.uid,
        messageId,
        from,
        to,
        subject: env.subject ?? "(geen onderwerp)",
        date: toIsoDate(msg.internalDate),
        preview,
        bodyText,
        bodyHtml,
        seen: msg.flags?.has("\\Seen") ?? false,
        direction: resolvedDirection,
      });
    }
  } finally {
    lock.release();
  }

  return messages;
}

function dedupeMessages(messages: InboxMessage[]): InboxMessage[] {
  const byId = new Map<string, InboxMessage>();
  for (const m of messages) {
    const key = m.messageId.trim() || `${m.uid}-${m.date}`;
    const existing = byId.get(key);
    if (!existing) {
      byId.set(key, m);
      continue;
    }
    if (m.direction === "outbound" && existing.direction === "inbound") {
      byId.set(key, m);
    }
  }
  return [...byId.values()].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

/** INBOX (ontvangen) + map Verzonden (uitgaand). */
export async function fetchInboxMessages(
  limit = 50,
): Promise<InboxMessage[]> {
  const config = getMailConfig();
  if (!config) throw new Error("MAIL_NOT_CONFIGURED");

  const client = new ImapFlow({
    host: config.imap.host,
    port: config.imap.port,
    secure: config.imap.secure,
    auth: {
      user: config.user,
      pass: config.password,
    },
    logger: false,
  });

  const ourAddr = config.from.toLowerCase();

  await client.connect();

  const inbox = await fetchFromMailbox(
    client,
    "INBOX",
    "inbound",
    0,
    ourAddr,
    limit,
  );

  let sent: InboxMessage[] = [];
  const sentPath = await resolveSentMailboxPath(client);
  if (sentPath) {
    try {
      sent = await fetchFromMailbox(
        client,
        sentPath,
        "outbound",
        UID_FOLDER_OFFSET,
        ourAddr,
        limit,
      );
    } catch {
      sent = [];
    }
  }

  await client.logout();

  return dedupeMessages([...inbox, ...sent]);
}

export async function verifyImapConnection(): Promise<void> {
  const config = getMailConfig();
  if (!config) throw new Error("MAIL_NOT_CONFIGURED");

  const client = new ImapFlow({
    host: config.imap.host,
    port: config.imap.port,
    secure: config.imap.secure,
    auth: { user: config.user, pass: config.password },
    logger: false,
  });

  await client.connect();
  await client.mailboxOpen("INBOX");
  await client.logout();
}
