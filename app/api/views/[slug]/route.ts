import { NextResponse } from 'next/server';
import crypto from 'crypto';

const BOT_REGEX = /(bot|crawl|spider|slurp|wget|curl|python-requests|httpclient|scrapy|httpx|feedfetcher|monitoring|statuscake|uptimerobot|headless|phantom)/i;
const DEDUPE_TTL_SECONDS = 60 * 60 * 12; // 12 hours

function getEnv(key: string) {
  const value = process.env[key];
  if (!value) return null;
  return value.trim();
}

const KV_BASE = getEnv('KV_REST_API_URL');
const KV_TOKEN = getEnv('KV_REST_API_TOKEN');

async function kvGet(key: string): Promise<number> {
  if (!KV_BASE || !KV_TOKEN) return 0;
  const res = await fetch(`${KV_BASE}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${KV_TOKEN}` }
  });
  if (!res.ok) return 0;
  const data = (await res.json()) as { result?: string | number };
  const raw = typeof data.result === 'number' ? data.result : parseInt(String(data.result || '0'), 10);
  return Number.isFinite(raw) ? raw : 0;
}

async function kvIncr(key: string): Promise<number> {
  if (!KV_BASE || !KV_TOKEN) return 0;
  const res = await fetch(`${KV_BASE}/incr/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${KV_TOKEN}` }
  });
  if (!res.ok) return 0;
  const data = (await res.json()) as { result?: number };
  return typeof data.result === 'number' ? data.result : 0;
}

async function kvSetNX(key: string, value: string, ttlSeconds: number): Promise<boolean> {
  if (!KV_BASE || !KV_TOKEN) return false;
  const url = `${KV_BASE}/set/${encodeURIComponent(key)}/${encodeURIComponent(value)}?ex=${ttlSeconds}&nx=true`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${KV_TOKEN}` } });
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

function getClientIp(req: Request): string {
  const header = req.headers.get('x-forwarded-for') || '';
  const ip = header.split(',')[0]?.trim();
  return ip || '0.0.0.0';
}

function hashFingerprint(parts: string[]): string {
  const h = crypto.createHash('sha256');
  h.update(parts.join('|'));
  return h.digest('hex');
}

function extractSlug(url: string): string {
  try {
    const u = new URL(url);
    const segments = u.pathname.split('/').filter(Boolean);
    return segments[segments.length - 1] || '';
  } catch {
    return '';
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const slug = decodeURIComponent(extractSlug(req.url)).trim();
  if (!slug) return NextResponse.json({ error: 'Missing slug' }, { status: 400 });
  const count = await kvGet(`views:${slug}`);
  return NextResponse.json({ count });
}

export async function POST(req: Request) {
  const slug = decodeURIComponent(extractSlug(req.url)).trim();
  if (!slug) return NextResponse.json({ error: 'Missing slug' }, { status: 400 });

  if (!KV_BASE || !KV_TOKEN) {
    return NextResponse.json({ error: 'KV is not configured', count: 0 }, { status: 500 });
  }

  if (isBot(req)) {
    const count = await kvGet(`views:${slug}`);
    return NextResponse.json({ count, skipped: 'bot' });
  }

  const ua = req.headers.get('user-agent') || '';
  const ip = getClientIp(req);
  const lang = req.headers.get('accept-language') || '';

  const fingerprint = hashFingerprint([slug, ua, ip, lang]);
  const dedupeKey = `views:seen:${fingerprint}`;
  const counterKey = `views:${slug}`;

  const isNew = await kvSetNX(dedupeKey, '1', DEDUPE_TTL_SECONDS);
  if (isNew) {
    await kvIncr(counterKey);
  }

  const count = await kvGet(counterKey);
  return NextResponse.json({ count, deduped: !isNew });
}
