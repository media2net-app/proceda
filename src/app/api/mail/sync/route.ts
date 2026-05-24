import { NextResponse } from "next/server";
import { isMailConfigured } from "@/lib/mail/email-config";
import { fetchInboxMessages } from "@/lib/mail/imap-client";
import {
  saveInboxCache,
  saveSyncError,
  inboxStats,
} from "@/lib/mail/inbox-storage";
import { filterInboxForDisplay } from "@/lib/mail/inbox-bounce-filter";
import { verifyImapConnection } from "@/lib/mail/imap-client";
import { syncBouncesFromInbox } from "@/lib/mail/sync-bounces-from-inbox";

export async function POST() {
  try {
    if (!isMailConfigured()) {
      return NextResponse.json({ error: "MAIL_NOT_CONFIGURED" }, { status: 503 });
    }

    await verifyImapConnection();
    const messages = await fetchInboxMessages(50);
    const cache = await saveInboxCache(messages, {
      accountOk: true,
      lastSyncError: null,
    });
    const stats = inboxStats(messages);
    const bounceSync = await syncBouncesFromInbox();
    const visibleMessages = filterInboxForDisplay(cache.messages);

    return NextResponse.json({
      messages: visibleMessages,
      syncedAt: cache.syncedAt,
      stats,
      connected: true,
      unread: stats.unread,
      bounceSync,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Sync failed";
    await saveSyncError(message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
