import { NextRequest } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { syncTeamRecords } from '@/lib/sync-team-records';

const AUTH_HEADER = 'x-sync-secret';

function verifySecret(req: NextRequest): { ok: boolean; status?: number; error?: string } {
  const isVercelCron = Boolean(req.headers.get('x-vercel-cron'));
  if (isVercelCron) return { ok: true };

  const secret = (process.env.SYNC_CRON_SECRET || process.env.REVALIDATE_SECRET || '').trim();
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      return { ok: false, status: 500, error: 'SYNC_CRON_SECRET or REVALIDATE_SECRET is not configured' };
    }
    return { ok: true };
  }

  const header = req.headers.get(AUTH_HEADER) || req.nextUrl.searchParams.get('secret');
  return header === secret
    ? { ok: true }
    : { ok: false, status: 401, error: 'Unauthorized' };
}

export async function POST(req: NextRequest) {
  const auth = verifySecret(req);
  if (!auth.ok) {
    return new Response(JSON.stringify({ success: false, error: auth.error }), { status: auth.status ?? 401 });
  }

  try {
    const payload = await req.json().catch(() => ({}));
    const season = typeof payload?.season === 'number' ? payload.season : undefined;

    const result = await syncTeamRecords(season);

    revalidateTag('standings', {});
    revalidatePath('/standings');
    revalidatePath('/');
    revalidatePath('/schedule');

    return new Response(JSON.stringify({ ok: true, result }), { status: 200 });
  } catch (error) {
    return new Response(
      JSON.stringify({ ok: false, error: error instanceof Error ? error.message : 'Sync failed' }),
      { status: 500 }
    );
  }
}

export const revalidate = 0;
