import { NextRequest, NextResponse } from 'next/server';

import {
  appendEvent,
  enforceAnalyticsRateLimit,
  getAnalyticsRateLimitHeaders,
  getAnalyticsRateLimitIdentifier,
  parseAnalyticsEventPayload,
  readAnalyticsJsonBody,
  resolveAnalyticsArticle,
  type AnalyticsEvent,
} from '../../../lib/analytics-store';

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store' } as const;

function hasAcceptedConsent(request: NextRequest): boolean {
  const value = request.cookies.get('cookie_consent')?.value;
  return value === 'accepted' || value === '1';
}

function skipped(reason: string) {
  return NextResponse.json(
    { success: true, stored: false, skipped: reason },
    { status: 200, headers: NO_STORE_HEADERS },
  );
}

function isSameOriginBrowserRequest(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return false;

  try {
    if (new URL(origin).origin !== request.nextUrl.origin) return false;
  } catch {
    return false;
  }

  const fetchSite = request.headers.get('sec-fetch-site');
  return !fetchSite || fetchSite === 'same-origin';
}

export async function ingestAnalyticsEvent(
  request: NextRequest,
  type: AnalyticsEvent['type'],
) {
  if (process.env.NEXT_PUBLIC_INTERNAL_ANALYTICS_ENABLED !== 'true') {
    return skipped('analytics_disabled');
  }
  if (!isSameOriginBrowserRequest(request)) {
    return NextResponse.json(
      { success: false, error: 'Cross-origin analytics requests are not allowed' },
      { status: 403, headers: NO_STORE_HEADERS },
    );
  }
  if (request.cookies.get('va-exclude')?.value === '1') {
    return skipped('excluded_visitor');
  }
  if (!hasAcceptedConsent(request)) {
    return skipped('consent_required');
  }

  const parsedBody = await readAnalyticsJsonBody(request);
  if (!parsedBody.ok) {
    return NextResponse.json(
      { success: false, error: parsedBody.error },
      { status: parsedBody.status, headers: NO_STORE_HEADERS },
    );
  }

  const parsedEvent = parseAnalyticsEventPayload(type, parsedBody.body);
  if (!parsedEvent.ok) {
    return NextResponse.json(
      { success: false, error: parsedEvent.error },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const identifier = getAnalyticsRateLimitIdentifier(request.headers);
  if (!identifier) {
    return NextResponse.json(
      { success: false, error: 'Analytics ingestion is temporarily unavailable' },
      { status: 503, headers: NO_STORE_HEADERS },
    );
  }

  try {
    const rateLimit = await enforceAnalyticsRateLimit(identifier);
    const rateLimitHeaders = {
      ...NO_STORE_HEADERS,
      ...getAnalyticsRateLimitHeaders(rateLimit),
    };
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many analytics events' },
        { status: 429, headers: rateLimitHeaders },
      );
    }

    const canonicalEvent = await resolveAnalyticsArticle(parsedEvent.event);
    if (!canonicalEvent) {
      return NextResponse.json(
        { success: false, error: 'Unknown article identity' },
        { status: 404, headers: rateLimitHeaders },
      );
    }

    await appendEvent(canonicalEvent);
    return NextResponse.json(
      { success: true, stored: true },
      { status: 200, headers: rateLimitHeaders },
    );
  } catch (error) {
    console.error('[analytics] event ingestion failed', {
      errorType: error instanceof Error ? error.name : 'UnknownError',
    });
    return NextResponse.json(
      { success: false, error: 'Analytics ingestion is temporarily unavailable' },
      { status: 503, headers: NO_STORE_HEADERS },
    );
  }
}
