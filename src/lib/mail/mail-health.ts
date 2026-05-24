import "server-only";

import { promises as dns } from "node:dns";
import { prisma } from "@/lib/db/prisma";
import { getMailConfig, isMailConfigured } from "@/lib/mail/email-config";
import { listRecentBounces } from "@/lib/mail/sync-bounces-from-inbox";
import {
  ADMIN_VERTICAL_ALL,
  type AdminVerticalScope,
  OUTREACH_BRANCH_IDS,
} from "@/lib/bedrijven/outreach-branches";

export type MailHealthReport = {
  configured: boolean;
  fromDomain: string | null;
  sentToday: number;
  dailyCap: number;
  capRemaining: number;
  bounceCount: number;
  suppressCount: number;
  dns: {
    spf: "ok" | "missing" | "unknown";
    dmarc: "ok" | "missing" | "unknown";
    dkimHint: string;
  };
  checklist: { id: string; ok: boolean; label: string }[];
  recentBounces: { email: string; reason?: string; createdAt: string }[];
  updatedAt: string;
};

function mailDomain(from: string): string | null {
  const at = from.lastIndexOf("@");
  if (at < 0) return null;
  return from.slice(at + 1).toLowerCase();
}

async function txtRecords(host: string): Promise<string[]> {
  try {
    const rows = await dns.resolveTxt(host);
    return rows.map((parts) => parts.join(""));
  } catch {
    return [];
  }
}

export async function getMailHealthReport(
  scope: AdminVerticalScope,
): Promise<MailHealthReport> {
  const config = getMailConfig();
  const fromDomain = config ? mailDomain(config.from) : null;
  const dailyCap = Math.max(
    10,
    Number.parseInt(process.env.OUTREACH_DAILY_SEND_CAP ?? "1000", 10) || 1000,
  );

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [sentToday, bounceCount, suppressCount] = await Promise.all([
    prisma.mailOutreach.count({
      where: { sentAt: { gte: startOfDay } },
    }),
    prisma.mailBounce.count({
      where: { createdAt: { gte: new Date(Date.now() - 30 * 86400000) } },
    }),
    prisma.mailOutreach.count({
      where: {
        doNotMail: true,
        business:
          scope === ADMIN_VERTICAL_ALL
            ? { branchId: { in: [...OUTREACH_BRANCH_IDS] } }
            : { branchId: scope },
      },
    }),
  ]);

  let spf: MailHealthReport["dns"]["spf"] = "unknown";
  let dmarc: MailHealthReport["dns"]["dmarc"] = "unknown";

  if (fromDomain) {
    const rootTxt = await txtRecords(fromDomain);
    spf = rootTxt.some((t) => t.toLowerCase().includes("v=spf1"))
      ? "ok"
      : "missing";
    const dmarcTxt = await txtRecords(`_dmarc.${fromDomain}`);
    dmarc = dmarcTxt.some((t) => t.toLowerCase().includes("v=dmarc1"))
      ? "ok"
      : "missing";
  }

  const capRemaining = Math.max(0, dailyCap - sentToday);
  const recentBounces = await listRecentBounces(8);

  const checklist = [
    {
      id: "configured",
      ok: isMailConfigured(),
      label: "SMTP/IMAP geconfigureerd",
    },
    {
      id: "spf",
      ok: spf === "ok",
      label: `SPF record op ${fromDomain ?? "—"}`,
    },
    {
      id: "dmarc",
      ok: dmarc === "ok",
      label: `DMARC record op ${fromDomain ?? "—"}`,
    },
    {
      id: "cap",
      ok: capRemaining > 0,
      label: `Dagcap: ${sentToday}/${dailyCap} verstuurd`,
    },
    {
      id: "bounces",
      ok: bounceCount < 5,
      label: `Bounces (30d): ${bounceCount}`,
    },
  ];

  return {
    configured: isMailConfigured(),
    fromDomain,
    sentToday,
    dailyCap,
    capRemaining,
    bounceCount,
    suppressCount,
    dns: {
      spf,
      dmarc,
      dkimHint: "Voeg DKIM toe in Hostinger → Email → DNS (selector hostinger)",
    },
    checklist,
    recentBounces,
    updatedAt: new Date().toISOString(),
  };
}
