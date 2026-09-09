import { NextRequest } from 'next/server';
import { createHash } from 'node:crypto';
import { WebhookProvider } from '@prisma/client';
import { parseBody } from 'next-sanity/webhook';
import { client as baseClient } from '@/sanity/lib/client';
import { postTweet } from '@/lib/twitter';
import { SITE_URL } from '@/lib/site-config';
import { authorizeBearerRequest, bearerErrorHeaders } from '@/lib/security/bearer-auth';
import {
  beginWebhookEventProcessing,
  markWebhookEventFailed,
  markWebhookEventProcessed,
} from '@/lib/security/webhook-events';

export const dynamic = 'force-dynamic';

type SocialWebhookPayload = {
  isDeleted?: boolean;
  delete?: boolean;
  transition?: string;
  documentId?: string;
  _id?: string;
  id?: string;
  document?: { _id?: string };
  after?: { _id?: string };
  [key: string]: unknown;
};

// Minimal GROQ to get the fields needed for the tweet
const HEADLINE_GROQ = `*[
  ((_type == "article" && format == "headline") || _type == "headline") &&
  _id == $id &&
  published == true
][0]{
  _id,
  title,
  slug,
  summary,
  date,
  author->{ name },
  category->{ title },
  "tags": coalesce(tagRefs[]->title, tags[])
}`;

function authorizeRequest(req: NextRequest): Response | null {
  const authorization = authorizeBearerRequest(req.headers, [process.env.WEBHOOK_DIAGNOSTIC_SECRET]);
  if (authorization.authorized) return null;

  return new Response(
    JSON.stringify({
      ok: false,
      error: authorization.status === 503 ? 'Service unavailable' : 'Unauthorized',
    }),
    {
      status: authorization.status,
      headers: {
        'Content-Type': 'application/json',
        ...bearerErrorHeaders(authorization.status),
      },
    }
  );
}

