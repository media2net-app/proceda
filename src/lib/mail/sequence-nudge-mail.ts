import { buildDemoBookingUrl } from "./templates";

export function buildSequenceNudgeMail(params: {
  businessName: string;
  demoUrl: string;
  dayLabel: "7" | "14";
}): { subject: string; plainBody: string; htmlBody: string } {
  const { businessName, demoUrl, dayLabel } = params;
  const subject =
    dayLabel === "14"
      ? `Laatste reminder — demo ${businessName}?`
      : `Nog interesse in een korte demo, ${businessName}?`;

  const plainBody = `Beste ${businessName},

Een korte reminder: je kunt nog steeds een vrijblijvende demo van 30 minuten plannen. We laten dan je maatwerk dashboard live zien.

Plan hier: ${demoUrl}

Geen interesse? Antwoord met "stop" — dan mailen we je niet meer.

Met vriendelijke groet,
Proceda`;

  const htmlBody = `<p>Beste ${escapeHtml(businessName)},</p>
<p>Een korte reminder: je kunt nog steeds een vrijblijvende demo van 30 minuten plannen. We laten dan je maatwerk dashboard live zien.</p>
<p><a href="${escapeAttr(demoUrl)}" style="display:inline-block;background:#7F56D9;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;">Plan demo (30 min)</a></p>
<p style="color:#667085;font-size:13px;">Geen interesse? Antwoord met &quot;stop&quot; — dan mailen we je niet meer.</p>
<p>Met vriendelijke groet,<br/>Proceda</p>`;

  return { subject, plainBody, htmlBody };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(s: string): string {
  return escapeHtml(s);
}

export { buildDemoBookingUrl };
