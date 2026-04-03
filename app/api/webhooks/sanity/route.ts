import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { autopostDocumentToX } from '@/lib/social/x-autopost';

const ROUTE_NAME = 'api/webhooks/sanity';
const SECRET = process.env.SANITY_WEBHOOK_SECRET ?? process.env.REVALIDATE_SECRET;

type SanityDoc = {
  _id?: string;
  _type?: string;
  slug?: { current?: string } | string | null;
  format?: string | null;
  rankingType?: string | null;
  seasonYear?: number | null;
  weekNumber?: number | null;
  playoffRound?: string | null;
};

type SanityWebhookBody = {
  documentId?: string;
  _id?: string;
  transition?: string;
  document?: SanityDoc;
  result?: SanityDoc;
  after?: SanityDoc;
  [key: string]: unknown;
};

function extractDocumentId(body: SanityWebhookBody | null, doc: SanityDoc | null) {
  const candidates = [
    body?.documentId,
    body?._id,
    body?.document?._id,
    body?.result?._id,
    body?.after?._id,
    doc?._id,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) return candidate.trim();
  }

  return null;
}

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
    const doc = (body?.document ?? body?.result ?? body?.after ?? body) as SanityDoc | null;

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

    const documentId = extractDocumentId(body, doc);
    const shouldAttemptSocial = !!documentId && ['article', 'headline', 'fantasyFootball', 'rankings'].includes(type);
    const transition = typeof body?.transition === 'string' ? body.transition : null;

    let social: Awaited<ReturnType<typeof autopostDocumentToX>> | null = null;
    if (shouldAttemptSocial) {
      if (transition && transition !== 'appear') {
        social = {
          ok: true,
          skipped: true,
          reason: 'not-appear-transition',
          docId: documentId || undefined,
        };
      } else {
        try {
          social = await autopostDocumentToX({ id: documentId! });
        } catch (error) {
          console.error(`[${ROUTE_NAME}] social autopost failed`, error);
          social = {
            ok: false,
            error: error instanceof Error ? error.message : 'Unknown social autopost error',
            docId: documentId || undefined,
          };
        }
      }
    }

    return NextResponse.json(
      { revalidated: true, paths: Array.from(paths), social },
      { status: 200 },
    );
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
