import { NextResponse } from 'next/server';

import { requireAnalyticsAdmin } from '../_admin';
import { getAnalyticsDashboard } from '../../../../lib/analytics-store';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

export async function GET() {
  const unauthorized = await requireAnalyticsAdmin();
  if (unauthorized) return unauthorized;

  try {
    const data = await getAnalyticsDashboard();
    return NextResponse.json(
      { success: true, data },
      { status: 200, headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    console.error('[analytics] dashboard query failed', {
      errorType: error instanceof Error ? error.name : 'UnknownError',
    });
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics data' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
