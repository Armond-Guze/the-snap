import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const dbMocks = vi.hoisted(() => ({
  analyticsCreate: vi.fn(),
  analyticsDelete: vi.fn(),
  rateFind: vi.fn(),
  rateCreate: vi.fn(),
  rateUpdate: vi.fn(),
  rateDelete: vi.fn(),
  transaction: vi.fn(),
  sanityFetch: vi.fn(),
}));

vi.mock('server-only', () => ({}));
vi.mock('../../../sanity/lib/client', () => ({ client: { fetch: dbMocks.sanityFetch } }));
vi.mock('../../../lib/db', () => ({
  db: {
    analyticsEvent: {
      create: dbMocks.analyticsCreate,
      deleteMany: dbMocks.analyticsDelete,
    },
    analyticsRateLimitState: { deleteMany: dbMocks.rateDelete },
    $transaction: dbMocks.transaction,
  },
}));

import {
  getAnalyticsRetentionCutoff,
  getAnalyticsRateLimitIdentifier,
  parseAnalyticsEventPayload,
  pruneAnalyticsData,
  readAnalyticsJsonBody,
} from '../../../lib/analytics-store';
import { POST as postArticleView } from '../../../app/api/analytics/article-view/route';

const originalSigningSecret = process.env.ANALYTICS_HMAC_SECRET;
const originalAnalyticsEnabled = process.env.NEXT_PUBLIC_INTERNAL_ANALYTICS_ENABLED;

function request(init?: ConstructorParameters<typeof NextRequest>[1]) {
  return new NextRequest('https://thegamesnap.com/api/analytics/article-view', init);
}

function acceptedViewRequest(body: Record<string, unknown>) {
  return request({
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      cookie: 'cookie_consent=accepted',
      origin: 'https://thegamesnap.com',
      'sec-fetch-site': 'same-origin',
      'x-forwarded-for': '203.0.113.42',
    },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.ANALYTICS_HMAC_SECRET = 'analytics-test-signing-secret-at-least-32-bytes';
  process.env.NEXT_PUBLIC_INTERNAL_ANALYTICS_ENABLED = 'true';
  dbMocks.rateFind.mockResolvedValue(null);
  dbMocks.rateCreate.mockResolvedValue({});
  dbMocks.rateUpdate.mockResolvedValue({});
  dbMocks.analyticsCreate.mockResolvedValue({ id: '00000000-0000-4000-8000-000000000001' });
  dbMocks.analyticsDelete.mockResolvedValue({ count: 7 });
  dbMocks.rateDelete.mockResolvedValue({ count: 3 });
  dbMocks.sanityFetch.mockImplementation(
    (_query: string, params: { articleId: string; articleSlug: string }) => Promise.resolve({
      _id: params.articleId,
      articleSlug: params.articleSlug,
      title: 'Canonical article title',
      category: 'Canonical category',
      author: 'Canonical author',
    }),
  );
  dbMocks.transaction.mockImplementation(
    async (
      callback: (transaction: {
        analyticsRateLimitState: {
          findUnique: typeof dbMocks.rateFind;
          create: typeof dbMocks.rateCreate;
          update: typeof dbMocks.rateUpdate;
        };
      }) => Promise<unknown>,
    ) => callback({
      analyticsRateLimitState: {
        findUnique: dbMocks.rateFind,
        create: dbMocks.rateCreate,
        update: dbMocks.rateUpdate,
      },
    }),
  );
});

afterEach(() => {
  if (originalSigningSecret === undefined) delete process.env.ANALYTICS_HMAC_SECRET;
  else process.env.ANALYTICS_HMAC_SECRET = originalSigningSecret;
  if (originalAnalyticsEnabled === undefined) delete process.env.NEXT_PUBLIC_INTERNAL_ANALYTICS_ENABLED;
  else process.env.NEXT_PUBLIC_INTERNAL_ANALYTICS_ENABLED = originalAnalyticsEnabled;
});

