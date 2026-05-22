import { NextResponse } from "next/server";
import { isMailConfigured, getMailConfig } from "@/lib/mail/email-config";
import { loadInboxCache, inboxStats } from "@/lib/mail/inbox-storage";

export async function GET() {
  const configured = isMailConfigured();
  const config = getMailConfig();
  const cache = await loadInboxCache();
  const stats = inboxStats(cache.messages);

  return NextResponse.json({
    configured,
    connected: configured && (cache.accountOk !== false) && !cache.lastSyncError,
    syncedAt: cache.syncedAt,
    unread: stats.unread,
    inboxTotal: stats.total,
    lastSyncError: cache.lastSyncError ?? null,
    from: config?.from,
  });
}
