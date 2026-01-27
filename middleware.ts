import { clerkMiddleware } from '@clerk/nextjs/server';

export default clerkMiddleware();

export const config = {
  matcher: [
    '/((?!_next|.*\.(?:css|js|json|png|jpg|jpeg|gif|svg|ico|webp|txt|xml)).*)',
    '/(api|trpc)(.*)',
  ],
};
