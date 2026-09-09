import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const EMAIL_LOCAL_MAX_LENGTH = 64;
const EMAIL_DOMAIN_MAX_LENGTH = 255;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const OPAQUE_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export function getNewsletterSigningSecret(): string | null {
  const secret = process.env.NEWSLETTER_SIGNING_SECRET?.trim() ?? "";
  return secret.length >= 32 ? secret : null;
}

export function normalizeNewsletterEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const email = value.trim().toLowerCase();
  if (!email || email.length > 320 || /[\u0000-\u0020\u007f]/.test(email)) {
    return null;
  }

  const atIndex = email.lastIndexOf("@");
  if (atIndex <= 0 || atIndex !== email.indexOf("@")) return null;

  const local = email.slice(0, atIndex);
  const domain = email.slice(atIndex + 1);
  if (
    local.length > EMAIL_LOCAL_MAX_LENGTH ||
    domain.length === 0 ||
    domain.length > EMAIL_DOMAIN_MAX_LENGTH ||
    local.startsWith(".") ||
    local.endsWith(".") ||
    local.includes("..") ||
    !/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+$/i.test(local)
  ) {
    return null;
  }

  const labels = domain.split(".");
  if (labels.length < 2) return null;

  const validDomain = labels.every(
    (label) =>
      label.length > 0 &&
      label.length <= 63 &&
      /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i.test(label)
  );

  return validDomain ? email : null;
}

export function keyedNewsletterDigest(
  purpose: string,
  value: string,
  secret: string
): string {
  return createHmac("sha256", secret)
    .update(purpose, "utf8")
    .update("\0", "utf8")
    .update(value, "utf8")
    .digest("hex");
}

export function getClientAddress(headers: Headers): string | null {
  const forwardedFor = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const address = forwardedFor || headers.get("x-real-ip")?.trim() || null;
  return address ? address.slice(0, 128) : null;
}

export function getNewsletterRateLimitIdentifier(headers: Headers, secret: string): string {
  const address = getClientAddress(headers) ?? "unknown";
  return `newsletter:${keyedNewsletterDigest("rate-limit", address, secret)}`;
}

export function createNewsletterConfirmationToken(): string {
  return randomBytes(32).toString("base64url");
}

export function getNewsletterConfirmationTokenDigest(
  token: unknown,
  secret: string
): string | null {
  if (typeof token !== "string" || !OPAQUE_TOKEN_PATTERN.test(token)) return null;
  return keyedNewsletterDigest("confirmation", token, secret);
}

export function createNewsletterConfirmationUrl(
  token: string,
  siteUrl: string | URL
): URL {
  const url = new URL("/api/newsletter/confirm", siteUrl);
  url.searchParams.set("token", token);
  return url;
}

export function createNewsletterUnsubscribeToken(
  subscriberId: string,
  secret: string
): string {
  const signature = createHmac("sha256", secret)
    .update(`unsubscribe:${subscriberId}`, "utf8")
    .digest("base64url");

  return `${subscriberId}.${signature}`;
}

export function createNewsletterUnsubscribeUrl(
  subscriberId: string,
  secret: string,
  siteUrl: string | URL
): URL {
  const url = new URL("/api/newsletter/unsubscribe", siteUrl);
  url.searchParams.set(
    "token",
    createNewsletterUnsubscribeToken(subscriberId, secret)
  );
  return url;
}

export function verifyNewsletterUnsubscribeToken(
  token: unknown,
  secret: string
): string | null {
  if (typeof token !== "string" || token.length > 160) return null;

  const separator = token.indexOf(".");
  if (separator <= 0 || separator !== token.lastIndexOf(".")) return null;

  const subscriberId = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  if (!UUID_PATTERN.test(subscriberId) || !/^[A-Za-z0-9_-]{43}$/.test(signature)) {
    return null;
  }

  const expected = createNewsletterUnsubscribeToken(subscriberId, secret).slice(separator + 1);
  const actualBuffer = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");

  if (
    actualBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(actualBuffer, expectedBuffer)
  ) {
    return null;
  }

  return subscriberId;
}
