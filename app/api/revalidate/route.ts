import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { fetchNFLStandingsWithFallback } from '@/lib/nfl-api';

const ROUTE_NAME = 'api/revalidate';
const DEFAULT_SECRET = process.env.REVALIDATE_SECRET ?? process.env.SANITY_WEBHOOK_SECRET;

type RevalidateResult = {
  revalidated: boolean;
  tags?: string[];
  paths?: string[];
  warmed?: Record<string, number>;
  message?: string;
};

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const secretFromQuery = searchParams.get('secret');
    const secretFromHeader = request.headers.get('x-revalidate-secret');
    const secret = secretFromQuery ?? secretFromHeader ?? '';
    const isVercelCron = Boolean(request.headers.get('x-vercel-cron'));

    if (!DEFAULT_SECRET && !isVercelCron) {
      return NextResponse.json(
        { revalidated: false, message: 'Server secret is not configured.' },
        { status: 500 }
      );
    }

    if (!isVercelCron) {
      if (!DEFAULT_SECRET) {
        return NextResponse.json({ revalidated: false, message: 'Secret validation unavailable.' }, { status: 401 });
      }

      if (secret !== DEFAULT_SECRET) {
        return NextResponse.json({ revalidated: false, message: 'Invalid secret.' }, { status: 401 });
      }
    }

    const tagParam = searchParams.getAll('tag');
    const pathParam = searchParams.getAll('path');

    const body = await readBody(request);
    const tags = [...tagParam, ...(body?.tags ?? [])].filter(Boolean);
    const paths = [...pathParam, ...(body?.paths ?? [])].filter(Boolean);

    if (!tags.length && !paths.length) {
      return NextResponse.json(
        { revalidated: false, message: 'Provide at least one tag or path to revalidate.' },
        { status: 400 }
      );
    }

    const warmed: Record<string, number> = {};

    await Promise.all([
      ...tags.map(async (tag) => {
        await revalidateTag(tag, {});
        console.log(`[${ROUTE_NAME}] revalidated tag`, tag);
        const warmCount = await maybeWarmCache(tag);
        if (typeof warmCount === 'number') {
          warmed[tag] = warmCount;
        }
      }),
      ...paths.map(async (path) => {
        await revalidatePath(path);
        console.log(`[${ROUTE_NAME}] revalidated path`, path);
      })
    ]);

    const payload: RevalidateResult = {
      revalidated: true,
      ...(tags.length ? { tags } : {}),
      ...(paths.length ? { paths } : {}),
      ...(Object.keys(warmed).length ? { warmed } : {})
    };

    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    console.error(`[${ROUTE_NAME}] failed`, error);
    return NextResponse.json(
      { revalidated: false, message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function readBody(request: NextRequest): Promise<{ tags?: string[]; paths?: string[] } | null> {
  if (request.headers.get('content-length') === '0') {
    return null;
  }

  try {
    const data = await request.json();
    return data;
  } catch {
    return null;
  }
}

async function maybeWarmCache(tag: string): Promise<number | undefined> {
  if (tag !== 'standings') {
    return undefined;
  }

  const teams = await fetchNFLStandingsWithFallback();
  return teams.length;
}
