import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { WebhookProvider } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { parseBody } from 'next-sanity/webhook';

import { autopostDocumentToX } from '@/lib/social/x-autopost';
import {
  beginWebhookEventProcessing,
  markWebhookEventFailed,
  markWebhookEventProcessed,
  markWebhookEventSkipped,
} from '@/lib/security/webhook-events';
import { client } from '@/sanity/lib/client';

export const runtime = 'nodejs';

const ROUTE_NAME = 'api/webhooks/sanity';
const SECRET = process.env.SANITY_WEBHOOK_SECRET ?? process.env.REVALIDATE_SECRET;
const SANITY_SIGNATURE_HEADER = 'sanity-webhook-signature';
const RECENT_EVENT_TTL_MS = 90 * 1000;
const AUTPOST_METADATA_FIELDS = new Set([
  'autoPostToX',
  'xPostCustomText',
  'xPostStatus',
  'xPostText',
  'xPostUrl',
  'xPostedAt',
  'xPostError',
  '_rev',
  '_updatedAt',
]);
const SUPPORTED_TYPES = new Set([
  'article',
  'headline',
  'fantasyFootball',
  'rankings',
  'category',
  'topicHub',
]);
const SOCIAL_TYPES = new Set(['article', 'headline', 'fantasyFootball', 'rankings']);

type DocType = 'article' | 'headline' | 'fantasyFootball' | 'rankings' | 'category' | 'topicHub';

type SlugValue = { current?: string | null } | string | null | undefined;

type SanityDoc = {
  _id?: string;
  _type?: string;
  title?: string | null;
  summary?: string | null;
  slug?: SlugValue;
  format?: string | null;
  rankingType?: string | null;
  seasonYear?: number | null;
  weekNumber?: number | null;
  playoffRound?: string | null;
  published?: boolean | null;
  date?: string | null;
  publishedAt?: string | null;
  _updatedAt?: string | null;
  category?: {
    slug?: SlugValue;
  } | null;
  [key: string]: unknown;
};

type SanityWebhookBody = {
  id?: string;
  eventId?: string;
  transactionId?: string;
  documentId?: string;
  _id?: string;
  transition?: string;
  operation?: string;
  document?: SanityDoc;
  result?: SanityDoc;
  after?: SanityDoc;
  before?: SanityDoc;
  previous?: SanityDoc;
  [key: string]: unknown;
};

type VerifyResult =
  | { ok: true }
  | { ok: false; status: number; message: string };

type ParsedRequestResult =
  | { ok: true; body: SanityWebhookBody | null; rawBody: string }
  | { ok: false; status: number; message: string };

type NormalizedDoc = {
  _id?: string;
  _type?: DocType;
  title?: string | null;
  summary?: string | null;
  slug?: string | null;
  format?: string | null;
  rankingType?: string | null;
  seasonYear?: number | null;
  weekNumber?: number | null;
  playoffRound?: string | null;
  published?: boolean | null;
  date?: string | null;
  publishedAt?: string | null;
  _updatedAt?: string | null;
  categorySlug?: string | null;
};

declare global {
  var __recentSanityWebhookEvents: Map<string, number> | undefined;
}

const recentSanityWebhookEvents =
  global.__recentSanityWebhookEvents ?? (global.__recentSanityWebhookEvents = new Map<string, number>());

function verifySecret(request: NextRequest): VerifyResult {
  if (!SECRET) {
    if (process.env.NODE_ENV === 'production') {
      return { ok: false, status: 500, message: 'Server secret is not configured.' };
    }
    return { ok: true };
  }

  const { searchParams } = new URL(request.url);
  const secretFromQuery = searchParams.get('secret');
  const secretFromHeader = request.headers.get('x-webhook-secret') || request.headers.get('x-revalidate-secret');
  const secret = secretFromQuery ?? secretFromHeader ?? '';

  if (secret !== SECRET) {
    return { ok: false, status: 401, message: 'Invalid secret.' };
  }

  return { ok: true };
}

