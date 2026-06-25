/**
 * Thin Resend REST client (https://resend.com/docs/api-reference/emails).
 * Uses fetch directly so no extra dependency is required.
 */

type Attachment = {
  filename: string;
  /** Base64-encoded file content. */
  content: string;
};

type SendEmailArgs = {
  to: string;
  subject: string;
  html: string;
  attachments?: Attachment[];
};

export async function sendEmail({ to, subject, html, attachments }: SendEmailArgs) {
  const apiKey = process.env.RESEND_API_KEY;
  const domain = process.env.RESEND_DOMAIN;

  if (!apiKey || !domain) {
    throw new Error("RESEND_API_KEY / RESEND_DOMAIN are not configured.");
  }

  const fromName = process.env.COMPANY_NAME || "shahriar";

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `${fromName} <noreply@${domain}>`,
      to: [to],
      subject,
      html,
      attachments,
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Resend request failed (${res.status}): ${detail}`);
  }

  return res.json();
}
