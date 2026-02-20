import { NextRequest } from 'next/server';
import { client as baseClient } from '@/sanity/lib/client';
import { postTweet } from '@/lib/twitter';
import { SITE_URL } from '@/lib/site-config';

export const dynamic = 'force-dynamic';

// Minimal GROQ to get the fields needed for the tweet
const HEADLINE_GROQ = `*[_type == \"headline\" && _id == $id && published == true][0]{
  _id,
  title,
  slug,
  summary,
  date,
  author->{ name },
  category->{ title },
  "tags": coalesce(tagRefs[]->title, tags[])
}`;

function verifySecret(req: NextRequest) {
  const secret = process.env.SANITY_WEBHOOK_SECRET;
  if (!secret) return true; // allow if not configured
  const url = new URL(req.url);
  const token = url.searchParams.get('secret');
  return token === secret;
}

// Lightweight diagnostics: report whether env is configured (no secret values leaked)
export async function GET(req: NextRequest) {
  if (!verifySecret(req)) {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid secret' }), { status: 401 });
  }

  const has = {
    X_API_KEY: !!process.env.X_API_KEY || !!process.env.TWITTER_API_KEY,
    X_API_SECRET: !!process.env.X_API_SECRET || !!process.env.TWITTER_API_SECRET,
    X_ACCESS_TOKEN: !!process.env.X_ACCESS_TOKEN || !!process.env.TWITTER_ACCESS_TOKEN,
    X_ACCESS_SECRET: !!process.env.X_ACCESS_SECRET || !!process.env.TWITTER_ACCESS_SECRET,
    X_BEARER_TOKEN: !!process.env.X_BEARER_TOKEN || !!process.env.TWITTER_BEARER_TOKEN,
    SANITY_WEBHOOK_SECRET: !!process.env.SANITY_WEBHOOK_SECRET,
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

  return new Response(JSON.stringify(info), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

export async function POST(req: NextRequest) {
  if (!verifySecret(req)) {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid secret' }), { status: 401 });
  }

  const payload = await req.json().catch(() => null);
  // Skip if webhook indicates deletion, or not newly visible
  if (payload && (payload.isDeleted === true || payload.delete === true)) {
    return new Response(JSON.stringify({ ok: true, skipped: true, reason: 'deleted' }), { status: 200 });
  }
  if (payload && payload.transition && payload.transition !== 'appear') {
    // Only act the first time it appears (becomes published)
    return new Response(JSON.stringify({ ok: true, skipped: true, reason: 'not appear transition' }), { status: 200 });
  }
  // Accept either full Sanity webhook body or a simple {id}
  const id = payload?.documentId || payload?._id || payload?.id || payload?.document?._id || payload?.after?._id;
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
  const urlObj = new URL(`/headlines/${slug}`, baseUrl);
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
  const result = await postTweet({
    title: doc.title,
    url,
    category: doc.category?.title || null,
    author: doc.author?.name || null,
    tags: Array.isArray(doc.tags) ? doc.tags.filter(Boolean).slice(0, 3) : [],
    dryRun,
    templateIndex,
  });

  const status = result.ok ? 200 : 500;
  return new Response(JSON.stringify(result), { status, headers: { 'Content-Type': 'application/json' } });
}
