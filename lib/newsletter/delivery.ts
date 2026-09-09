import "server-only";

type NewsletterDeliveryConfig = {
  apiKey: string;
  from: string;
  replyTo?: string;
};

export function getNewsletterDeliveryConfig(): NewsletterDeliveryConfig | null {
  const apiKey = process.env.RESEND_API_KEY?.trim() ?? "";
  const from = process.env.NEWSLETTER_FROM_EMAIL?.trim() ?? "";
  const replyTo = process.env.NEWSLETTER_REPLY_TO?.trim() || undefined;
  if (!apiKey || !from || from.length > 320 || (replyTo && replyTo.length > 320)) {
    return null;
  }
  return { apiKey, from, replyTo };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export async function sendNewsletterConfirmationEmail(input: {
  config: NewsletterDeliveryConfig;
  email: string;
  confirmationUrl: URL;
  idempotencyKey: string;
}): Promise<void> {
  const confirmationUrl = input.confirmationUrl.toString();
  const safeUrl = escapeHtml(confirmationUrl);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.config.apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": input.idempotencyKey.slice(0, 256),
      "User-Agent": "TheSnapNewsletter/1.0",
    },
    body: JSON.stringify({
      from: input.config.from,
      to: [input.email],
      subject: "Confirm your subscription to The Snap",
      html: `<p>Confirm that you want to receive The Snap newsletter.</p><p><a href="${safeUrl}">Confirm my subscription</a></p><p>This link expires in 24 hours. If you did not request this, you can ignore this email.</p>`,
      text: `Confirm that you want to receive The Snap newsletter:\n\n${confirmationUrl}\n\nThis link expires in 24 hours. If you did not request this, you can ignore this email.`,
      ...(input.config.replyTo ? { reply_to: input.config.replyTo } : {}),
    }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error(`Newsletter confirmation delivery failed (${response.status})`);
  }
}
