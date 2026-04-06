import { NextRequest } from 'next/server';
import { revalidateTag } from 'next/cache';

function verifySecret(req: NextRequest): { ok: boolean; status?: number; error?: string } {
  const isVercelCron = Boolean(req.headers.get('x-vercel-cron'));
  if (isVercelCron) return { ok: true };

  const secret = (process.env.SANITY_STANDINGS_REVALIDATE_SECRET || process.env.REVALIDATE_SECRET || '').trim();
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      return { ok: false, status: 500, error: 'SANITY_STANDINGS_REVALIDATE_SECRET or REVALIDATE_SECRET is not configured' };
    }
    return { ok: true };
  }

  const url = new URL(req.url);
  const token = url.searchParams.get('secret')?.trim() || req.headers.get('x-revalidate-secret')?.trim() || '';
  return token === secret
    ? { ok: true }
    : { ok: false, status: 401, error: 'Invalid secret' };
}

export async function POST(req: NextRequest) {
  try {
    const auth = verifySecret(req);
    if (!auth.ok) {
      return new Response(JSON.stringify({ revalidated: false, message: auth.error }), {
        status: auth.status ?? 401,
      });
    }

    revalidateTag('standings', {});
    return new Response(JSON.stringify({ revalidated: true, tag: 'standings' }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ revalidated: false, error: (err as Error).message }), { status: 500 });
  }
}

export const revalidate = 0;
