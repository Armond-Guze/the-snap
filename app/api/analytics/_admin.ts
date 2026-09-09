import { NextResponse } from 'next/server';

import { authorizeAdminRequest } from '../../../lib/security/admin-auth';

export async function requireAnalyticsAdmin(): Promise<NextResponse | null> {
  const authorization = await authorizeAdminRequest();
  if (authorization.authorized) return null;

  const status = authorization.reason === 'unauthenticated'
    ? 401
    : authorization.reason === 'forbidden'
      ? 403
      : 503;
  return NextResponse.json(
    { success: false, error: status === 503 ? 'Admin authorization unavailable' : 'Unauthorized' },
    { status, headers: { 'Cache-Control': 'no-store' } },
  );
}
