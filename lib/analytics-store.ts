import 'server-only';

import { createHmac } from 'node:crypto';
import { Prisma } from '@prisma/client';

import { db } from './db';
import { client } from '../sanity/lib/client';

export const MAX_ANALYTICS_BODY_BYTES = 4_096;
export const ANALYTICS_EVENT_RETENTION_MONTHS = 13;

const ANALYTICS_RATE_LIMIT = {
  scope: 'analytics:event',
  limit: 180,
  windowSeconds: 10 * 60,
  blockSeconds: 30 * 60,
} as const;

const ARTICLE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;
const ARTICLE_SLUG_PATTERN = /^[A-Za-z0-9](?:[A-Za-z0-9_-]*[A-Za-z0-9])?(?:\/[A-Za-z0-9](?:[A-Za-z0-9_-]*[A-Za-z0-9])?)*$/;
const SOURCE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9:_.\/-]{0,79}$/;
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/;

export interface AnalyticsEventBase {
  articleId: string;
  articleSlug: string;
  articleTitle?: string;
  category?: string;
  author?: string;
  readingTime?: number;
}

export interface ArticleViewEvent extends AnalyticsEventBase {
  type: 'article_view';
}

export interface ArticleClickEvent extends AnalyticsEventBase {
  type: 'article_click';
  source?: string;
  position?: number;
}

export type AnalyticsEvent = ArticleViewEvent | ArticleClickEvent;

type AnalyticsEventKind = AnalyticsEvent['type'];

type ParseEventResult =
  | { ok: true; event: AnalyticsEvent }
  | { ok: false; error: string };

export type ReadAnalyticsBodyResult =
  | { ok: true; body: unknown }
  | { ok: false; status: 400 | 413 | 415; error: string };

export interface AnalyticsRateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: Date;
  retryAfterSeconds: number;
}

