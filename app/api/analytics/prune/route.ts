import { timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';

import { pruneAnalyticsData } from '../../../../lib/analytics-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

function isAuthorized(request: NextRequest): 'authorized' | 'unconfigured' | 'unauthorized' {
  const expected = process.env.CRON_SECRET?.trim() ?? '';
  if (!expected) return 'unconfigured';

  const authorization = request.headers.get('authorization')?.trim() ?? '';
  if (!authorization.startsWith('Bearer ')) return 'unauthorized';
  const candidate = authorization.slice('Bearer '.length).trim();
  const candidateBuffer = Buffer.from(candidate);
  const expectedBuffer = Buffer.from(expected);
  if (
    candidateBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(candidateBuffer, expectedBuffer)
  ) {
    return 'unauthorized';
  }
  return 'authorized';
}

async function handlePrune(request: NextRequest) {
  const authorization = isAuthorized(request);
  if (authorization !== 'authorized') {
    return NextResponse.json(
      {
        success: false,
        error: authorization === 'unconfigured'
          ? 'Analytics retention cron is not configured'
          : 'Unauthorized',
      },
      {
        status: authorization === 'unconfigured' ? 503 : 401,
        headers: { 'Cache-Control': 'no-store' },
      },
    );
  }

  try {
    // Policy: retain events for 13 calendar months and remove rate-limit rows
    // only after both their counting window and any block have expired.
    const result = await pruneAnalyticsData();
    return NextResponse.json(
      { success: true, result },
      { status: 200, headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    console.error('[analytics] retention prune failed', {
      errorType: error instanceof Error ? error.name : 'UnknownError',
    });
    return NextResponse.json(
      { success: false, error: 'Analytics retention prune failed' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}

export async function GET(request: NextRequest) {
  return handlePrune(request);
}

export async function POST(request: NextRequest) {
  return handlePrune(request);
}