async function parseAndVerifyRequest(request: NextRequest): Promise<ParsedRequestResult> {
  const hasSanitySignature = !!request.headers.get(SANITY_SIGNATURE_HEADER);

  if (hasSanitySignature) {
    if (!SECRET) {
      if (process.env.NODE_ENV === 'production') {
        return { ok: false, status: 500, message: 'Server secret is not configured.' };
      }

      return { ok: false, status: 400, message: 'Webhook signature requires a configured secret.' };
    }

    const { body, isValidSignature } = await parseBody<SanityWebhookBody>(request, SECRET, false);
    if (isValidSignature !== true) {
      return { ok: false, status: 401, message: 'Invalid webhook signature.' };
    }

    return {
      ok: true,
      body,
      rawBody: body ? JSON.stringify(body) : '',
    };
  }

  const verification = verifySecret(request);
  if (!verification.ok) {
    return verification;
  }

  const rawBody = await request.text();
  if (!rawBody) {
    return { ok: true, body: null, rawBody };
  }

  try {
    return {
      ok: true,
      body: (JSON.parse(rawBody) as SanityWebhookBody) ?? null,
      rawBody,
    };
  } catch {
    return { ok: false, status: 400, message: 'Invalid JSON payload.' };
  }
}

function trimString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function extractSlug(value: SlugValue): string | null {
  if (typeof value === 'string') return trimString(value);
  if (!value || typeof value !== 'object') return null;
  return trimString(value.current);
}

function normalizeDoc(input: unknown): NormalizedDoc | null {
  if (!input || typeof input !== 'object') return null;
  const doc = input as SanityDoc;
  const rawType = trimString(doc._type);
  const type = rawType && SUPPORTED_TYPES.has(rawType) ? (rawType as DocType) : undefined;
  const categorySlug = doc.category && typeof doc.category === 'object' ? extractSlug(doc.category.slug) : null;

  return {
    _id: trimString(doc._id) ?? undefined,
    _type: type,
    title: trimString(doc.title),
    summary: trimString(doc.summary),
    slug: extractSlug(doc.slug),
    format: trimString(doc.format),
    rankingType: trimString(doc.rankingType),
    seasonYear: typeof doc.seasonYear === 'number' ? doc.seasonYear : null,
    weekNumber: typeof doc.weekNumber === 'number' ? doc.weekNumber : null,
    playoffRound: trimString(doc.playoffRound),
    published: typeof doc.published === 'boolean' ? doc.published : null,
    date: trimString(doc.date),
    publishedAt: trimString(doc.publishedAt),
    _updatedAt: trimString(doc._updatedAt),
    categorySlug,
  };
}

function extractCurrentDocCandidate(body: SanityWebhookBody | null) {
  return body?.document ?? body?.result ?? body?.after ?? body;
}

function extractPreviousDocCandidate(body: SanityWebhookBody | null) {
  return body?.before ?? body?.previous ?? null;
}

function cleanDocumentId(id: string) {
  return id.replace(/^drafts\./, '');
}

function extractDocumentId(body: SanityWebhookBody | null, ...docs: Array<NormalizedDoc | null>) {
  const candidates = [
    body?.documentId,
    body?._id,
    body?.document?._id,
    body?.result?._id,
    body?.after?._id,
    body?.before?._id,
    body?.previous?._id,
    ...docs.map((doc) => doc?._id),
  ];

  for (const candidate of candidates) {
    const trimmed = trimString(candidate);
    if (trimmed) return trimmed;
  }

  return null;
}

function hashValue(value: string) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function pruneRecentEvents(now: number) {
  for (const [eventId, expiresAt] of recentSanityWebhookEvents.entries()) {
    if (expiresAt <= now) {
      recentSanityWebhookEvents.delete(eventId);
    }
  }
}

function isRecentDuplicate(eventId: string) {
  const now = Date.now();
  pruneRecentEvents(now);
  const expiresAt = recentSanityWebhookEvents.get(eventId);
  if (typeof expiresAt === 'number' && expiresAt > now) {
    return true;
  }
  return false;
}

function rememberRecentEvent(eventId: string) {
  recentSanityWebhookEvents.set(eventId, Date.now() + RECENT_EVENT_TTL_MS);
}

function forgetRecentEvent(eventId: string) {
  recentSanityWebhookEvents.delete(eventId);
}

