import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

import {
  createViewFingerprint,
  GET,
  POST,
} from '@/app/api/views/[slug]/route';

const savedEnvironment = {
  hmac: process.env.ANALYTICS_HMAC_SECRET,
  kvBase: process.env.KV_REST_API_URL,
  kvToken: process.env.KV_REST_API_TOKEN,
};

function viewRequest(method: 'GET' | 'POST', overrides: Record<string, string> = {}) {
  const headers: Record<string, string> = {
    cookie: 'cookie_consent=accepted',
    'sec-fetch-site': 'same-origin',
    'user-agent': 'Mozilla/5.0 Test Browser',
    'accept-language': 'en-US,en;q=0.9',
    'x-forwarded-for': '203.0.113.42',
    ...(method === 'GET'
      ? { referer: 'https://thegamesnap.com/articles/test-article' }
      : { origin: 'https://thegamesnap.com' }),
    ...overrides,
  };
  return new NextRequest('https://thegamesnap.com/api/views/test-article', { method, headers });
}

beforeEach(() => {
  process.env.ANALYTICS_HMAC_SECRET = 'view-counter-test-secret-that-is-at-least-32-characters';
  process.env.KV_REST_API_URL = 'https://example-kv.test';
  process.env.KV_REST_API_TOKEN = 'test-token';
});

afterEach(() => {
  vi.unstubAllGlobals();
  if (savedEnvironment.hmac === undefined) delete process.env.ANALYTICS_HMAC_SECRET;
  else process.env.ANALYTICS_HMAC_SECRET = savedEnvironment.hmac;
  if (savedEnvironment.kvBase === undefined) delete process.env.KV_REST_API_URL;
  else process.env.KV_REST_API_URL = savedEnvironment.kvBase;
  if (savedEnvironment.kvToken === undefined) delete process.env.KV_REST_API_TOKEN;
  else process.env.KV_REST_API_TOKEN = savedEnvironment.kvToken;
});

describe('private article view counter', () => {
  it('rejects missing consent and cross-origin browser requests before KV access', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const noConsent = await POST(viewRequest('POST', { cookie: '' }));
    const crossOrigin = await POST(viewRequest('POST', {
      origin: 'https://attacker.test',
      'sec-fetch-site': 'cross-site',
    }));
    const directGet = await GET(viewRequest('GET', { referer: '' }));

    expect(noConsent.status).toBe(403);
    expect(await noConsent.json()).toMatchObject({ skipped: 'consent_required' });
    expect(crossOrigin.status).toBe(403);
    expect(directGet.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('fails closed without a dedicated HMAC secret', async () => {
    delete process.env.ANALYTICS_HMAC_SECRET;
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const response = await POST(viewRequest('POST'));

    expect(response.status).toBe(503);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('uses a keyed digest and never sends raw network identifiers to KV', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ result: 'OK' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ result: 41 }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const request = viewRequest('POST');
    const digest = createViewFingerprint(request, 'test-article');
    const response = await POST(request);

    expect(digest).toMatch(/^[a-f0-9]{64}$/);
    expect(digest).not.toContain('203.0.113.42');
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ count: 41, deduped: false });
    const kvRequests = fetchMock.mock.calls.map(([url]) => String(url)).join('\n');
    expect(kvRequests).not.toContain('203.0.113.42');
    expect(kvRequests).not.toContain('Mozilla');
    expect(kvRequests).toContain(encodeURIComponent(`views:seen:${digest}`));
  });

  it('returns counts only to consented same-origin page requests without shared caching', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ result: '91' }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const response = await GET(viewRequest('GET'));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ count: 91 });
    expect(response.headers.get('cache-control')).toBe('no-store');
  });
});