// Lightweight diagnostics: report whether env is configured (no secret values leaked)
export async function GET(req: NextRequest) {
  const authError = authorizeRequest(req);
  if (authError) return authError;

  const has = {
    X_API_KEY: !!process.env.X_API_KEY || !!process.env.TWITTER_API_KEY,
    X_API_SECRET: !!process.env.X_API_SECRET || !!process.env.TWITTER_API_SECRET,
    X_ACCESS_TOKEN: !!process.env.X_ACCESS_TOKEN || !!process.env.TWITTER_ACCESS_TOKEN,
    X_ACCESS_SECRET: !!process.env.X_ACCESS_SECRET || !!process.env.TWITTER_ACCESS_SECRET,
    X_BEARER_TOKEN: !!process.env.X_BEARER_TOKEN || !!process.env.TWITTER_BEARER_TOKEN,
    WEBHOOK_DIAGNOSTIC_SECRET: !!process.env.WEBHOOK_DIAGNOSTIC_SECRET,
    SITE_URL: !!process.env.SITE_URL,
  };

  const wouldDryRun = !((!!process.env.X_API_KEY || !!process.env.TWITTER_API_KEY)
    && (!!process.env.X_API_SECRET || !!process.env.TWITTER_API_SECRET)
    && (!!process.env.X_ACCESS_TOKEN || !!process.env.TWITTER_ACCESS_TOKEN)
    && (!!process.env.X_ACCESS_SECRET || !!process.env.TWITTER_ACCESS_SECRET));

  const info = {
    ok: true,
    envPresent: has,
    wouldDryRun,
    note: wouldDryRun ? 'Missing one or more X OAuth variables on the server.' : 'Ready to post (provided no &dry=1 in request).',
    runtime: 'node',
  };

  return new Response(JSON.stringify(info), {
    status: 200,
    headers: { 'Cache-Control': 'no-store', 'Content-Type': 'application/json' },
  });
}

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.SANITY_WEBHOOK_SECRET?.trim();
  if (!webhookSecret) {
    return new Response(JSON.stringify({ ok: false, error: 'Service unavailable' }), {
      status: 503,
      headers: { 'Cache-Control': 'no-store', 'Content-Type': 'application/json' },
    });
  }

  let payload: SocialWebhookPayload | null = null;
  try {
    const parsed = await parseBody<SocialWebhookPayload>(req, webhookSecret, false);
    if (!parsed.isValidSignature) {
      return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Cache-Control': 'no-store', 'Content-Type': 'application/json' },
      });
    }
    payload = parsed.body;
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid webhook payload' }), {
      status: 400,
      headers: { 'Cache-Control': 'no-store', 'Content-Type': 'application/json' },
    });
  }

  if (!payload) {
    return new Response(JSON.stringify({ ok: false, error: 'Missing webhook payload' }), { status: 400 });
  }

  // Skip if webhook indicates deletion, or not newly visible
  if (payload.isDeleted === true || payload.delete === true) {
    return new Response(JSON.stringify({ ok: true, skipped: true, reason: 'deleted' }), { status: 200 });
  }
  if (payload.transition && payload.transition !== 'appear') {
    // Only act the first time it appears (becomes published)
    return new Response(JSON.stringify({ ok: true, skipped: true, reason: 'not appear transition' }), { status: 200 });
  }
  // Accept either full Sanity webhook body or a simple {id}
  const id = payload.documentId || payload._id || payload.id || payload.document?._id || payload.after?._id;
  if (!id) {
    return new Response(JSON.stringify({ ok: false, error: 'Missing document id' }), { status: 400 });
  }

  // Use non-CDN client to avoid caching delays
  const client = baseClient.withConfig({ useCdn: false });
  const doc = await client.fetch(HEADLINE_GROQ, { id });
  if (!doc) {
    return new Response(JSON.stringify({ ok: false, error: 'Document not found or not a headline' }), { status: 404 });
  }

  const baseUrl = process.env.SITE_URL || SITE_URL;
  const slug = doc.slug?.current || '';
  const urlObj = new URL(`/articles/${slug}`, baseUrl);
  // Add UTM params for analytics
  urlObj.searchParams.set('utm_source', 'x');
  urlObj.searchParams.set('utm_medium', 'social');
  urlObj.searchParams.set('utm_campaign', 'headline');
  urlObj.searchParams.set('utm_content', slug);
  const url = urlObj.toString();

  const urlParams = new URL(req.url).searchParams;
  const forceDry = urlParams.get('dry') === '1' || urlParams.get('dry') === 'true';
  const styleParam = urlParams.get('style');
  const templateIndex = styleParam ? Number(styleParam) : undefined;

  // Dry-run if explicitly requested, or if any of the required X keys are missing
  const missingAny = !((!!process.env.X_API_KEY || !!process.env.TWITTER_API_KEY)
    && (!!process.env.X_API_SECRET || !!process.env.TWITTER_API_SECRET)
    && (!!process.env.X_ACCESS_TOKEN || !!process.env.TWITTER_ACCESS_TOKEN)
    && (!!process.env.X_ACCESS_SECRET || !!process.env.TWITTER_ACCESS_SECRET));
  const dryRun = forceDry || missingAny;
  let webhookLogId: string | null = null;

  if (!dryRun) {
    const eventId = `social:${createHash('sha256')
      .update(JSON.stringify(payload))
      .update(`\0style:${styleParam || ''}`)
      .digest('hex')}`;
    const webhookLog = await beginWebhookEventProcessing({
      provider: WebhookProvider.SANITY,
      eventId,
      eventType: 'article.publish.social',
      payload,
    });
    webhookLogId = webhookLog.logId;
    if (webhookLog.isDuplicateProcessed) {
      return new Response(JSON.stringify({ ok: true, skipped: true, reason: 'duplicate' }), {
        status: 200,
        headers: { 'Cache-Control': 'no-store', 'Content-Type': 'application/json' },
      });
    }
  }

  let result: Awaited<ReturnType<typeof postTweet>>;
  try {
    result = await postTweet({
      title: doc.title,
      url,
      category: doc.category?.title || null,
      author: doc.author?.name || null,
      tags: Array.isArray(doc.tags) ? doc.tags.filter(Boolean).slice(0, 3) : [],
      dryRun,
      templateIndex,
    });
  } catch (error) {
    if (webhookLogId) {
      await markWebhookEventFailed(webhookLogId, error).catch(() => undefined);
    }
    throw error;
  }

  if (webhookLogId) {
    if (result.ok) {
      await markWebhookEventProcessed(webhookLogId);
    } else {
      await markWebhookEventFailed(webhookLogId, result);
    }
  }

  const status = result.ok ? 200 : 500;
  return new Response(JSON.stringify(result), {
    status,
    headers: { 'Cache-Control': 'no-store', 'Content-Type': 'application/json' },
  });
}