function extractExplicitEventId(request: NextRequest, body: SanityWebhookBody | null) {
  const headerCandidates = [
    request.headers.get('idempotency-key'),
    request.headers.get('x-idempotency-key'),
    request.headers.get('sanity-webhook-id'),
    request.headers.get('x-sanity-webhook-id'),
    request.headers.get('x-sanity-event-id'),
    request.headers.get('sanity-event-id'),
    request.headers.get('x-sanity-transaction-id'),
    request.headers.get('sanity-transaction-id'),
  ];
  const bodyCandidates = [body?.id, body?.eventId, body?.transactionId];

  for (const candidate of [...headerCandidates, ...bodyCandidates]) {
    const trimmed = trimString(candidate);
    if (trimmed) return trimmed;
  }

  return null;
}

function buildTransientEventId(rawBody: string, documentId: string | null, transition: string | null) {
  const source = rawBody.trim() || JSON.stringify({ documentId, transition });
  return `sanity-transient:${hashValue(source)}`;
}

function buildPersistentEventId(
  request: NextRequest,
  body: SanityWebhookBody | null,
  documentId: string | null,
  currentDoc: NormalizedDoc | null,
  previousDoc: NormalizedDoc | null,
) {
  const explicitId = extractExplicitEventId(request, body);
  if (explicitId) {
    return `sanity:${explicitId}`;
  }

  const payload = {
    documentId: documentId ? cleanDocumentId(documentId) : null,
    transition: trimString(body?.transition),
    operation: trimString(body?.operation),
    current: currentDoc,
    previous: previousDoc,
  };

  return `sanity:${hashValue(JSON.stringify(payload))}`;
}

