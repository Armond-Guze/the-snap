import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Enforce canonical host (non-www) and prepare room for future header tweaks.
const CANONICAL_HOST = 'thegamesnap.com';

export default clerkMiddleware((_, req) => {
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

  return NextResponse.next();
});

// Apply to all paths except assets
export const config = {
  matcher: [
    '/((?!_next|.*\.(?:css|js|json|png|jpg|jpeg|gif|svg|ico|webp|txt|xml)).*)',
    '/(api|trpc)(.*)',
  ],
};
