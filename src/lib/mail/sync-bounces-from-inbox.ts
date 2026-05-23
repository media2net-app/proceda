import "server-only";

import { prisma } from "@/lib/db/prisma";
import { normalizeEmail } from "@/lib/bedrijven/contact-utils";
import { loadInboxCache } from "@/lib/mail/inbox-storage";
import { setMailDoNotMail } from "@/lib/mail/storage";
import { logOutreachAudit } from "@/lib/outreach/outreach-audit";

const BOUNCE_SUBJECT =
  /undeliver|delivery status|mail delivery failed|returned mail|failure notice|niet afgeleverd|permanent error|mailer-daemon|postmaster/i;

function extractEmails(text: string): string[] {
  const matches = text.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi) ?? [];
  const out = new Set<string>();
  for (const raw of matches) {
    const n = normalizeEmail(raw);
    if (n && !n.includes("mailer-daemon") && !n.includes("postmaster")) {
      out.add(n);
    }
  }
  return [...out];
}

export type BounceSyncResult = {
  scanned: number;
  newBounces: number;
  suppressed: number;
};

export async function syncBouncesFromInbox(): Promise<BounceSyncResult> {
  const inbox = await loadInboxCache();
  let newBounces = 0;
  let suppressed = 0;

  for (const msg of inbox.messages) {
    if (msg.direction !== "inbound") continue;
    const hay = `${msg.subject} ${msg.preview} ${msg.bodyText ?? ""}`;
    if (!BOUNCE_SUBJECT.test(hay)) continue;

    const emails = extractEmails(hay);
    for (const email of emails) {
      const existing = await prisma.mailBounce.findFirst({
        where: { email },
        orderBy: { createdAt: "desc" },
      });
      if (existing) continue;

      const outreach = await prisma.mailOutreach.findFirst({
        where: { recipientEmail: email },
        select: { businessId: true },
      });

      await prisma.mailBounce.create({
        data: {
          email,
          businessId: outreach?.businessId ?? null,
          reason: msg.subject.slice(0, 200),
          source: "inbox",
        },
      });
      newBounces++;

      if (outreach?.businessId) {
        await setMailDoNotMail(outreach.businessId, true);
        void logOutreachAudit({
          action: "suppress",
          businessId: outreach.businessId,
          metadata: { reason: "bounce_detected", email },
        }).catch(() => {});
        suppressed++;
      }
    }
  }

  return { scanned: inbox.messages.length, newBounces, suppressed };
}

export async function listRecentBounces(limit = 10) {
  const rows = await prisma.mailBounce.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.map((r) => ({
    id: r.id,
    email: r.email,
    businessId: r.businessId ?? undefined,
    reason: r.reason ?? undefined,
    createdAt: r.createdAt.toISOString(),
  }));
}