describe('analytics payload validation', () => {
  it('accepts only identity/measurement fields and rejects client metadata or timestamps', () => {
    expect(parseAnalyticsEventPayload('article_view', {
      articleId: 'article-123',
      slug: 'strict-payload',
      readingTime: 7,
    })).toEqual({
      ok: true,
      event: {
        type: 'article_view',
        articleId: 'article-123',
        articleSlug: 'strict-payload',
        readingTime: 7,
      },
    });

    expect(parseAnalyticsEventPayload('article_view', {
      articleId: 'article-123',
      slug: 'strict-payload',
      articleTitle: 'Untrusted title',
    })).toMatchObject({ ok: false });

    expect(parseAnalyticsEventPayload('article_view', {
      articleId: 'article-123',
      slug: 'strict-payload',
      timestamp: '2000-01-01T00:00:00.000Z',
    })).toMatchObject({ ok: false });
  });

  it('rejects invalid metadata, methods, and oversized JSON bodies', async () => {
    expect(parseAnalyticsEventPayload('article_click', {
      articleId: 'article-123',
      articleSlug: 'strict-payload',
      readingTime: -1,
    })).toMatchObject({ ok: false });

    const wrongType = await readAnalyticsJsonBody(new Request('https://example.test', {
      method: 'POST',
      headers: { 'content-type': 'application/jsonp' },
      body: '{}',
    }));
    expect(wrongType).toMatchObject({ ok: false, status: 415 });

    const oversized = await readAnalyticsJsonBody(new Request('https://example.test', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ articleTitle: 'x'.repeat(5_000) }),
    }));
    expect(oversized).toMatchObject({ ok: false, status: 413 });
  });

  it('creates only a keyed IP digest and fails closed without its dedicated secret', () => {
    const headers = new Headers({ 'x-forwarded-for': '203.0.113.42' });
    const identifier = getAnalyticsRateLimitIdentifier(headers);
    expect(identifier).toMatch(/^ip-hmac:[a-f0-9]{64}$/);
    expect(identifier).not.toContain('203.0.113.42');

    delete process.env.ANALYTICS_HMAC_SECRET;
    expect(getAnalyticsRateLimitIdentifier(headers)).toBeNull();

    process.env.ANALYTICS_HMAC_SECRET = 'too-short';
    expect(getAnalyticsRateLimitIdentifier(headers)).toBeNull();
  });
});

describe('analytics retention', () => {
  it('uses a calendar-safe 13-month event cutoff', () => {
    const cutoff = getAnalyticsRetentionCutoff(new Date('2026-01-31T18:45:12.000Z'));
    expect(cutoff.toISOString()).toBe('2024-12-31T18:45:12.000Z');
  });

  it('deletes only expired events and fully expired rate-limit state', async () => {
    const now = new Date('2026-08-09T12:00:00.000Z');
    const result = await pruneAnalyticsData(now);
    const cutoff = new Date('2025-07-09T12:00:00.000Z');

    expect(dbMocks.analyticsDelete).toHaveBeenCalledWith({
      where: { occurredAt: { lt: cutoff } },
    });
    expect(dbMocks.rateDelete).toHaveBeenCalledWith({
      where: {
        windowEndsAt: { lt: now },
        OR: [
          { blockedUntil: null },
          { blockedUntil: { lt: now } },
        ],
      },
    });
    expect(result).toEqual({
      retentionMonths: 13,
      eventCutoff: cutoff.toISOString(),
      eventsDeleted: 7,
      rateLimitsDeleted: 3,
    });
  });
});

