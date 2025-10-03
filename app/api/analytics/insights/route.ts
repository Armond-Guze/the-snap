import { NextRequest, NextResponse } from 'next/server';
import { aggregateLast7Days } from '../../../../lib/analytics-store';

export const revalidate = 0; // always fresh

export async function GET(_req: NextRequest) {
  try {
    const data = await aggregateLast7Days();
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('insights GET failed', err);
    return NextResponse.json({ success: false, error: 'Failed to compute insights' }, { status: 500 });
  }
}
