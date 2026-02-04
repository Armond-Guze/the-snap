import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

const ROUTE_NAME = 'api/webhooks/sanity';
const SECRET = process.env.SANITY_WEBHOOK_SECRET ?? process.env.REVALIDATE_SECRET;

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
  try {
    const { searchParams } = new URL(request.url);
    const secretFromQuery = searchParams.get('secret');
    const secretFromHeader = request.headers.get('x-webhook-secret') || request.headers.get('x-revalidate-secret');
    const secret = secretFromQuery ?? secretFromHeader ?? '';

    if (SECRET && secret !== SECRET) {
      return NextResponse.json({ revalidated: false, message: 'Invalid secret.' }, { status: 401 });
    }

    const body: SanityWebhookBody | null = await request.json().catch(() => null);
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
      { revalidated: false, message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const secretFromQuery = searchParams.get('secret') ?? '';

  if (SECRET && secretFromQuery !== SECRET) {
    return NextResponse.json({ ok: false, message: 'Invalid secret.' }, { status: 401 });
  }

  return NextResponse.json({ ok: true, route: ROUTE_NAME }, { status: 200 });
}