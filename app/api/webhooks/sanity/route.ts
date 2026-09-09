import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { authorizeBearerRequest, bearerErrorHeaders } from '@/lib/security/bearer-auth';
import { parseBody } from 'next-sanity/webhook';

const ROUTE_NAME = 'api/webhooks/sanity';

type SanityDoc = {
  _type?: string;
  slug?: { current?: string } | string | null;
  format?: string | null;
  rankingType?: string | null;
  seasonYear?: number | null;
  weekNumber?: number | null;
  playoffRound?: string | null;
};

type SanityWebhookBody = {
  document?: SanityDoc;
  result?: SanityDoc;
  [key: string]: unknown;
};

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.SANITY_WEBHOOK_SECRET?.trim();
  if (!webhookSecret) {
    return NextResponse.json(
      { revalidated: false, message: 'Service unavailable.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  try {
    const { body, isValidSignature } = await parseBody<SanityWebhookBody>(
      request,
      webhookSecret,
      false
    );
    if (!isValidSignature) {
      return NextResponse.json(
        { revalidated: false, message: 'Unauthorized.' },
        { status: 401, headers: { 'Cache-Control': 'no-store' } }
      );
    }
    const doc = (body?.document ?? body?.result ?? body) as SanityDoc | null;

    if (!doc || typeof doc !== 'object') {
      return NextResponse.json({ revalidated: false, message: 'Missing document payload.' }, { status: 400 });
    }

    const paths = new Set<string>(['/', '/headlines', '/articles', '/sitemap.xml', '/rss.xml']);
    const type = doc._type || '';
    const format = doc.format || '';

    const rawSlug = typeof doc.slug === 'string'
      ? doc.slug
      : doc.slug?.current;
    const slug = rawSlug ? encodeURIComponent(rawSlug.trim()) : null;

    if (type === 'headline' || (type === 'article' && format === 'headline')) {
      if (slug) {
        paths.add(`/articles/${slug}`);
      }
      paths.add('/headlines');
      paths.add('/articles');
    }

    if (type === 'article' && format !== 'headline') {
      if (slug) {
        paths.add(`/articles/${slug}`);
      }
      if (format === 'powerRankings') {
        paths.add('/articles/power-rankings');
        if (doc.seasonYear) {
          const weekPart = typeof doc.weekNumber === 'number'
            ? `week-${doc.weekNumber}`
            : doc.playoffRound?.toLowerCase();
          if (weekPart) {
            paths.add(`/articles/power-rankings/${doc.seasonYear}/${weekPart}`);
          }
        }
      }
      paths.add('/articles');
    }

    if (type === 'fantasyFootball') {
      if (slug) paths.add(`/fantasy/${slug}`);
      paths.add('/fantasy');
    }

    if (type === 'category') {
      if (slug) paths.add(`/categories/${slug}`);
      paths.add('/categories');
    }

    await Promise.all(
      Array.from(paths).map(async (path) => {
        await revalidatePath(path);
        console.log(`[${ROUTE_NAME}] revalidated`, path);
      })
    );

    return NextResponse.json({ revalidated: true, paths: Array.from(paths) }, { status: 200 });
  } catch (error) {
    console.error(`[${ROUTE_NAME}] failed`, error);
    return NextResponse.json(
      { revalidated: false, message: 'Revalidation failed.' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const authorization = authorizeBearerRequest(request.headers, [process.env.WEBHOOK_DIAGNOSTIC_SECRET]);
  if (!authorization.authorized) {
    return NextResponse.json(
      {
        ok: false,
        message: authorization.status === 503 ? 'Service unavailable.' : 'Unauthorized.',
      },
      {
        status: authorization.status,
        headers: bearerErrorHeaders(authorization.status),
      }
    );
  }

  return NextResponse.json(
    { ok: true, route: ROUTE_NAME },
    { status: 200, headers: { 'Cache-Control': 'no-store' } }
  );
}
