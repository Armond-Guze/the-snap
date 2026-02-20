import { NextResponse } from 'next/server';
import { SITE_URL } from '@/lib/site-config';

// GET /analytics-on : clear exclusion cookie and redirect to home
export async function GET() {
  const base = SITE_URL;
  const res = NextResponse.redirect(new URL('/', base));
  res.cookies.set({
    name: 'va-exclude',
    value: '',
    path: '/',
    maxAge: 0,
    sameSite: 'lax'
  });
  return res;
}
