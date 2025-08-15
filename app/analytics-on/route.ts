import { NextResponse } from 'next/server';

// GET /analytics-on : clear exclusion cookie and redirect to home
export async function GET() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://thegamesnap.com';
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