async function resolvePublishedDoc(documentId: string | null): Promise<NormalizedDoc | null> {
  const cleanedId = documentId ? cleanDocumentId(documentId) : null;
  if (!cleanedId) return null;

  try {
    const resolved = await client.withConfig({ useCdn: false }).fetch<SanityDoc | null>(
      `*[_id == $cleanId][0]{
        _id,
        _type,
        title,
        summary,
        slug,
        format,
        rankingType,
        seasonYear,
        weekNumber,
        playoffRound,
        published,
        date,
        publishedAt,
        _updatedAt,
        category->{slug}
      }`,
      { cleanId: cleanedId }
    );

    return normalizeDoc(resolved);
  } catch (error) {
    console.error(`[${ROUTE_NAME}] failed to resolve published document`, {
      documentId: cleanedId,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

function isPublicContentDocType(type: DocType | undefined) {
  return type === 'article' || type === 'headline' || type === 'fantasyFootball' || type === 'rankings';
}

function needsPublishedResolution(doc: NormalizedDoc | null) {
  if (!doc?._type) return true;
  if (isPublicContentDocType(doc._type) && (doc.published == null || !doc.slug)) return true;
  if ((doc._type === 'category' || doc._type === 'topicHub') && !doc.slug) return true;
  return false;
}

function isAutopostOnlyMutation(body: SanityWebhookBody | null) {
  const before = extractPreviousDocCandidate(body);
  const after = extractCurrentDocCandidate(body);

  if (!before || typeof before !== 'object' || !after || typeof after !== 'object') {
    return false;
  }

  const beforeRecord = before as Record<string, unknown>;
  const afterRecord = after as Record<string, unknown>;
  const keys = new Set([...Object.keys(beforeRecord), ...Object.keys(afterRecord)]);
  const changedKeys = Array.from(keys).filter((key) => {
    const beforeValue = beforeRecord[key];
    const afterValue = afterRecord[key];
    return JSON.stringify(beforeValue ?? null) !== JSON.stringify(afterValue ?? null);
  });

  return changedKeys.length > 0 && changedKeys.every((key) => AUTPOST_METADATA_FIELDS.has(key));
}

function buildDetailPath(doc: NormalizedDoc | null) {
  if (!doc?._type || !doc.slug) return null;
  const slug = encodeURIComponent(doc.slug);

  if (doc._type === 'fantasyFootball') {
    return `/fantasy/${slug}`;
  }

  if (doc._type === 'topicHub') {
    return `/${slug}`;
  }

  if (doc._type === 'category') {
    return `/categories/${slug}`;
  }

  return `/articles/${slug}`;
}

function addArticlePaths(paths: Set<string>, doc: NormalizedDoc | null, previousDoc: NormalizedDoc | null) {
  paths.add('/articles');
  paths.add('/');

  const currentDetail = buildDetailPath(doc);
  if (currentDetail) paths.add(currentDetail);

  const previousDetail = buildDetailPath(previousDoc);
  if (previousDetail) paths.add(previousDetail);

  if (doc?._type === 'headline' || doc?.format === 'headline' || previousDoc?._type === 'headline' || previousDoc?.format === 'headline') {
    paths.add('/headlines');
  }

  if (doc?.format === 'fantasy' || previousDoc?.format === 'fantasy') {
    paths.add('/fantasy');
  }

  if (doc?.format === 'powerRankings' || previousDoc?.format === 'powerRankings') {
    paths.add('/articles/power-rankings');

    for (const candidate of [doc, previousDoc]) {
      if (!candidate?.seasonYear) continue;
      const weekPart =
        typeof candidate.weekNumber === 'number'
          ? `week-${candidate.weekNumber}`
          : candidate.playoffRound?.toLowerCase();
      if (weekPart) {
        paths.add(`/articles/power-rankings/${candidate.seasonYear}/${weekPart}`);
      }
    }
  }
}

function buildRevalidationPaths(doc: NormalizedDoc | null, previousDoc: NormalizedDoc | null) {
  const paths = new Set<string>();
  const effectiveType = doc?._type ?? previousDoc?._type;

  switch (effectiveType) {
    case 'article':
    case 'headline':
    case 'rankings':
      addArticlePaths(paths, doc, previousDoc);
      break;
    case 'fantasyFootball':
      paths.add('/');
      paths.add('/fantasy');
      if (doc?.slug) paths.add(`/fantasy/${encodeURIComponent(doc.slug)}`);
      if (previousDoc?.slug) paths.add(`/fantasy/${encodeURIComponent(previousDoc.slug)}`);
      break;
    case 'category':
      paths.add('/categories');
      if (doc?.slug) paths.add(`/categories/${encodeURIComponent(doc.slug)}`);
      if (previousDoc?.slug) paths.add(`/categories/${encodeURIComponent(previousDoc.slug)}`);
      break;
    case 'topicHub':
      if (doc?.slug) paths.add(`/${encodeURIComponent(doc.slug)}`);
      if (previousDoc?.slug) paths.add(`/${encodeURIComponent(previousDoc.slug)}`);
      break;
    default:
      break;
  }

  return Array.from(paths);
}

async function beginProcessing(eventId: string, eventType: string, payload: unknown) {
  try {
    return await beginWebhookEventProcessing({
      provider: WebhookProvider.SANITY,
      eventId,
      eventType,
      payload,
    });
  } catch (error) {
    console.error(`[${ROUTE_NAME}] webhook dedupe unavailable`, error);
    return null;
  }
}

async function updateWebhookLog(
  status: 'processed' | 'skipped' | 'failed',
  logId: string | null,
  error?: unknown,
) {
  if (!logId) return;

  try {
    if (status === 'processed') {
      await markWebhookEventProcessed(logId);
      return;
    }

    if (status === 'skipped') {
      await markWebhookEventSkipped(logId);
      return;
    }

    await markWebhookEventFailed(logId, error);
  } catch (updateError) {
    console.error(`[${ROUTE_NAME}] failed to update webhook log`, updateError);
  }
}

async function respondSkipped(logId: string | null, reason: string, extra: Record<string, unknown> = {}) {
  await updateWebhookLog('skipped', logId);
  return NextResponse.json(
    { ok: true, revalidated: false, skipped: true, reason, ...extra },
    { status: 200 },
  );
}

export async function POST(request: NextRequest) {
  const parsedRequest = await parseAndVerifyRequest(request);
  if (!parsedRequest.ok) {
    return NextResponse.json({ revalidated: false, message: parsedRequest.message }, { status: parsedRequest.status });
  }

  let webhookLogId: string | null = null;
  let transientEventId: string | null = null;

  try {
    const { body, rawBody } = parsedRequest;

    const transition = trimString(body?.transition);
    const currentDoc = normalizeDoc(extractCurrentDocCandidate(body));
    const previousDoc = normalizeDoc(extractPreviousDocCandidate(body));
    const documentId = extractDocumentId(body, currentDoc, previousDoc);

    transientEventId = buildTransientEventId(rawBody, documentId, transition);
    if (isRecentDuplicate(transientEventId)) {
      return NextResponse.json(
        { ok: true, revalidated: false, duplicate: true, reason: 'recent-duplicate' },
        { status: 200 },
      );
    }

    rememberRecentEvent(transientEventId);

    if (!body || typeof body !== 'object') {
      forgetRecentEvent(transientEventId);
      return NextResponse.json({ revalidated: false, message: 'Missing document payload.' }, { status: 400 });
    }

    const resolvedCurrentDoc = needsPublishedResolution(currentDoc)
      ? await resolvePublishedDoc(documentId)
      : currentDoc;
    const effectiveDoc = resolvedCurrentDoc ?? currentDoc ?? previousDoc;
    const eventId = buildPersistentEventId(request, body, documentId, resolvedCurrentDoc ?? currentDoc, previousDoc);
    const eventType = transition ? `transition:${transition}` : trimString(body.operation) ?? 'unknown';
    const webhookLog = await beginProcessing(eventId, eventType, body);

    webhookLogId = webhookLog?.logId ?? null;

    if (webhookLog?.isDuplicateProcessed) {
      return NextResponse.json(
        { ok: true, revalidated: false, duplicate: true, reason: 'deduped-event-log' },
        { status: 200 },
      );
    }

    if (isAutopostOnlyMutation(body)) {
      return respondSkipped(webhookLogId, 'autopost-only-mutation');
    }

    if (!effectiveDoc?._type || !SUPPORTED_TYPES.has(effectiveDoc._type)) {
      return respondSkipped(webhookLogId, 'unsupported-or-missing-document-type', { documentId });
    }

    const isPublicContentDoc = isPublicContentDocType(effectiveDoc._type);

    if (isPublicContentDoc && transition !== 'disappear' && effectiveDoc.published !== true) {
      return respondSkipped(webhookLogId, 'draft-or-unpublished-document', { documentId });
    }

    const paths = buildRevalidationPaths(effectiveDoc, previousDoc);
    if (paths.length === 0) {
      return respondSkipped(webhookLogId, 'no-target-paths', { documentId });
    }

    await Promise.all(paths.map((path) => revalidatePath(path)));

    let social: Awaited<ReturnType<typeof autopostDocumentToX>> | null = null;
    const shouldAttemptSocial =
      !!documentId &&
      !!effectiveDoc._type &&
      SOCIAL_TYPES.has(effectiveDoc._type) &&
      transition === 'appear';

    if (shouldAttemptSocial) {
      try {
        social = await autopostDocumentToX({ id: documentId! });
      } catch (error) {
        console.error(`[${ROUTE_NAME}] social autopost failed`, error);
        social = {
          ok: false,
          error: error instanceof Error ? error.message : 'Unknown social autopost error',
          docId: cleanDocumentId(documentId!),
        };
      }
    }

    console.info(`[${ROUTE_NAME}] revalidated ${paths.length} path(s)`, {
      documentId: documentId ? cleanDocumentId(documentId) : null,
      type: effectiveDoc._type,
      transition,
      paths,
      socialStatus: social?.reason ?? (social?.ok ? 'processed' : social?.error ?? null),
    });

    await updateWebhookLog('processed', webhookLogId);

    return NextResponse.json(
      { ok: true, revalidated: true, paths, social },
      { status: 200 },
    );
  } catch (error) {
    if (transientEventId) {
      forgetRecentEvent(transientEventId);
    }
    await updateWebhookLog('failed', webhookLogId, error);
    console.error(`[${ROUTE_NAME}] failed`, error);
    return NextResponse.json(
      { revalidated: false, message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const verification = verifySecret(request);
  if (!verification.ok) {
    return NextResponse.json({ ok: false, message: verification.message }, { status: verification.status });
  }

  return NextResponse.json({ ok: true, route: ROUTE_NAME }, { status: 200 });
}