export interface AggregatedArticle {
  articleId: string;
  articleSlug: string;
  articleTitle?: string;
  category?: string;
  author?: string;
  views: number;
  firstViewAt?: string;
  lastViewAt?: string;
  publishedAt?: string;
  indexLatencyMs?: number;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function parseOptionalString(value: unknown, maxLength: number): string | undefined | null {
  if (value === undefined) return undefined;
  if (typeof value !== 'string' || CONTROL_CHARACTER_PATTERN.test(value)) return null;

  const normalized = value.trim().replace(/\s+/g, ' ');
  if (!normalized || normalized.length > maxLength) return null;
  return normalized;
}

function parseOptionalInteger(value: unknown, min: number, max: number): number | undefined | null {
  if (value === undefined) return undefined;
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max
    ? value
    : null;
}

export function parseAnalyticsEventPayload(type: AnalyticsEventKind, value: unknown): ParseEventResult {
  if (!isPlainObject(value)) {
    return { ok: false, error: 'Payload must be a JSON object' };
  }

  const allowedKeys = new Set(
    type === 'article_view'
      ? ['articleId', 'slug', 'readingTime']
      : ['articleId', 'articleSlug', 'readingTime', 'source', 'position'],
  );
  if (Object.keys(value).some((key) => !allowedKeys.has(key))) {
    return { ok: false, error: 'Payload contains unsupported fields' };
  }

  const articleId = parseOptionalString(value.articleId, 128);
  const articleSlug = parseOptionalString(
    type === 'article_view' ? value.slug : value.articleSlug,
    240,
  );
  if (!articleId || !ARTICLE_ID_PATTERN.test(articleId) || !articleSlug || !ARTICLE_SLUG_PATTERN.test(articleSlug)) {
    return { ok: false, error: 'Invalid article identifier or slug' };
  }

  const readingTime = parseOptionalInteger(value.readingTime, 0, 1_440);
  if (readingTime === null) {
    return { ok: false, error: 'Invalid article metadata' };
  }

  const base = {
    articleId,
    articleSlug,
    ...(readingTime !== undefined ? { readingTime } : {}),
  };

  if (type === 'article_view') {
    return { ok: true, event: { type, ...base } };
  }

  const source = parseOptionalString(value.source, 80);
  const position = parseOptionalInteger(value.position, 0, 10_000);
  if (source === null || (source !== undefined && !SOURCE_PATTERN.test(source)) || position === null) {
    return { ok: false, error: 'Invalid click metadata' };
  }

  return {
    ok: true,
    event: {
      type,
      ...base,
      ...(source !== undefined ? { source } : {}),
      ...(position !== undefined ? { position } : {}),
    },
  };
}

export async function readAnalyticsJsonBody(request: Request): Promise<ReadAnalyticsBodyResult> {
  const contentType = request.headers.get('content-type')?.toLowerCase() ?? '';
  const mediaType = contentType.split(';', 1)[0]?.trim();
  if (mediaType !== 'application/json') {
    return { ok: false, status: 415, error: 'Content-Type must be application/json' };
  }

  const declaredLength = Number(request.headers.get('content-length') ?? 0);
  if (Number.isFinite(declaredLength) && declaredLength > MAX_ANALYTICS_BODY_BYTES) {
    return { ok: false, status: 413, error: 'Request body is too large' };
  }

  try {
    const text = await request.text();
    if (new TextEncoder().encode(text).byteLength > MAX_ANALYTICS_BODY_BYTES) {
      return { ok: false, status: 413, error: 'Request body is too large' };
    }
    return { ok: true, body: JSON.parse(text) as unknown };
  } catch {
    return { ok: false, status: 400, error: 'Invalid JSON payload' };
  }
}

function getAnalyticsSigningSecret(): string | null {
  // Dedicated domain separation: analytics identities must never share signing
  // material with newsletter consent records or unsubscribe tokens.
  const secret = process.env.ANALYTICS_HMAC_SECRET?.trim() ?? '';
  return secret.length >= 32 ? secret : null;
}

function getClientAddress(headers: Headers): string | null {
  const forwarded =
    headers.get('x-vercel-forwarded-for') ||
    headers.get('x-forwarded-for') ||
    headers.get('x-real-ip');
  const address = forwarded?.split(',')[0]?.trim() ?? '';
  return address && address.length <= 128 ? address : null;
}

export function getAnalyticsRateLimitIdentifier(headers: Headers): string | null {
  const secret = getAnalyticsSigningSecret();
  const address = getClientAddress(headers);
  if (!secret || !address) return null;

  const digest = createHmac('sha256', secret)
    .update('analytics-rate-limit', 'utf8')
    .update('\0', 'utf8')
    .update(address, 'utf8')
    .digest('hex');
  return `ip-hmac:${digest}`;
}

function getWindowStart(now: Date): Date {
  const windowMs = ANALYTICS_RATE_LIMIT.windowSeconds * 1_000;
  return new Date(Math.floor(now.getTime() / windowMs) * windowMs);
}

function secondsUntil(target: Date, now: Date): number {
  return Math.max(0, Math.ceil((target.getTime() - now.getTime()) / 1_000));
}

function isRetryableTransactionError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === 'P2002' || error.code === 'P2034')
  );
}

