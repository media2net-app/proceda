import "server-only";

import { prisma } from "@/lib/db/prisma";
import { normalizeEmail } from "@/lib/bedrijven/contact-utils";
import {
  ADMIN_VERTICAL_ALL,
  type AdminVerticalScope,
  outreachBranchesForScope,
} from "@/lib/bedrijven/outreach-branches";
import {
  loadAllBusinesses,
  loadOutreachPipelineBusinesses,
} from "@/lib/bedrijven/load-all-businesses";
import { loadDemoClickStatsByTokens } from "@/lib/mail/demo-click-stats";
import { listDemoOutreachTemplates } from "@/lib/mail/list-demo-outreach";
import { loadInboxCache } from "@/lib/mail/inbox-storage";
import { filterInboxForDisplay } from "@/lib/mail/inbox-bounce-filter";
import type { MailTemplatePreview } from "@/lib/mail/types";

export type ActionQueueItem = {
  id: string;
  type: "followup" | "call" | "reply" | "post_call";
  businessId: string;
  businessName: string;
  email?: string;
  phone?: string;
  reason: string;
  priority: number;
  href: string;
  meta?: Record<string, string>;
};

export type OutreachActionQueue = {
  branchId: AdminVerticalScope;
  updatedAt: string;
  items: ActionQueueItem[];
  counts: Record<ActionQueueItem["type"], number>;
};

const DAY_MS = 24 * 60 * 60 * 1000;

function extractEmailFromHeader(from: string): string | null {
  const match = from.match(/<([^>]+)>/);
  const raw = (match?.[1] ?? from).trim().toLowerCase();
  if (!raw.includes("@")) return null;
  return normalizeEmail(raw) ?? null;
}

async function loadPreviewsForScope(
  scope: AdminVerticalScope,
  locale: string,
): Promise<MailTemplatePreview[]> {
  const branches = outreachBranchesForScope(scope);
  const batches = await Promise.all(
    branches.map((b) => listDemoOutreachTemplates(locale, undefined, b)),
  );
  if (scope === ADMIN_VERTICAL_ALL) {
    const byBusiness = new Map<string, MailTemplatePreview>();
    for (const batch of batches) {
      for (const p of batch) byBusiness.set(p.businessId, p);
    }
    return [...byBusiness.values()];
  }
  return batches[0] ?? [];
}

export async function getOutreachActionQueue(
  scope: AdminVerticalScope,
  locale = "nl",
): Promise<OutreachActionQueue> {
  const branchSet = new Set<string>(outreachBranchesForScope(scope));
  const previews = await loadPreviewsForScope(scope, locale);
  const businesses =
    scope === ADMIN_VERTICAL_ALL
      ? await loadOutreachPipelineBusinesses()
      : await loadAllBusinesses(scope);
  const byId = new Map(businesses.map((b) => [b.id, b]));
  const tokens = previews.map((p) => p.token);
  const clickByToken = await loadDemoClickStatsByTokens(tokens);

  const items: ActionQueueItem[] = [];
  const now = Date.now();
  const yesterday = new Date(now - DAY_MS);

  const sentTokens = previews
    .filter((p) => p.status === "sent")
    .map((p) => p.token);

  const engagedTokenRows =
    sentTokens.length > 0
      ? await prisma.analyticsSession.findMany({
          where: {
            mailToken: { in: sentTokens },
            bookingActive: true,
            lastSeenAt: { gte: yesterday },
          },
          select: { mailToken: true },
        })
      : [];
  const engagedTokens = new Set(
    engagedTokenRows.map((r) => r.mailToken).filter(Boolean) as string[],
  );

  for (const p of previews) {
    const biz = byId.get(p.businessId);
    const name = p.businessName || biz?.name || p.businessId;

    if (
      p.status === "sent" &&
      (p.demoVisited || clickByToken.has(p.token)) &&
      !p.followupSentAt &&
      p.followupHtmlBody
    ) {
      items.push({
        id: `followup-${p.businessId}`,
        type: "followup",
        businessId: p.businessId,
        businessName: name,
        email: p.email ?? biz?.email,
        phone: biz?.phone,
        reason: "Demo-link geopend, follow-up nog niet verstuurd",
        priority: 90,
        href: "/dashboard-admin/mail",
        meta: { token: p.token },
      });
    }

    if (
      p.status === "sent" &&
      engagedTokens.has(p.token) &&
      clickByToken.has(p.token)
    ) {
      items.push({
        id: `call-${p.businessId}`,
        type: "call",
        businessId: p.businessId,
        businessName: name,
        email: p.email ?? biz?.email,
        phone: biz?.phone,
        reason: "Boekingsformulier gebruikt, nog niet geboekt (24u)",
        priority: 95,
        href: "/dashboard-admin/mail",
      });
    }
  }

  const inbox = filterInboxForDisplay(
    (await loadInboxCache()).messages,
  );
  const emailToBusiness = new Map<string, string>();
  for (const b of businesses) {
    if (b.branchId && !branchSet.has(b.branchId)) continue;
    const em = b.email ? normalizeEmail(b.email) : null;
    if (em) emailToBusiness.set(em, b.id);
  }

  for (const msg of inbox) {
    if (msg.direction !== "inbound") continue;
    const fromEmail = extractEmailFromHeader(msg.from);
    if (!fromEmail) continue;
    const businessId = emailToBusiness.get(fromEmail);
    if (!businessId) continue;
    const biz = byId.get(businessId);
    if (!biz) continue;
    const preview = previews.find((p) => p.businessId === businessId);
    if (preview?.status !== "sent" && preview?.status !== "booked") continue;

    items.push({
      id: `reply-${msg.uid}`,
      type: "reply",
      businessId,
      businessName: biz.name,
      email: biz.email,
      phone: biz.phone,
      reason: `Inbox: ${msg.subject.slice(0, 60)}`,
      priority: msg.seen ? 70 : 85,
      href: "/dashboard-admin/mail",
      meta: { date: msg.date },
    });
  }

  const recentAppointments = await prisma.appointment.findMany({
    where: {
      scheduledAt: { gte: yesterday, lt: new Date() },
      status: "scheduled",
      source: "auto_mail",
    },
    take: 50,
  });

  for (const apt of recentAppointments) {
    if (!apt.businessId) continue;
    const biz = byId.get(apt.businessId);
    if (!biz) continue;
    if (biz.branchId && !branchSet.has(biz.branchId)) {
      continue;
    }
    items.push({
      id: `postcall-${apt.id}`,
      type: "post_call",
      businessId: apt.businessId,
      businessName: apt.businessName,
      email: apt.email ?? undefined,
      phone: apt.phone ?? undefined,
      reason: "Call gepland — status bijwerken na gesprek",
      priority: 60,
      href: "/dashboard-admin/afspraken",
      meta: { scheduledAt: apt.scheduledAt.toISOString() },
    });
  }

  items.sort((a, b) => b.priority - a.priority);

  const counts = {
    followup: items.filter((i) => i.type === "followup").length,
    call: items.filter((i) => i.type === "call").length,
    reply: items.filter((i) => i.type === "reply").length,
    post_call: items.filter((i) => i.type === "post_call").length,
  };

  return {
    branchId: scope,
    updatedAt: new Date().toISOString(),
    items: items.slice(0, 50),
    counts,
  };
}
