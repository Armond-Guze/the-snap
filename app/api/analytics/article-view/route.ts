import { NextRequest } from 'next/server';

import { ingestAnalyticsEvent } from '../_ingest';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  return ingestAnalyticsEvent(request, 'article_view');
}
