import { NextRequest, NextResponse } from "next/server";

import { SITE_URL } from "@/lib/site-config";
import {
  getClientAddress,
  createNewsletterConfirmationUrl,
  getNewsletterRateLimitIdentifier,
  getNewsletterSigningSecret,
  keyedNewsletterDigest,
  normalizeNewsletterEmail,
} from "@/lib/newsletter/security";
import {
  releaseNewsletterConfirmationReservation,
  subscribeNewsletter,
} from "@/lib/newsletter/service";
import {
  getNewsletterDeliveryConfig,
  sendNewsletterConfirmationEmail,
} from "@/lib/newsletter/delivery";
import {
  checkAuthRateLimit,
  getRateLimitHeaders,
} from "@/lib/security/auth-rate-limit";
import { resolveSafeRedirectUrl } from "@/lib/security/safe-redirect";

export const runtime = "nodejs";

const MAX_BODY_LENGTH = 8_192;
const CONSENT_POLICY_VERSION =
  process.env.NEWSLETTER_CONSENT_VERSION?.trim() || "2026-08-09";
const SUBSCRIBE_RATE_LIMIT = {
  scope: "newsletter:subscribe",
  limit: 6,
  windowSeconds: 10 * 60,
  blockSeconds: 30 * 60,
} as const;

type SubscriptionBody = {
  email?: unknown;
  consent?: unknown;
  website?: unknown;
  company?: unknown;
  formStartedAt?: unknown;
  returnTo?: unknown;
};

type ParsedBody =
  | { ok: true; body: SubscriptionBody; isForm: boolean }
  | { ok: false; status: 400 | 413 | 415; isForm: boolean };

function formDataToBody(formData: FormData): SubscriptionBody {
  return {
    email: formData.get("email"),
    consent: formData.get("consent"),
    website: formData.get("website"),
    company: formData.get("company"),
    formStartedAt: formData.get("formStartedAt"),
    returnTo: formData.get("returnTo"),
  };
}

async function readSubscriptionBody(request: NextRequest): Promise<ParsedBody> {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  const isForm =
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data");
  const contentLength = Number(request.headers.get("content-length") ?? 0);

  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_LENGTH) {
    return { ok: false, status: 413, isForm };
  }

  try {
    if (contentType.includes("application/json")) {
      const text = await request.text();
      if (text.length > MAX_BODY_LENGTH) return { ok: false, status: 413, isForm: false };

      const body = JSON.parse(text) as unknown;
      if (!body || typeof body !== "object" || Array.isArray(body)) {
        return { ok: false, status: 400, isForm: false };
      }

      return { ok: true, body: body as SubscriptionBody, isForm: false };
    }

    if (contentType.includes("application/x-www-form-urlencoded")) {
      const text = await request.text();
      if (text.length > MAX_BODY_LENGTH) return { ok: false, status: 413, isForm: true };

      const params = new URLSearchParams(text);
      return {
        ok: true,
        isForm: true,
        body: {
          email: params.get("email"),
          consent: params.get("consent"),
          website: params.get("website"),
          company: params.get("company"),
          formStartedAt: params.get("formStartedAt"),
          returnTo: params.get("returnTo"),
        },
      };
    }

    if (contentType.includes("multipart/form-data")) {
      return { ok: true, body: formDataToBody(await request.formData()), isForm: true };
    }
  } catch {
    return { ok: false, status: 400, isForm };
  }

  return { ok: false, status: 415, isForm };
}

function hasExplicitConsent(value: unknown): boolean {
  return (
    value === true ||
    (typeof value === "string" && ["true", "1", "on", "yes"].includes(value.toLowerCase()))
  );
}

function isLikelyBot(body: SubscriptionBody): boolean {
  const honeypot = [body.website, body.company].some(
    (value) => typeof value === "string" && value.trim().length > 0
  );
  if (honeypot) return true;

  if (typeof body.formStartedAt !== "string" && typeof body.formStartedAt !== "number") {
    return false;
  }

  const startedAt = Number(body.formStartedAt);
  return Number.isFinite(startedAt) && Date.now() - startedAt < 800;
}

function getReturnTo(body: SubscriptionBody | null): string | null {
  return typeof body?.returnTo === "string" ? body.returnTo : null;
}

