import { NextResponse } from "next/server";
import { businessIdToSlug, slugToBusinessId } from "@/lib/bedrijven/slug";
import { isMailConfigured } from "@/lib/mail/email-config";
import { resolveOutreachMailForBusiness } from "@/lib/mail/resolve-outreach-mail";
import { sendOutreachEmail } from "@/lib/mail/smtp-client";
import { markMailSent } from "@/lib/mail/storage";

export async function POST(request: Request) {
  try {
    if (!isMailConfigured()) {
      return NextResponse.json({ error: "MAIL_NOT_CONFIGURED" }, { status: 503 });
    }

    const body = (await request.json()) as {
      slug?: string;
      email?: string;
      businessName?: string;
      /** Verstuur naar testadres zonder lead-status op "verstuurd" te zetten */
      testMode?: boolean;
    };
    if (!body.slug?.trim()) {
      return NextResponse.json({ error: "SLUG_REQUIRED" }, { status: 400 });
    }

    const businessId = slugToBusinessId(body.slug);
    const locale =
      request.headers.get("x-locale") ??
      new URL(request.url).searchParams.get("locale") ??
      "nl";

    const resolved = await resolveOutreachMailForBusiness(
      businessId,
      locale,
      request,
      body.email?.trim(),
      body.businessName?.trim(),
    );
    if (!resolved) {
      return NextResponse.json(
        { error: "NOT_DEMO_READY_OR_NO_EMAIL" },
        { status: 404 },
      );
    }

    const { subject, plainBody, htmlBody } = resolved;
    const recipient = resolved.business.email!.trim();

    const sent = await sendOutreachEmail({
      to: recipient,
      subject,
      text: plainBody,
      html: htmlBody,
      attachments: resolved.attachments,
    });

    const record = body.testMode
      ? resolved.record
      : await markMailSent(businessId, recipient);

    return NextResponse.json({
      record,
      messageId: sent.messageId,
      slug: businessIdToSlug(businessId),
      testMode: !!body.testMode,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Send failed";
    const status =
      message === "MAIL_NOT_CONFIGURED"
        ? 503
        : message.includes("Invalid") || message.includes("recipient")
          ? 400
          : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
