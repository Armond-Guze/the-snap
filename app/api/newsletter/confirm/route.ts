import { NextRequest, NextResponse } from "next/server";

import {
  getNewsletterConfirmationTokenDigest,
  getNewsletterRateLimitIdentifier,
  getNewsletterSigningSecret,
} from "@/lib/newsletter/security";
import { confirmNewsletter } from "@/lib/newsletter/service";
import {
  checkAuthRateLimit,
  getRateLimitHeaders,
} from "@/lib/security/auth-rate-limit";

export const runtime = "nodejs";

const CONFIRM_RATE_LIMIT = {
  scope: "newsletter:confirm",
  limit: 20,
  windowSeconds: 10 * 60,
  blockSeconds: 30 * 60,
} as const;

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

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
  const token = request.nextUrl.searchParams.get("token");
  if (!signingSecret) {
    return htmlPage("Newsletter unavailable", "<h1>Newsletter unavailable</h1><p>Please try again later.</p>", 503);
  }
  if (!getNewsletterConfirmationTokenDigest(token, signingSecret)) {
    return htmlPage("Invalid confirmation link", "<h1>Invalid confirmation link</h1><p>This link is invalid or expired.</p>", 400);
  }

  return htmlPage(
    "Confirm The Snap newsletter",
    `<h1>Confirm your subscription</h1><p>Confirm that you want to receive The Snap newsletter.</p><form method="post" action="/api/newsletter/confirm"><input type="hidden" name="token" value="${escapeHtml(token ?? "")}"><button type="submit">Confirm subscription</button></form>`
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

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(contentLength) && contentLength > 2_048) {
    return NextResponse.json({ error: "Request too large" }, { status: 413 });
  }

  const rateLimit = await checkAuthRateLimit({
    ...CONFIRM_RATE_LIMIT,
    identifier: getNewsletterRateLimitIdentifier(request.headers, signingSecret),
  });
  const rateLimitHeaders = getRateLimitHeaders(rateLimit);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Try again later." },
      { status: 429, headers: { "Cache-Control": "no-store", ...rateLimitHeaders } }
    );
  }

  const { token, isJson } = await readToken(request);
  try {
    const confirmed = await confirmNewsletter(token, signingSecret);
    if (!confirmed) {
      if (isJson) {
        return NextResponse.json(
          { error: "Invalid or expired confirmation token" },
          { status: 400, headers: { "Cache-Control": "no-store", ...rateLimitHeaders } }
        );
      }
      return htmlPage("Invalid confirmation link", "<h1>Invalid confirmation link</h1><p>This link is invalid, expired, or already used.</p>", 400);
    }

    if (isJson) {
      return NextResponse.json(
        { success: true, message: "Your subscription is confirmed." },
        { status: 200, headers: { "Cache-Control": "no-store", ...rateLimitHeaders } }
      );
    }
    return htmlPage("Subscription confirmed", "<h1>Subscription confirmed.</h1><p>You are now subscribed to The Snap newsletter.</p>");
  } catch (error) {
    console.error("[api/newsletter/confirm] update failed", {
      errorType: error instanceof Error ? error.name : "UnknownError",
    });
    return NextResponse.json(
      { error: "Newsletter service is temporarily unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store", ...rateLimitHeaders } }
    );
  }
}