function subscriptionResponse(
  isForm: boolean,
  returnTo: string | null,
  status: number,
  payload: Record<string, unknown>,
  headers: HeadersInit = {}
) {
  if (isForm) {
    const target = resolveSafeRedirectUrl(returnTo, SITE_URL, "/newsletter");
    target.searchParams.set("newsletter", status < 400 ? "success" : "error");
    return NextResponse.redirect(target, 303);
  }

  return NextResponse.json(payload, {
    status,
    headers: { "Cache-Control": "no-store", ...headers },
  });
}

export async function POST(request: NextRequest) {
  const parsed = await readSubscriptionBody(request);
  if (!parsed.ok) {
    return subscriptionResponse(parsed.isForm, null, parsed.status, {
      error: parsed.status === 413 ? "Request too large" : "Invalid request",
    });
  }

  const returnTo = getReturnTo(parsed.body);
  const signingSecret = getNewsletterSigningSecret();
  const deliveryConfig = getNewsletterDeliveryConfig();
  if (!signingSecret || !deliveryConfig) {
    return subscriptionResponse(parsed.isForm, returnTo, 503, {
      error: "Newsletter service is temporarily unavailable",
    });
  }

  const rateLimit = await checkAuthRateLimit({
    ...SUBSCRIBE_RATE_LIMIT,
    identifier: getNewsletterRateLimitIdentifier(request.headers, signingSecret),
  });
  const rateLimitHeaders = getRateLimitHeaders(rateLimit);

  if (!rateLimit.allowed) {
    return subscriptionResponse(parsed.isForm, returnTo, 429, {
      error: "Too many requests. Try again later.",
    }, rateLimitHeaders);
  }

  // Treat tripped bot fields as a successful no-op so they do not reveal the trap.
  if (isLikelyBot(parsed.body)) {
    return subscriptionResponse(parsed.isForm, returnTo, 200, {
      success: true,
      message: "Subscription received.",
    }, rateLimitHeaders);
  }

  const email = normalizeNewsletterEmail(parsed.body.email);
  if (!email || !hasExplicitConsent(parsed.body.consent)) {
    return subscriptionResponse(parsed.isForm, returnTo, 400, {
      error: "Enter a valid email address and consent to receive the newsletter.",
    }, rateLimitHeaders);
  }

  const consentAt = new Date();
  const clientAddress = getClientAddress(request.headers);
  const userAgent = request.headers.get("user-agent")?.slice(0, 512) ?? null;

  try {
    const result = await subscribeNewsletter({
      email,
      source: "site",
      consentAt,
      consentPolicyVersion: CONSENT_POLICY_VERSION,
      consentIpHash: clientAddress
        ? keyedNewsletterDigest("consent-ip", clientAddress, signingSecret)
        : null,
      consentUserAgentHash: userAgent
        ? keyedNewsletterDigest("consent-user-agent", userAgent, signingSecret)
        : null,
      signingSecret,
    });

    if (result.confirmationRequired) {
      try {
        await sendNewsletterConfirmationEmail({
          config: deliveryConfig,
          email,
          confirmationUrl: createNewsletterConfirmationUrl(
            result.confirmationToken,
            SITE_URL
          ),
          idempotencyKey: `newsletter-confirm-${result.subscriberId}-${result.confirmationTokenDigest.slice(0, 16)}`,
        });
      } catch (error) {
        await releaseNewsletterConfirmationReservation(
          result.subscriberId,
          result.confirmationTokenDigest
        ).catch(() => undefined);
        throw error;
      }
    }

    // Deliberately do not reveal whether the normalized address already existed.
    return subscriptionResponse(parsed.isForm, returnTo, 200, {
      success: true,
      message: "If eligible, check your inbox to confirm your subscription.",
    }, rateLimitHeaders);
  } catch (error) {
    // Never log an address, request body, Prisma payload, or unsubscribe token.
    console.error("[api/newsletter] subscription failed", {
      errorType: error instanceof Error ? error.name : "UnknownError",
    });
    return subscriptionResponse(parsed.isForm, returnTo, 503, {
      error: "Newsletter service is temporarily unavailable",
    }, rateLimitHeaders);
  }
}

export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed" },
    {
      status: 405,
      headers: { Allow: "POST", "Cache-Control": "no-store" },
    }
  );
}
