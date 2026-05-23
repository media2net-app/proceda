import "server-only";

export async function notifySlackOutreachEvent(payload: {
  text: string;
  blocks?: unknown[];
}): Promise<boolean> {
  const url = process.env.SLACK_WEBHOOK_URL?.trim();
  if (!url) return false;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch (e) {
    console.error("[slack-notify]", e);
    return false;
  }
}

export async function notifySlackBookingConfirmed(input: {
  businessName: string;
  scheduledAt: string;
  email?: string;
}): Promise<void> {
  const when = new Date(input.scheduledAt).toLocaleString("nl-NL", {
    timeZone: "Europe/Amsterdam",
    dateStyle: "medium",
    timeStyle: "short",
  });
  void notifySlackOutreachEvent({
    text: `Demo geboekt: ${input.businessName} · ${when}`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Demo geboekt*\n*${input.businessName}*\n${when}${input.email ? `\n${input.email}` : ""}`,
        },
      },
    ],
  });
}