export async function enforceAnalyticsRateLimit(identifier: string): Promise<AnalyticsRateLimitResult> {
  const now = new Date();
  const windowStart = getWindowStart(now);
  const windowEnd = new Date(windowStart.getTime() + ANALYTICS_RATE_LIMIT.windowSeconds * 1_000);
  const blockEnd = new Date(now.getTime() + ANALYTICS_RATE_LIMIT.blockSeconds * 1_000);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await db.$transaction(
        async (tx) => {
          const key = {
            scope: ANALYTICS_RATE_LIMIT.scope,
            identifier,
          };
          const existing = await tx.analyticsRateLimitState.findUnique({
            where: { scope_identifier: key },
          });

          if (!existing) {
            await tx.analyticsRateLimitState.create({
              data: {
                ...key,
                windowStart,
                windowEndsAt: windowEnd,
                requestCount: 1,
              },
            });
            return {
              allowed: true,
              limit: ANALYTICS_RATE_LIMIT.limit,
              remaining: ANALYTICS_RATE_LIMIT.limit - 1,
              resetAt: windowEnd,
              retryAfterSeconds: 0,
            };
          }

          if (existing.blockedUntil && existing.blockedUntil > now) {
            return {
              allowed: false,
              limit: ANALYTICS_RATE_LIMIT.limit,
              remaining: 0,
              resetAt: existing.blockedUntil,
              retryAfterSeconds: secondsUntil(existing.blockedUntil, now),
            };
          }

          if (existing.windowStart.getTime() !== windowStart.getTime()) {
            await tx.analyticsRateLimitState.update({
              where: { scope_identifier: key },
              data: {
                windowStart,
                windowEndsAt: windowEnd,
                requestCount: 1,
                blockedUntil: null,
              },
            });
            return {
              allowed: true,
              limit: ANALYTICS_RATE_LIMIT.limit,
              remaining: ANALYTICS_RATE_LIMIT.limit - 1,
              resetAt: windowEnd,
              retryAfterSeconds: 0,
            };
          }

          const requestCount = existing.requestCount + 1;
          if (requestCount > ANALYTICS_RATE_LIMIT.limit) {
            await tx.analyticsRateLimitState.update({
              where: { scope_identifier: key },
              data: { requestCount, blockedUntil: blockEnd },
            });
            return {
              allowed: false,
              limit: ANALYTICS_RATE_LIMIT.limit,
              remaining: 0,
              resetAt: blockEnd,
              retryAfterSeconds: ANALYTICS_RATE_LIMIT.blockSeconds,
            };
          }

          await tx.analyticsRateLimitState.update({
            where: { scope_identifier: key },
            data: { requestCount },
          });
          return {
            allowed: true,
            limit: ANALYTICS_RATE_LIMIT.limit,
            remaining: ANALYTICS_RATE_LIMIT.limit - requestCount,
            resetAt: existing.windowEndsAt,
            retryAfterSeconds: 0,
          };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      if (attempt < 2 && isRetryableTransactionError(error)) continue;
      throw error;
    }
  }

  throw new Error('Analytics rate limit transaction could not be completed');
}

export function getAnalyticsRateLimitHeaders(result: AnalyticsRateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.floor(result.resetAt.getTime() / 1_000)),
  };
  if (!result.allowed) headers['Retry-After'] = String(result.retryAfterSeconds);
  return headers;
}

export async function appendEvent(event: AnalyticsEvent): Promise<void> {
  await db.analyticsEvent.create({
    data: {
      type: event.type === 'article_view' ? 'ARTICLE_VIEW' : 'ARTICLE_CLICK',
      articleId: event.articleId,
      articleSlug: event.articleSlug,
      articleTitle: event.articleTitle,
      category: event.category,
      author: event.author,
      readingTime: event.readingTime,
      source: event.type === 'article_click' ? event.source : undefined,
      position: event.type === 'article_click' ? event.position : undefined,
    },
    select: { id: true },
  });
}

type CanonicalArticleMetadata = {
  articleId: string;
  articleSlug: string;
  articleTitle?: string;
  category?: string;
  author?: string;
};

type ArticleMetadataCacheEntry = {
  value: CanonicalArticleMetadata | null;
  expiresAt: number;
};

const ARTICLE_METADATA_CACHE_MS = 5 * 60 * 1_000;
const MISSING_ARTICLE_CACHE_MS = 30 * 1_000;
const ARTICLE_METADATA_CACHE_MAX = 500;
const articleMetadataCache = new Map<string, ArticleMetadataCacheEntry>();
const articleMetadataInFlight = new Map<string, Promise<CanonicalArticleMetadata | null>>();

