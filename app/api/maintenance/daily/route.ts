import { revalidatePath, revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

import { pruneAnalyticsData } from '@/lib/analytics-store';
import { pruneExpiredNewsletterConfirmations } from '@/lib/newsletter/service';
import { authorizeBearerRequest, bearerErrorHeaders } from '@/lib/security/bearer-auth';
import { pruneWebhookEventLogs } from '@/lib/security/webhook-events';
import { syncTeamRecords } from '@/lib/sync-team-records';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const authorization = authorizeBearerRequest(request.headers, [process.env.CRON_SECRET]);
  if (!authorization.authorized) {
    return NextResponse.json(
      {
        success: false,
        error: authorization.status === 503 ? 'Daily maintenance is not configured' : 'Unauthorized',
      },
      {
        status: authorization.status,
        headers: bearerErrorHeaders(authorization.status),
      }
    );
  }

  const [syncOutcome, analyticsOutcome, newsletterOutcome, webhookOutcome] = await Promise.allSettled([
    syncTeamRecords(),
    pruneAnalyticsData(),
    pruneExpiredNewsletterConfirmations(),
    pruneWebhookEventLogs(),
  ]);
  const syncSucceeded = syncOutcome.status === 'fulfilled' && syncOutcome.value.success;
  const analyticsSucceeded = analyticsOutcome.status === 'fulfilled';
  const newsletterSucceeded = newsletterOutcome.status === 'fulfilled';
  const webhooksSucceeded = webhookOutcome.status === 'fulfilled';

  if (syncSucceeded) {
    revalidateTag('standings', {});
    revalidatePath('/standings');
    revalidatePath('/');
    revalidatePath('/schedule');
  }

  const success = syncSucceeded && analyticsSucceeded && newsletterSucceeded && webhooksSucceeded;
  if (!success) {
    console.error('[maintenance] one or more daily tasks failed', {
      sync: syncSucceeded,
      analyticsRetention: analyticsSucceeded,
      newsletterRetention: newsletterSucceeded,
      webhookRetention: webhooksSucceeded,
    });
  }

  return NextResponse.json(
    {
      success,
      tasks: {
        teamRecords: syncSucceeded,
        analyticsRetention: analyticsSucceeded,
        newsletterRetention: newsletterSucceeded,
        webhookRetention: webhooksSucceeded,
      },
    },
    {
      status: success ? 200 : 503,
      headers: { 'Cache-Control': 'no-store' },
    }
  );
}
