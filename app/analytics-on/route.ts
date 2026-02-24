import { NextRequest, NextResponse } from 'next/server';
import { SITE_URL } from '@/lib/site-config';

// GET /analytics-on : clear exclusion cookie and redirect to home
export async function GET(request: NextRequest) {
  const base = SITE_URL;
  const current = new URL(request.url);
  const nextPath = current.searchParams.get('next');
  const safeNext = nextPath && nextPath.startsWith('/') ? nextPath : '/';
  const target = new URL(safeNext, base);
  target.searchParams.set('include_analytics', '1');

  const res = NextResponse.redirect(target);
  res.cookies.set({
    name: 'va-exclude',
    value: '',
    path: '/',
    maxAge: 0,
    sameSite: 'lax'
  });
  return res;
}
