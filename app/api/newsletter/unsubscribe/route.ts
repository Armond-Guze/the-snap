import { NextRequest, NextResponse } from "next/server";

import {
  getNewsletterRateLimitIdentifier,
  getNewsletterSigningSecret,
  verifyNewsletterUnsubscribeToken,
} from "@/lib/newsletter/security";
import { unsubscribeNewsletterById } from "@/lib/newsletter/service";
import {
  checkAuthRateLimit,
  getRateLimitHeaders,
} from "@/lib/security/auth-rate-limit";

export const runtime = "nodejs";

const UNSUBSCRIBE_RATE_LIMIT = {
  scope: "newsletter:unsubscribe",
  limit: 20,
  windowSeconds: 10 * 60,
  blockSeconds: 30 * 60,
} as const;

function htmlPage(title: string, body: string, status = 200): Response {
  return new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${title}</title><style>body{margin:0;background:#050505;color:#f5f5f5;font-family:system-ui,sans-serif}main{max-width:36rem;margin:12vh auto;padding:2rem}section{border:1px solid #333;border-radius:1rem;padding:2rem;background:#111}button{border:0;border-radius:999px;padding:.8rem 1.2rem;font-weight:700;cursor:pointer}p{color:#bbb;line-height:1.6}</style></head><body><main><section>${body}</section></main></body></html>`,
    {
      status,
      headers: {
        "Cache-Control": "no-store",
        "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
        "Content-Type": "text/html; charset=utf-8",
        "Referrer-Policy": "no-referrer",
        "X-Content-Type-Options": "nosniff",
      },
    }
  );
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

async function readToken(request: NextRequest): Promise<{ token: unknown; isJson: boolean }> {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  if (contentType.includes("application/json")) {
    const body = (await request.json().catch(() => null)) as { token?: unknown } | null;
    return { token: body?.token, isJson: true };
  }

  const formData = await request.formData().catch(() => null);
  return { token: formData?.get("token"), isJson: false };
}

export async function GET(request: NextRequest) {
  const signingSecret = getNewsletterSigningSecret();
  if (!signingSecret) {
    return htmlPage(
      "Newsletter unavailable",
      "<h1>Newsletter unavailable</h1><p>Please try again later.</p>",
      503
    );
  }

  const token = request.nextUrl.searchParams.get("token");
  if (!verifyNewsletterUnsubscribeToken(token, signingSecret)) {
    return htmlPage(
      "Invalid unsubscribe link",
      "<h1>Invalid unsubscribe link</h1><p>This link is invalid or no longer usable.</p>",
      400
    );
  }

  return htmlPage(
    "Unsubscribe from The Snap",
    `<h1>Unsubscribe</h1><p>Confirm that you no longer want to receive The Snap newsletter.</p><form method="post" action="/api/newsletter/unsubscribe"><input type="hidden" name="token" value="${escapeHtml(token ?? "")}"><button type="submit">Unsubscribe</button></form>`
  );
}

export async function POST(request: NextRequest) {
  const signingSecret = getNewsletterSigningSecret();
  if (!signingSecret) {
    return NextResponse.json(
      { error: "Newsletter service is temporarily unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }

  const rateLimit = await checkAuthRateLimit({
    ...UNSUBSCRIBE_RATE_LIMIT,
    identifier: getNewsletterRateLimitIdentifier(request.headers, signingSecret),
  });
  const rateLimitHeaders = getRateLimitHeaders(rateLimit);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Try again later." },
      { status: 429, headers: { "Cache-Control": "no-store", ...rateLimitHeaders } }
    );
  }

  const { token: bodyToken, isJson } = await readToken(request);
  // Query-token fallback supports RFC 8058 one-click POSTs from email clients;
  // GET remains confirmation-only and never changes subscription state.
  const token = bodyToken ?? request.nextUrl.searchParams.get("token");
  const subscriberId = verifyNewsletterUnsubscribeToken(token, signingSecret);
  if (!subscriberId) {
    if (isJson) {
      return NextResponse.json(
        { error: "Invalid unsubscribe token" },
        { status: 400, headers: { "Cache-Control": "no-store", ...rateLimitHeaders } }
      );
    }
    return htmlPage(
      "Invalid unsubscribe link",
      "<h1>Invalid unsubscribe link</h1><p>This link is invalid or no longer usable.</p>",
      400
    );
  }

  try {
    await unsubscribeNewsletterById(subscriberId);
  } catch (error) {
    console.error("[api/newsletter/unsubscribe] update failed", {
      errorType: error instanceof Error ? error.name : "UnknownError",
    });
    if (isJson) {
      return NextResponse.json(
        { error: "Newsletter service is temporarily unavailable" },
        { status: 503, headers: { "Cache-Control": "no-store", ...rateLimitHeaders } }
      );
    }
    return htmlPage(
      "Newsletter unavailable",
      "<h1>Newsletter unavailable</h1><p>Please try again later.</p>",
      503
    );
  }

  if (isJson) {
    return NextResponse.json(
      { success: true, message: "You have been unsubscribed." },
      { status: 200, headers: { "Cache-Control": "no-store", ...rateLimitHeaders } }
    );
  }

  return htmlPage(
    "Unsubscribed from The Snap",
    "<h1>You are unsubscribed.</h1><p>You will no longer receive The Snap newsletter.</p>"
  );
}
