import { NextResponse } from 'next/server';
import { SITE_URL } from '@/lib/site-config';

// GET /analytics-off : set exclusion cookie and redirect to home
export async function GET() {
  const base = SITE_URL;
  const res = NextResponse.redirect(new URL('/', base));
  res.cookies.set({
    name: 'va-exclude',
    value: '1',
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: 'lax'
  });
  return res;
}