function normalizeCanonicalString(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = value
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
  return normalized ? normalized.slice(0, maxLength) : undefined;
}

function cacheArticleMetadata(key: string, value: CanonicalArticleMetadata | null): void {
  if (articleMetadataCache.size >= ARTICLE_METADATA_CACHE_MAX) {
    const oldestKey = articleMetadataCache.keys().next().value;
    if (typeof oldestKey === 'string') articleMetadataCache.delete(oldestKey);
  }
  articleMetadataCache.set(key, {
    value,
    expiresAt: Date.now() + (value ? ARTICLE_METADATA_CACHE_MS : MISSING_ARTICLE_CACHE_MS),
  });
}

async function fetchCanonicalArticleMetadata(
  articleId: string,
  articleSlug: string,
): Promise<CanonicalArticleMetadata | null> {
  const document = await client.fetch<{
    _id: string;
    articleSlug?: string;
    title?: string;
    category?: string;
    author?: string;
  } | null>(
    `*[
      _id == $articleId &&
      slug.current == $articleSlug &&
      published == true &&
      _type in ["article", "headline", "rankings", "fantasyFootball"]
    ][0]{
      _id,
      "articleSlug": slug.current,
      title,
      "category": category->title,
      "author": author->name
    }`,
    { articleId, articleSlug },
  );

  if (!document || document._id !== articleId || document.articleSlug !== articleSlug) return null;
  return {
    articleId,
    articleSlug,
    articleTitle: normalizeCanonicalString(document.title, 240),
    category: normalizeCanonicalString(document.category, 120),
    author: normalizeCanonicalString(document.author, 120),
  };
}

export async function resolveAnalyticsArticle(event: AnalyticsEvent): Promise<AnalyticsEvent | null> {
  const cacheKey = `${event.articleId}\0${event.articleSlug}`;
  const cached = articleMetadataCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value ? { ...event, ...cached.value } : null;
  }
  if (cached) articleMetadataCache.delete(cacheKey);

  let request = articleMetadataInFlight.get(cacheKey);
  if (!request) {
    request = fetchCanonicalArticleMetadata(event.articleId, event.articleSlug);
    articleMetadataInFlight.set(cacheKey, request);
  }

  try {
    const metadata = await request;
    cacheArticleMetadata(cacheKey, metadata);
    return metadata ? { ...event, ...metadata } : null;
  } finally {
    articleMetadataInFlight.delete(cacheKey);
  }
}

export function getAnalyticsRetentionCutoff(now = new Date()): Date {
  const cutoff = new Date(now);
  const originalDay = cutoff.getUTCDate();
  cutoff.setUTCDate(1);
  cutoff.setUTCMonth(cutoff.getUTCMonth() - ANALYTICS_EVENT_RETENTION_MONTHS);
  const lastDayOfTargetMonth = new Date(Date.UTC(
    cutoff.getUTCFullYear(),
    cutoff.getUTCMonth() + 1,
    0,
  )).getUTCDate();
  cutoff.setUTCDate(Math.min(originalDay, lastDayOfTargetMonth));
  return cutoff;
}

export async function pruneAnalyticsData(now = new Date()) {
  const eventCutoff = getAnalyticsRetentionCutoff(now);
  const [events, rateLimits] = await Promise.all([
    db.analyticsEvent.deleteMany({
      where: { occurredAt: { lt: eventCutoff } },
    }),
    db.analyticsRateLimitState.deleteMany({
      where: {
        windowEndsAt: { lt: now },
        OR: [
          { blockedUntil: null },
          { blockedUntil: { lt: now } },
        ],
      },
    }),
  ]);

  return {
    retentionMonths: ANALYTICS_EVENT_RETENTION_MONTHS,
    eventCutoff: eventCutoff.toISOString(),
    eventsDeleted: events.count,
    rateLimitsDeleted: rateLimits.count,
  };
}

