import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  syncTeamRecords: vi.fn(),
  pruneAnalyticsData: vi.fn(),
  pruneExpiredNewsletterConfirmations: vi.fn(),
  pruneWebhookEventLogs: vi.fn(),
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

vi.mock('server-only', () => ({}));
vi.mock('@/lib/sync-team-records', () => ({ syncTeamRecords: mocks.syncTeamRecords }));
vi.mock('@/lib/analytics-store', () => ({ pruneAnalyticsData: mocks.pruneAnalyticsData }));
vi.mock('@/lib/newsletter/service', () => ({
  pruneExpiredNewsletterConfirmations: mocks.pruneExpiredNewsletterConfirmations,
}));
vi.mock('@/lib/security/webhook-events', () => ({ pruneWebhookEventLogs: mocks.pruneWebhookEventLogs }));
vi.mock('next/cache', () => ({
  revalidatePath: mocks.revalidatePath,
  revalidateTag: mocks.revalidateTag,
}));

import { GET } from '@/app/api/maintenance/daily/route';

function request(token?: string) {
  return new NextRequest('https://thegamesnap.com/api/maintenance/daily', {
    headers: token ? { authorization: `Bearer ${token}` } : undefined,
  });
}

describe('daily maintenance cron', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = 'daily-maintenance-secret';
    mocks.syncTeamRecords.mockResolvedValue({ success: true });
    mocks.pruneAnalyticsData.mockResolvedValue({ eventsDeleted: 1 });
    mocks.pruneExpiredNewsletterConfirmations.mockResolvedValue(1);
    mocks.pruneWebhookEventLogs.mockResolvedValue({ deleted: 1 });
  });

  it('fails closed before running any task', async () => {
    const response = await GET(request());

    expect(response.status).toBe(401);
    expect(mocks.syncTeamRecords).not.toHaveBeenCalled();
    expect(mocks.pruneAnalyticsData).not.toHaveBeenCalled();
  });

  it('runs sync and both retention jobs under one Hobby-plan cron slot', async () => {
    const response = await GET(request('daily-maintenance-secret'));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ success: true });
    expect(mocks.syncTeamRecords).toHaveBeenCalledOnce();
    expect(mocks.pruneAnalyticsData).toHaveBeenCalledOnce();
    expect(mocks.pruneExpiredNewsletterConfirmations).toHaveBeenCalledOnce();
    expect(mocks.pruneWebhookEventLogs).toHaveBeenCalledOnce();
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/standings');
  });

  it('reports a non-success status when any maintenance task fails', async () => {
    mocks.pruneAnalyticsData.mockRejectedValue(new Error('database unavailable'));

    const response = await GET(request('daily-maintenance-secret'));

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      tasks: { analyticsRetention: false },
    });
  });
});
