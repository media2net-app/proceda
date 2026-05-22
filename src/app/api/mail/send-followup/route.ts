import { NextResponse } from "next/server";
import { businessIdToSlug, slugToBusinessId } from "@/lib/bedrijven/slug";
import { isMailConfigured } from "@/lib/mail/email-config";
import { resolveFollowupMailForBusiness } from "@/lib/mail/resolve-followup-mail";
import { sendOutreachEmail } from "@/lib/mail/smtp-client";
import {
  assertMailFollowupEligible,
  markMailFollowupSent,
} from "@/lib/mail/storage";

export async function POST(request: Request) {
  try {
    if (!isMailConfigured()) {
      return NextResponse.json({ error: "MAIL_NOT_CONFIGURED" }, { status: 503 });
    }

    const body = (await request.json()) as {
      slug?: string;
      email?: string;
      businessName?: string;
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

    if (!body.testMode) {
      try {
        await assertMailFollowupEligible(businessId);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "";
        if (msg === "FOLLOWUP_ALREADY_SENT") {
          return NextResponse.json({ error: "FOLLOWUP_ALREADY_SENT" }, { status: 409 });
        }
        if (msg === "ALREADY_BOOKED") {
          return NextResponse.json({ error: "ALREADY_BOOKED" }, { status: 409 });
        }
        if (msg === "FOLLOWUP_REQUIRES_SENT") {
          return NextResponse.json({ error: "FOLLOWUP_REQUIRES_SENT" }, { status: 409 });
        }
        throw e;
      }
    }

    const resolved = await resolveFollowupMailForBusiness(
      businessId,
      locale,
      request,
      body.email?.trim(),
      body.businessName?.trim(),
    );
    if (!resolved) {
      return NextResponse.json(
        { error: "NOT_ELIGIBLE_FOR_FOLLOWUP" },
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
      : await markMailFollowupSent(businessId);

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
