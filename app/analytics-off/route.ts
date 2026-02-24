import { NextRequest, NextResponse } from 'next/server';
import { SITE_URL } from '@/lib/site-config';

// GET /analytics-off : set exclusion cookie and redirect to home
export async function GET(request: NextRequest) {
  const base = SITE_URL;
  const current = new URL(request.url);
  const nextPath = current.searchParams.get('next');
  const safeNext = nextPath && nextPath.startsWith('/') ? nextPath : '/';
  const target = new URL(safeNext, base);
  target.searchParams.set('exclude_analytics', '1');

  const res = NextResponse.redirect(target);
  res.cookies.set({
    name: 'va-exclude',
    value: '1',
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: 'lax'
  });
  return res;
}
