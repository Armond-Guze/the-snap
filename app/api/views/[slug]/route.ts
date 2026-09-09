import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'node:crypto';

const BOT_REGEX = /(bot|crawl|spider|slurp|wget|curl|python-requests|httpclient|scrapy|httpx|feedfetcher|monitoring|statuscake|uptimerobot|headless|phantom)/i;
const DEDUPE_TTL_SECONDS = 60 * 60 * 12; // 12 hours

function getEnv(key: string) {
  const value = process.env[key];
  if (!value) return null;
  return value.trim();
}

function getKvConfig() {
  return {
    base: getEnv('KV_REST_API_URL'),
    token: getEnv('KV_REST_API_TOKEN'),
  };
}

async function kvGet(key: string): Promise<number> {
  const { base, token } = getKvConfig();
  if (!base || !token) return 0;
  const res = await fetch(`${base}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) return 0;
  const data = (await res.json()) as { result?: string | number };
  const raw = typeof data.result === 'number' ? data.result : parseInt(String(data.result || '0'), 10);
  return Number.isFinite(raw) ? raw : 0;
}

async function kvIncr(key: string): Promise<number> {
  const { base, token } = getKvConfig();
  if (!base || !token) return 0;
  const res = await fetch(`${base}/incr/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) return 0;
  const data = (await res.json()) as { result?: number };
  return typeof data.result === 'number' ? data.result : 0;
}

async function kvSetNX(key: string, value: string, ttlSeconds: number): Promise<boolean> {
  const { base, token } = getKvConfig();
  if (!base || !token) return false;
  const url = `${base}/set/${encodeURIComponent(key)}/${encodeURIComponent(value)}?ex=${ttlSeconds}&nx=true`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) return false;
  const data = (await res.json()) as { result?: string };
  return data.result === 'OK';
}

function isBot(req: Request) {
  const ua = req.headers.get('user-agent') || '';
  if (!ua) return true;
  if (BOT_REGEX.test(ua)) return true;
  const purpose = req.headers.get('purpose') || req.headers.get('sec-fetch-purpose');
  if (purpose && purpose.toLowerCase() === 'prefetch') return true;
  return false;
}

function isExcludedByCookie(req: NextRequest) {
  return req.cookies.get('va-exclude')?.value === '1';
}

function hasAcceptedAnalyticsConsent(req: NextRequest): boolean {
  return req.cookies.get('cookie_consent')?.value === 'accepted';
}

export function isExactSameOriginRequest(req: NextRequest): boolean {
  if (req.headers.get('sec-fetch-site') !== 'same-origin') return false;

  const source = req.method === 'GET'
    ? req.headers.get('referer')
    : req.headers.get('origin');
  if (!source) return false;

  try {
    return new URL(source).origin === req.nextUrl.origin;
  } catch {
    return false;
  }
}

function getClientIp(req: Request): string | null {
  const header =
    req.headers.get('x-vercel-forwarded-for') ||
    req.headers.get('x-forwarded-for') ||
    req.headers.get('x-real-ip') ||
    '';
  const ip = header.split(',')[0]?.trim() || '';
  return ip && ip.length <= 128 ? ip : null;
}

export function createViewFingerprint(req: Request, slug: string): string | null {
  const secret = getEnv('ANALYTICS_HMAC_SECRET');
  const ip = getClientIp(req);
  const userAgent = req.headers.get('user-agent')?.slice(0, 512) || '';
  const language = req.headers.get('accept-language')?.slice(0, 256) || '';
  if (!secret || secret.length < 32 || !ip || !userAgent) return null;

  return createHmac('sha256', secret)
    .update('article-view-dedupe', 'utf8')
    .update('\0', 'utf8')
    .update(slug, 'utf8')
    .update('\0', 'utf8')
    .update(ip, 'utf8')
    .update('\0', 'utf8')
    .update(userAgent, 'utf8')
    .update('\0', 'utf8')
    .update(language, 'utf8')
    .digest('hex');
}

function extractSlug(url: string): string | null {
  try {
    const u = new URL(url);
    const segments = u.pathname.split('/').filter(Boolean);
    const slug = decodeURIComponent(segments[segments.length - 1] || '').trim().toLowerCase();
    if (!/^[a-z0-9](?:[a-z0-9-]{0,158}[a-z0-9])?$/.test(slug)) return null;
    return slug;
  } catch {
    return null;
  }
}

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store' } as const;

function rejectUnlessPrivateAnalyticsRequest(req: NextRequest): NextResponse | null {
  if (!isExactSameOriginRequest(req)) {
    return NextResponse.json({ error: 'Cross-origin view requests are not allowed' }, {
      status: 403,
      headers: NO_STORE_HEADERS,
    });
  }
  if (!hasAcceptedAnalyticsConsent(req)) {
    return NextResponse.json({ skipped: 'consent_required' }, {
      status: 403,
      headers: NO_STORE_HEADERS,
    });
  }
  if (isExcludedByCookie(req)) {
    return NextResponse.json({ skipped: 'excluded_visitor' }, {
      status: 200,
      headers: NO_STORE_HEADERS,
    });
  }
  return null;
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const slug = extractSlug(req.url);
  if (!slug) return NextResponse.json({ error: 'Missing slug' }, { status: 400 });
  const rejection = rejectUnlessPrivateAnalyticsRequest(req);
  if (rejection) return rejection;
  const count = await kvGet(`views:${slug}`);
  return NextResponse.json(
    { count },
    { headers: NO_STORE_HEADERS }
  );
}

export async function POST(req: NextRequest) {
  const slug = extractSlug(req.url);
  if (!slug) return NextResponse.json({ error: 'Missing slug' }, { status: 400 });

  const rejection = rejectUnlessPrivateAnalyticsRequest(req);
  if (rejection) return rejection;

  const { base, token } = getKvConfig();
  if (!base || !token) {
    return NextResponse.json(
      { skipped: 'kv_unconfigured' },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store'
        }
      }
    );
  }

  if (isBot(req)) {
    return NextResponse.json(
      { skipped: 'bot' },
      {
        headers: {
          'Cache-Control': 'no-store'
        }
      }
    );
  }

  const fingerprint = createViewFingerprint(req, slug);
  if (!fingerprint) {
    return NextResponse.json(
      { error: 'View counting is temporarily unavailable' },
      { status: 503, headers: NO_STORE_HEADERS }
    );
  }
  const dedupeKey = `views:seen:${fingerprint}`;
  const counterKey = `views:${slug}`;

  const isNew = await kvSetNX(dedupeKey, '1', DEDUPE_TTL_SECONDS);
  if (isNew) {
    const count = await kvIncr(counterKey);
    return NextResponse.json(
      { count, deduped: false },
      {
        headers: {
          'Cache-Control': 'no-store'
        }
      }
    );
  }

  return NextResponse.json(
    { deduped: true },
    {
      headers: {
        'Cache-Control': 'no-store'
      }
    }
  );
}