describe('article analytics ingestion', () => {
  it('does not parse or store an event without explicit accepted cookie consent', async () => {
    const response = await postArticleView(request({
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin: 'https://thegamesnap.com',
        'sec-fetch-site': 'same-origin',
      },
      body: JSON.stringify({ articleId: 'article-123', slug: 'no-consent' }),
    }));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ stored: false, skipped: 'consent_required' });
    expect(dbMocks.transaction).not.toHaveBeenCalled();
    expect(dbMocks.analyticsCreate).not.toHaveBeenCalled();
  });

  it('stores Sanity-derived metadata with a database timestamp and hashed rate-limit identity', async () => {
    const response = await postArticleView(acceptedViewRequest({
      articleId: 'article-123',
      slug: 'durable-analytics',
      readingTime: 8,
    }));

    expect(response.status).toBe(200);
    expect(dbMocks.analyticsCreate).toHaveBeenCalledWith({
      data: {
        type: 'ARTICLE_VIEW',
        articleId: 'article-123',
        articleSlug: 'durable-analytics',
        articleTitle: 'Canonical article title',
        category: 'Canonical category',
        author: 'Canonical author',
        readingTime: 8,
        source: undefined,
        position: undefined,
      },
      select: { id: true },
    });
    const rateLimitWrite = JSON.stringify(dbMocks.rateCreate.mock.calls);
    expect(rateLimitWrite).toContain('ip-hmac:');
    expect(rateLimitWrite).not.toContain('203.0.113.42');
    expect(rateLimitWrite).not.toContain('occurredAt');
  });

  it('rejects client timestamps and fails closed when HMAC configuration is unavailable', async () => {
    const invalid = await postArticleView(acceptedViewRequest({
      articleId: 'article-123',
      slug: 'client-time',
      timestamp: new Date().toISOString(),
    }));
    expect(invalid.status).toBe(400);
    expect(dbMocks.analyticsCreate).not.toHaveBeenCalled();

    delete process.env.ANALYTICS_HMAC_SECRET;
    const unavailable = await postArticleView(acceptedViewRequest({
      articleId: 'article-123',
      slug: 'missing-secret',
    }));
    expect(unavailable.status).toBe(503);
    expect(dbMocks.transaction).not.toHaveBeenCalled();
  });

  it('rejects cross-origin requests and unresolved article identities', async () => {
    const crossOrigin = await postArticleView(request({
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: 'cookie_consent=accepted',
        origin: 'https://attacker.example',
        'sec-fetch-site': 'cross-site',
      },
      body: JSON.stringify({ articleId: 'article-123', slug: 'cross-origin' }),
    }));
    expect(crossOrigin.status).toBe(403);
    expect(dbMocks.transaction).not.toHaveBeenCalled();

    dbMocks.sanityFetch.mockResolvedValueOnce(null);
    const unknownArticle = await postArticleView(acceptedViewRequest({
      articleId: 'article-404',
      slug: 'not-published',
    }));
    expect(unknownArticle.status).toBe(404);
    expect(dbMocks.analyticsCreate).not.toHaveBeenCalled();
  });

  it('requires Origin and rejects a cross-site fetch signal even with a matching Origin', async () => {
    const missingOrigin = await postArticleView(request({
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: 'cookie_consent=accepted',
      },
      body: JSON.stringify({ articleId: 'article-123', slug: 'missing-origin' }),
    }));
    const contradictoryFetchSite = await postArticleView(request({
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: 'cookie_consent=accepted',
        origin: 'https://thegamesnap.com',
        'sec-fetch-site': 'cross-site',
      },
      body: JSON.stringify({ articleId: 'article-123', slug: 'spoofed-origin' }),
    }));

    expect(missingOrigin.status).toBe(403);
    expect(contradictoryFetchSite.status).toBe(403);
    expect(dbMocks.transaction).not.toHaveBeenCalled();
    expect(dbMocks.analyticsCreate).not.toHaveBeenCalled();
  });

  it('keeps ingestion disabled unless the public opt-in flag is exactly true', async () => {
    process.env.NEXT_PUBLIC_INTERNAL_ANALYTICS_ENABLED = 'TRUE';
    const response = await postArticleView(acceptedViewRequest({
      articleId: 'article-123',
      slug: 'disabled-analytics',
    }));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ stored: false, skipped: 'analytics_disabled' });
    expect(dbMocks.sanityFetch).not.toHaveBeenCalled();
    expect(dbMocks.analyticsCreate).not.toHaveBeenCalled();
  });

  it('returns 429 and never stores while a durable limit is blocked', async () => {
    const now = new Date();
    dbMocks.rateFind.mockResolvedValue({
      requestCount: 181,
      windowStart: now,
      windowEndsAt: new Date(now.getTime() + 60_000),
      blockedUntil: new Date(now.getTime() + 60_000),
    });

    const response = await postArticleView(acceptedViewRequest({
      articleId: 'article-123',
      slug: 'rate-limited',
    }));

    expect(response.status).toBe(429);
    expect(response.headers.get('retry-after')).toBeTruthy();
    expect(dbMocks.analyticsCreate).not.toHaveBeenCalled();
  });
});
