import { normalizeEmail, isLikelyGuessedEmail } from "@/lib/bedrijven/contact-utils";
import { loadAllBusinesses } from "@/lib/bedrijven/load-all-businesses";
import {
  DEFAULT_BRANCH,
  type ScrapeBranchId,
} from "@/lib/bedrijven/branches";
import { businessIdToSlug, slugToBusinessId } from "@/lib/bedrijven/slug";
import type { Bedrijf } from "@/lib/bedrijven/types";
import {
  buildOutreachMailSubject,
} from "./outreach-draft";
import { buildDemoBookingUrl } from "./templates";
import { buildOutreachUtmParams } from "./outreach-utm";
import { buildSendBatchId } from "./send-batch";
import { loadDemoClickStatsByTokens } from "./demo-click-stats";
import { ensureMailRecordsBatch, listMailRecords } from "./storage";
import type { MailTemplatePreview } from "./types";
import { resolveAppBaseUrl } from "./app-url";
import { deriveListSendReadiness } from "./demo-outreach-list-readiness";
import { buildDemoOutreachPreview } from "./build-demo-outreach-preview";

type PreparedLead = {
  business: Bedrijf;
  email: string;
};

/** Alle bedrijven met e-mail in de verticale → mail-concept (geen demo-ready / huisstijl). */
async function prepareOutreachLeads(
  branchId: ScrapeBranchId,
): Promise<{
  prepared: PreparedLead[];
  recordByBiz: Map<string, Awaited<ReturnType<typeof listMailRecords>>[number]>;
}> {
  const businesses = await loadAllBusinesses(branchId);
  const records = await listMailRecords();
  const recordByBiz = new Map(records.map((r) => [r.businessId, r]));

  const prepared: PreparedLead[] = [];

  for (const business of businesses) {
    const email = normalizeEmail(business.email);
    if (!email) continue;
    prepared.push({
      business: { ...business, email, branchId: business.branchId ?? branchId },
      email,
    });
  }

  const missingRecords = prepared.filter(
    (p) => !recordByBiz.has(p.business.id),
  );
  if (missingRecords.length > 0) {
    const batch = await ensureMailRecordsBatch(
      missingRecords.map((p) => ({
        businessId: p.business.id,
        recipientEmail: p.email,
      })),
    );
    for (const [id, rec] of batch) recordByBiz.set(id, rec);
  }

  return { prepared, recordByBiz };
}

/** Lichte verzendlijst (metadata); HTML via getDemoOutreachPreviewBySlug. */
export async function listDemoOutreachTemplates(
  locale: string,
  request?: Request,
  branchId: ScrapeBranchId = DEFAULT_BRANCH,
): Promise<MailTemplatePreview[]> {
  const { prepared, recordByBiz } = await prepareOutreachLeads(branchId);
  const baseUrl = resolveAppBaseUrl(request);
  const out: MailTemplatePreview[] = [];

  for (const { business, email } of prepared) {
    const record = recordByBiz.get(business.id);
    if (!record) continue;

    const sendBatchPreview = buildSendBatchId(branchId);
    const utm = buildOutreachUtmParams({
      branchId,
      sendBatch: sendBatchPreview,
      mailKind: "initial",
    });
    const demoUrl = buildDemoBookingUrl(baseUrl, locale, record.token, utm);
    const subject = buildOutreachMailSubject(branchId, business.name);
    const { sendReady, sendBlockers } = deriveListSendReadiness(
      business,
      email,
      record.status,
    );

    out.push({
      businessId: business.id,
      slug: businessIdToSlug(business.id),
      businessName: business.name,
      city: business.city || "—",
      email,
      subject,
      plainBody: "",
      htmlBody: "",
      demoUrl,
      logoPath: null,
      source: "outreach",
      token: record.token,
      status: record.status,
      sentAt: record.sentAt,
      followupSentAt: record.followupSentAt,
      sendBatch: record.sendBatch,
      pipelineStatus: record.pipelineStatus,
      emailGuessed: isLikelyGuessedEmail(email, business.website),
      sendReady,
      sendBlockers,
    });
  }

  out.sort((a, b) => a.businessName.localeCompare(b.businessName, "nl"));

  const clickByToken = await loadDemoClickStatsByTokens(
    out.map((row) => row.token),
  );
  for (const row of out) {
    const clicks = clickByToken.get(row.token);
    if (!clicks) continue;
    row.demoVisited = true;
    row.demoClickCount = clicks.clickCount;
    row.demoSessionCount = clicks.sessionCount;
    row.demoFirstClickAt = clicks.firstClickedAt ?? undefined;
    row.demoLastClickAt = clicks.lastClickedAt ?? undefined;
  }

  return out;
}

/** Volledige HTML-preview voor één lead (admin detail-paneel). */
export async function getDemoOutreachPreviewBySlug(
  locale: string,
  request: Request | undefined,
  branchId: ScrapeBranchId,
  slug: string,
  options?: { includeFollowup?: boolean },
): Promise<MailTemplatePreview | null> {
  const businessId = slugToBusinessId(slug);
  const ctx = await prepareOutreachLeads(branchId);
  const prep = ctx.prepared.find((p) => p.business.id === businessId);
  if (!prep) return null;

  const record = ctx.recordByBiz.get(businessId);
  if (!record) return null;

  const preview = await buildDemoOutreachPreview(
    locale,
    request,
    branchId,
    prep.business,
    prep.email,
    record,
    options,
  );

  const clicks = await loadDemoClickStatsByTokens([record.token]);
  const click = clicks.get(record.token);
  if (click) {
    preview.demoVisited = true;
    preview.demoClickCount = click.clickCount;
    preview.demoSessionCount = click.sessionCount;
    preview.demoFirstClickAt = click.firstClickedAt ?? undefined;
    preview.demoLastClickAt = click.lastClickedAt ?? undefined;
  }

  return preview;
}
