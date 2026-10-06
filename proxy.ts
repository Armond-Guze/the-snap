import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Enforce canonical host (non-www) and prepare room for future header tweaks.
const CANONICAL_HOST = 'thegamesnap.com';
const isAdminRoute = createRouteMatcher(['/admin(.*)']);

// Comma-separated Clerk user IDs allowed into /admin. Signed-in is not enough because sign-up is open.
const ADMIN_USER_IDS = new Set(
  (process.env.ADMIN_USER_IDS || '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)
);

export default clerkMiddleware(async (auth, req) => {
  const { nextUrl } = req;
  const url = nextUrl.clone();
  let redirectNeeded = false;

  // Redirect www -> apex
  if (url.hostname === 'www.' + CANONICAL_HOST) {
    url.hostname = CANONICAL_HOST;
    redirectNeeded = true;
  }

  // Optionally: if you ever serve plain http behind a proxy elsewhere, you could force https here.
  // Vercel edge already terminates TLS, so protocol check usually isn't required.

  if (redirectNeeded) {
    url.pathname = url.pathname || '/';
    return NextResponse.redirect(url, 308);
  }

  if (isAdminRoute(req)) {
    const { userId } = await auth.protect();
    const allowed = ADMIN_USER_IDS.size > 0
      ? ADMIN_USER_IDS.has(userId)
      : process.env.NODE_ENV !== 'production';
    if (!allowed) {
      return new NextResponse('Not found', { status: 404 });
    }
  }

  return NextResponse.next();
});

// Apply to all paths except assets
export const config = {
  matcher: [
    '/((?!_next|api/|.*\\.(?:css|js|json|png|jpg|jpeg|gif|svg|ico|webp|txt|xml)$).*)',
    '/api/me/(.*)',
  ],
};
