import { NextRequest } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { revalidatePath, revalidateTag } from 'next/cache';
import { computeDraftOrder } from '@/lib/draft-order';

type AuthResult =
  | { ok: true }
  | { ok: false; status: 401 | 503; error: string };

function secretsMatch(candidate: string, expected: string): boolean {
  const candidateBuffer = Buffer.from(candidate);
  const expectedBuffer = Buffer.from(expected);
  return candidateBuffer.length === expectedBuffer.length && timingSafeEqual(candidateBuffer, expectedBuffer);
}

function verifySecret(req: NextRequest): AuthResult {
  const configuredSecrets = [process.env.CRON_SECRET, process.env.SYNC_CRON_SECRET]
    .map((secret) => secret?.trim())
    .filter((secret): secret is string => Boolean(secret));

  if (configuredSecrets.length === 0) {
    return { ok: false, status: 503, error: 'Cron authentication is not configured' };
  }

  const authorization = req.headers.get('authorization')?.trim() || '';
  if (!authorization.startsWith('Bearer ')) {
    return { ok: false, status: 401, error: 'Unauthorized' };
  }

  const candidate = authorization.slice('Bearer '.length).trim();
  const valid = Boolean(candidate) && configuredSecrets.some((secret) => secretsMatch(candidate, secret));
  return valid ? { ok: true } : { ok: false, status: 401, error: 'Unauthorized' };
}

function parseSeason(value: unknown): number | undefined | null {
  if (value === undefined || value === null || value === '') return undefined;
  const season = typeof value === 'number' ? value : Number(value);
  return Number.isInteger(season) && season >= 1920 && season <= 2100 ? season : null;
}

async function getRequestedSeason(req: NextRequest): Promise<number | undefined | null> {
  if (req.method === 'GET') {
    return parseSeason(req.nextUrl.searchParams.get('season'));
  }

  const rawBody = await req.text();
  if (!rawBody.trim()) return undefined;
  try {
    const payload = JSON.parse(rawBody) as { season?: unknown };
    return parseSeason(payload?.season);
  } catch {
    return null;
  }
}

async function handleSync(req: NextRequest) {
  const auth = verifySecret(req);
  if (!auth.ok) {
    return Response.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  const season = await getRequestedSeason(req);
  if (season === null) {
    return Response.json({ ok: false, error: 'Season must be an integer between 1920 and 2100' }, { status: 400 });
  }

  try {
    const result = await computeDraftOrder(season);

    if (result.picks.length !== 32) {
      return Response.json(
        { ok: false, error: `Draft order is incomplete: expected 32 picks, received ${result.picks.length}` },
        { status: 502 },
      );
    }

    revalidatePath('/tankathon');
    revalidateTag('draft-order', {});

    return Response.json({ ok: true, result }, { status: 200 });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : 'Sync failed' },
      { status: 502 },
    );
  }
}

export async function GET(req: NextRequest) {
  return handleSync(req);
}

export async function POST(req: NextRequest) {
  return handleSync(req);
}

export const runtime = 'nodejs';
export const revalidate = 0;
