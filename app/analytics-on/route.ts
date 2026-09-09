import { NextResponse } from 'next/server';

// Analytics can only be re-enabled through the explicit cookie-preferences UI.
// Keeping this retired endpoint non-mutating avoids cross-site GET requests
// silently reversing a visitor's opt-out.
export async function GET() {
  return NextResponse.json(
    { error: 'Use Cookie preferences to change analytics consent.' },
    {
      status: 410,
      headers: {
        'Cache-Control': 'no-store',
        Allow: 'GET',
      },
    }
  );
}
