import { prisma } from "@/lib/db/prisma";
import type { InboxMessage, MailInboxCache } from "./types";
import { filterInboxForDisplay } from "./inbox-bounce-filter";

const SYNC_ID = "default";

function rowToMessage(row: {
  uid: string;
  messageId: string | null;
  fromAddr: string;
  toAddr: string;
  subject: string;
  date: Date;
  preview: string;
  bodyText: string | null;
  bodyHtml: string | null;
  seen: boolean;
  direction: "inbound" | "outbound";
}): InboxMessage {
  return {
    uid: Number(row.uid) || 0,
    messageId: row.messageId ?? "",
    from: row.fromAddr,
    to: row.toAddr,
    subject: row.subject,
    date: row.date.toISOString(),
    preview: row.preview,
    bodyText: row.bodyText ?? undefined,
    bodyHtml: row.bodyHtml ?? undefined,
    seen: row.seen,
    direction: row.direction,
  };
}

export async function loadInboxCache(): Promise<MailInboxCache> {
  const [sync, rows] = await Promise.all([
    prisma.inboxSyncState.findUnique({ where: { id: SYNC_ID } }),
    prisma.inboxMessage.findMany({ orderBy: { date: "desc" }, take: 500 }),
  ]);

  return {
    messages: rows.map(rowToMessage),
    syncedAt: sync?.syncedAt?.toISOString() ?? null,
    accountOk: sync?.accountOk ?? undefined,
    lastSyncError: sync?.lastSyncError ?? null,
  };
}

export async function saveInboxCache(
  messages: InboxMessage[],
  meta?: { accountOk?: boolean; lastSyncError?: string | null },
): Promise<MailInboxCache> {
  await prisma.$transaction([
    prisma.inboxMessage.deleteMany(),
    prisma.inboxMessage.createMany({
      data: messages.map((m) => ({
        uid: String(m.uid),
        messageId: m.messageId ?? null,
        fromAddr: m.from,
        toAddr: m.to,
        subject: m.subject,
        date: new Date(m.date),
        preview: m.preview,
        bodyText: m.bodyText ?? null,
        bodyHtml: m.bodyHtml ?? null,
        seen: m.seen,
        direction: m.direction,
      })),
    }),
    prisma.inboxSyncState.upsert({
      where: { id: SYNC_ID },
      create: {
        id: SYNC_ID,
        syncedAt: new Date(),
        accountOk: meta?.accountOk ?? true,
        lastSyncError: meta?.lastSyncError ?? null,
      },
      update: {
        syncedAt: new Date(),
        accountOk: meta?.accountOk ?? true,
        lastSyncError: meta?.lastSyncError ?? null,
      },
    }),
  ]);

  return loadInboxCache();
}

export async function saveSyncError(error: string): Promise<void> {
  await prisma.inboxSyncState.upsert({
    where: { id: SYNC_ID },
    create: {
      id: SYNC_ID,
      accountOk: false,
      lastSyncError: error,
    },
    update: {
      accountOk: false,
      lastSyncError: error,
    },
  });
}

export function inboxStats(messages: InboxMessage[]) {
  const visible = filterInboxForDisplay(messages);
  let inbound = 0;
  let outbound = 0;
  let unread = 0;
  for (const m of visible) {
    if (m.direction === "inbound") inbound++;
    else outbound++;
    if (!m.seen && m.direction === "inbound") unread++;
  }
  return { total: visible.length, inbound, outbound, unread };
}