async function enrichPublishedMetadata(articles: AggregatedArticle[]): Promise<AggregatedArticle[]> {
  if (articles.length === 0) return articles;

  try {
    const ids = articles.map((article) => article.articleId);
    const published = await client.fetch<Array<{ _id: string; publishedAt?: string; _createdAt?: string }>>(
      '*[_id in $ids]{ _id, publishedAt, _createdAt }',
      { ids },
    );
    const publishedById = new Map(published.map((item) => [item._id, item]));

    return articles.map((article) => {
      const metadata = publishedById.get(article.articleId);
      const publishedAt = metadata?.publishedAt || metadata?._createdAt;
      if (!publishedAt) return article;

      const publishedTime = new Date(publishedAt).getTime();
      const firstViewTime = article.firstViewAt ? new Date(article.firstViewAt).getTime() : Number.NaN;
      return {
        ...article,
        publishedAt,
        ...(Number.isFinite(firstViewTime) && Number.isFinite(publishedTime)
          ? { indexLatencyMs: firstViewTime - publishedTime }
          : {}),
      };
    });
  } catch {
    return articles;
  }
}

export async function aggregateLast7Days() {
  const now = new Date();
  const currentStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1_000);
  const previousStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1_000);

  const [articleGroups, currentCategories, previousCategories, clickSources] = await Promise.all([
    db.analyticsEvent.groupBy({
      by: ['articleId', 'articleSlug'],
      where: { type: 'ARTICLE_VIEW', occurredAt: { gte: currentStart } },
      _count: { articleId: true },
      _min: { occurredAt: true },
      _max: { occurredAt: true },
      orderBy: { _count: { articleId: 'desc' } },
      take: 20,
    }),
    db.analyticsEvent.groupBy({
      by: ['category'],
      where: { type: 'ARTICLE_VIEW', occurredAt: { gte: currentStart } },
      _count: { _all: true },
    }),
    db.analyticsEvent.groupBy({
      by: ['category'],
      where: {
        type: 'ARTICLE_VIEW',
        occurredAt: { gte: previousStart, lt: currentStart },
      },
      _count: { _all: true },
    }),
    db.analyticsEvent.findMany({
      where: {
        type: 'ARTICLE_CLICK',
        occurredAt: { gte: previousStart },
        source: { not: null },
      },
      select: { articleId: true, source: true },
      distinct: ['articleId', 'source'],
    }),
  ]);

  const articleIds = articleGroups.map((group) => group.articleId);
  const latestMetadata = articleIds.length
    ? await db.analyticsEvent.findMany({
        where: { type: 'ARTICLE_VIEW', articleId: { in: articleIds } },
        orderBy: { occurredAt: 'desc' },
        distinct: ['articleId'],
        select: {
          articleId: true,
          articleTitle: true,
          category: true,
          author: true,
        },
      })
    : [];
  const metadataById = new Map(latestMetadata.map((metadata) => [metadata.articleId, metadata]));

  const topArticles = await enrichPublishedMetadata(
    articleGroups.map((group) => {
      const metadata = metadataById.get(group.articleId);
      return {
        articleId: group.articleId,
        articleSlug: group.articleSlug,
        articleTitle: metadata?.articleTitle || undefined,
        category: metadata?.category || undefined,
        author: metadata?.author || undefined,
        views: group._count.articleId,
        firstViewAt: group._min.occurredAt?.toISOString(),
        lastViewAt: group._max.occurredAt?.toISOString(),
      };
    }),
  );

  const previousCategoryCounts = new Map(
    previousCategories.map((group) => [group.category || 'unknown', group._count._all]),
  );
  const risingTopics = currentCategories
    .map((group) => {
      const category = group.category || 'unknown';
      const current = group._count._all;
      const previous = previousCategoryCounts.get(category) || 0;
      const diff = current - previous;
      const pctChange = previous === 0 ? (current > 0 ? 100 : 0) : (diff / previous) * 100;
      return { category, current, previous, diff, pctChange };
    })
    .sort((left, right) => right.pctChange - left.pctChange)
    .slice(0, 10);

  const sourcesByArticle = new Map<string, Set<string>>();
  for (const click of clickSources) {
    if (!click.source) continue;
    const sources = sourcesByArticle.get(click.articleId) || new Set<string>();
    sources.add(click.source);
    sourcesByArticle.set(click.articleId, sources);
  }
  const orphaned = topArticles
    .filter((article) => (sourcesByArticle.get(article.articleId)?.size || 0) < 3)
    .map((article) => ({
      articleId: article.articleId,
      slug: article.articleSlug,
      views: article.views,
      sources: Array.from(sourcesByArticle.get(article.articleId) || []),
    }));

  return { topArticles, risingTopics, orphaned, generatedAt: now.toISOString() };
}

