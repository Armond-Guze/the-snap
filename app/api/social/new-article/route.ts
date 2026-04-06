import { NextRequest } from 'next/server';
import { autopostDocumentToX } from '@/lib/social/x-autopost';
import { isTwitterConfigured, getTwitterUsername } from '@/lib/twitter';

export const dynamic = 'force-dynamic';

function verifySecret(req: NextRequest) {
  const secret = process.env.SANITY_WEBHOOK_SECRET?.trim() || process.env.REVALIDATE_SECRET?.trim() || '';
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      return { ok: false, status: 500, error: 'SANITY_WEBHOOK_SECRET or REVALIDATE_SECRET is not configured' };
    }
    return { ok: true };
  }
  const url = new URL(req.url);
  const token = url.searchParams.get('secret')?.trim() || '';
  return token === secret
    ? { ok: true }
    : { ok: false, status: 401, error: 'Invalid secret' };
}

export async function GET(req: NextRequest) {
  const auth = verifySecret(req);
  if (!auth.ok) {
    return new Response(JSON.stringify({ ok: false, error: auth.error }), { status: auth.status ?? 401 });
  }

  const has = {
    X_API_KEY: !!process.env.X_API_KEY || !!process.env.TWITTER_API_KEY,
    X_API_SECRET: !!process.env.X_API_SECRET || !!process.env.TWITTER_API_SECRET,
    X_ACCESS_TOKEN: !!process.env.X_ACCESS_TOKEN || !!process.env.TWITTER_ACCESS_TOKEN,
    X_ACCESS_SECRET: !!process.env.X_ACCESS_SECRET || !!process.env.TWITTER_ACCESS_SECRET,
    SANITY_WRITE_TOKEN: !!process.env.SANITY_API_WRITE_TOKEN || !!process.env.SANITY_WRITE_TOKEN,
    SANITY_WEBHOOK_SECRET: !!process.env.SANITY_WEBHOOK_SECRET,
    X_USERNAME: !!process.env.X_USERNAME,
  };

  return new Response(JSON.stringify({
    ok: true,
    envPresent: has,
    xReady: isTwitterConfigured(),
    username: getTwitterUsername(),
    note: 'POST { "id": "<sanity-document-id>" } to manually create an X post for a published document.',
    runtime: 'node',
  }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

export async function POST(req: NextRequest) {
  const auth = verifySecret(req);
  if (!auth.ok) {
    return new Response(JSON.stringify({ ok: false, error: auth.error }), { status: auth.status ?? 401 });
  }

  const url = new URL(req.url);
  const payload = await req.json().catch(() => ({}));
  const id = payload?.id || payload?.documentId || url.searchParams.get('id');

  if (!id || typeof id !== 'string') {
    return new Response(JSON.stringify({ ok: false, error: 'Missing document id' }), { status: 400 });
  }

  const dryRun = payload?.dryRun === true || url.searchParams.get('dry') === '1' || url.searchParams.get('dry') === 'true';
  const force = payload?.force === true || url.searchParams.get('force') === '1' || url.searchParams.get('force') === 'true';

  const result = await autopostDocumentToX({ id, dryRun, force });

  const status = result.ok
    ? 200
    : result.reason === 'not-found-or-not-published'
      ? 404
      : 500;

  return new Response(JSON.stringify(result), { status, headers: { 'Content-Type': 'application/json' } });
}
