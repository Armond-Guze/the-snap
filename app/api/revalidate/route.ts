import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { fetchNFLStandingsWithFallback } from '@/lib/nfl-api';
import { authorizeBearerRequest, bearerErrorHeaders } from '@/lib/security/bearer-auth';

const ROUTE_NAME = 'api/revalidate';
const MAX_REVALIDATION_TARGETS = 50;

type RevalidateResult = {
  revalidated: boolean;
  tags?: string[];
  paths?: string[];
  warmed?: Record<string, number>;
  message?: string;
};

export async function POST(request: NextRequest) {
  const authorization = authorizeBearerRequest(request.headers, [
    process.env.REVALIDATE_SECRET,
    process.env.CRON_SECRET,
  ]);
  if (!authorization.authorized) {
    return NextResponse.json(
      {
        revalidated: false,
        message: authorization.status === 503 ? 'Service unavailable.' : 'Unauthorized.',
      },
      {
        status: authorization.status,
        headers: bearerErrorHeaders(authorization.status),
      }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const tagParam = searchParams.getAll('tag');
    const pathParam = searchParams.getAll('path');

    const parsedBody = await readBody(request);
    if (!parsedBody.ok) {
      return NextResponse.json(
        { revalidated: false, message: 'Invalid request body.' },
        { status: 400 }
      );
    }

    const rawBody = parsedBody.body;
    if (rawBody !== null && !isRevalidateBody(rawBody)) {
      return NextResponse.json(
        { revalidated: false, message: 'Invalid request body.' },
        { status: 400 }
      );
    }
    const body = rawBody;

    const tags = Array.from(new Set([...tagParam, ...(body?.tags ?? [])]));
    const paths = Array.from(new Set([...pathParam, ...(body?.paths ?? [])]));

    if (
      tags.length + paths.length > MAX_REVALIDATION_TARGETS ||
      !tags.every(isValidTag) ||
      !paths.every(isValidPath)
    ) {
      return NextResponse.json(
        { revalidated: false, message: 'Invalid revalidation targets.' },
        { status: 400 }
      );
    }

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
      { revalidated: false, message: 'Revalidation failed.' },
      { status: 500 }
    );
  }
}

async function readBody(
  request: NextRequest
): Promise<{ ok: true; body: unknown | null } | { ok: false }> {
  if (
    request.headers.get('content-length') === '0' ||
    !request.headers.get('content-type')
  ) {
    return { ok: true, body: null };
  }

  const contentLength = Number(request.headers.get('content-length') ?? 0);
  if (Number.isFinite(contentLength) && contentLength > 16_384) {
    return { ok: false };
  }

  try {
    const data = await request.json();
    return { ok: true, body: data };
  } catch {
    return { ok: false };
  }
}

function isRevalidateBody(value: unknown): value is { tags?: string[]; paths?: string[] } {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;

  const body = value as Record<string, unknown>;
  return (
    (body.tags === undefined || (Array.isArray(body.tags) && body.tags.every((tag) => typeof tag === 'string'))) &&
    (body.paths === undefined || (Array.isArray(body.paths) && body.paths.every((path) => typeof path === 'string')))
  );
}

function isValidTag(tag: string): boolean {
  return tag.length > 0 && tag.length <= 128 && !/[\u0000-\u001f\u007f]/.test(tag);
}

function isValidPath(path: string): boolean {
  return (
    path.length > 0 &&
    path.length <= 2_048 &&
    path.startsWith('/') &&
    !path.startsWith('//') &&
    !path.includes('\\') &&
    !/[\u0000-\u001f\u007f]/.test(path)
  );
}

async function maybeWarmCache(tag: string): Promise<number | undefined> {
  if (tag !== 'standings') {
    return undefined;
  }

  const teams = await fetchNFLStandingsWithFallback();
  return teams.length;
}
