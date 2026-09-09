import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { authorizeBearerRequest, bearerErrorHeaders } from '@/lib/security/bearer-auth';

// Minimal webhook handler to revalidate standings cache tag
export async function POST(req: NextRequest) {
  const authorization = authorizeBearerRequest(req.headers, [
    process.env.SANITY_STANDINGS_REVALIDATE_SECRET,
    process.env.REVALIDATE_SECRET,
    process.env.CRON_SECRET,
  ]);
  if (!authorization.authorized) {
    return NextResponse.json(
      {
        revalidated: false,
        message: authorization.status === 503 ? 'Service unavailable' : 'Unauthorized',
      },
      {
        status: authorization.status,
        headers: bearerErrorHeaders(authorization.status),
      }
    );
  }

  try {
    await revalidateTag('standings', {});
    return NextResponse.json({ revalidated: true, tag: 'standings' }, { status: 200 });
  } catch {
    return NextResponse.json({ revalidated: false, error: 'Revalidation failed' }, { status: 500 });
  }
}

export const revalidate = 0;