export async function getAnalyticsDashboard() {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1_000);
  const [
    totalViews,
    articleGroups,
    readingTime,
    recentViews,
    trafficSourceGroups,
    categoryGroups,
    dailyViews,
    insights,
  ] = await Promise.all([
    db.analyticsEvent.count({
      where: { type: 'ARTICLE_VIEW', occurredAt: { gte: since } },
    }),
    db.analyticsEvent.groupBy({
      by: ['articleId'],
      where: { type: 'ARTICLE_VIEW', occurredAt: { gte: since } },
      _count: { articleId: true },
    }),
    db.analyticsEvent.aggregate({
      where: { type: 'ARTICLE_VIEW', occurredAt: { gte: since }, readingTime: { not: null } },
      _avg: { readingTime: true },
    }),
    db.analyticsEvent.findMany({
      where: { type: 'ARTICLE_VIEW', occurredAt: { gte: since } },
      orderBy: { occurredAt: 'desc' },
      take: 20,
      select: {
        articleId: true,
        articleSlug: true,
        articleTitle: true,
        occurredAt: true,
      },
    }),
    db.analyticsEvent.groupBy({
      by: ['source'],
      where: { type: 'ARTICLE_CLICK', occurredAt: { gte: since } },
      _count: { _all: true },
    }),
    db.analyticsEvent.groupBy({
      by: ['category'],
      where: { type: 'ARTICLE_VIEW', occurredAt: { gte: since } },
      _count: { _all: true },
    }),
    db.$queryRaw<Array<{ day: Date; views: bigint }>>(Prisma.sql`
      SELECT date_trunc('day', "occurredAt") AS "day", COUNT(*)::bigint AS "views"
      FROM "AnalyticsEvent"
      WHERE "type" = 'ARTICLE_VIEW'::"AnalyticsEventType"
        AND "occurredAt" >= ${since}
      GROUP BY date_trunc('day', "occurredAt")
      ORDER BY "day" ASC
    `),
    aggregateLast7Days(),
  ]);

  return {
    overview: {
      windowDays: 30,
      totalViews,
      totalArticles: articleGroups.length,
      averageReadingTime: readingTime._avg.readingTime,
      bounceRate: null,
    },
    topArticles: insights.topArticles,
    recentViews: recentViews.map((view) => ({
      ...view,
      occurredAt: view.occurredAt.toISOString(),
    })),
    trafficSources: Object.fromEntries(
      trafficSourceGroups.map((group) => [group.source || 'direct', group._count._all]),
    ),
    popularCategories: categoryGroups
      .map((group) => ({
        category: group.category || 'unknown',
        views: group._count._all,
      }))
      .sort((left, right) => right.views - left.views)
      .slice(0, 20),
    viewsOverTime: dailyViews.map((row) => ({
      date: row.day.toISOString().slice(0, 10),
      views: Number(row.views),
    })),
    generatedAt: new Date().toISOString(),
  };
}
