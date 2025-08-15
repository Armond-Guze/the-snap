import { NextResponse } from 'next/server';

// GET /analytics-off : set exclusion cookie and redirect to home
export async function GET() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://thegamesnap.com';
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
