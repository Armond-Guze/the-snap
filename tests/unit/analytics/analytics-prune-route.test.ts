import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  pruneAnalyticsData: vi.fn(),
}));

vi.mock('server-only', () => ({}));
vi.mock('../../../lib/analytics-store', () => ({
  pruneAnalyticsData: mocks.pruneAnalyticsData,
}));

import { GET, POST } from '../../../app/api/analytics/prune/route';

const originalCronSecret = process.env.CRON_SECRET;

function request(
  path = '/api/analytics/prune',
  headers?: Record<string, string>,
) {
  return new NextRequest(`https://thegamesnap.com${path}`, { headers });
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.CRON_SECRET = 'cron-test-secret-with-enough-entropy';
  mocks.pruneAnalyticsData.mockResolvedValue({
    retentionMonths: 13,
    eventCutoff: '2025-07-09T12:00:00.000Z',
    eventsDeleted: 7,
    rateLimitsDeleted: 3,
  });
});

afterEach(() => {
  if (originalCronSecret === undefined) delete process.env.CRON_SECRET;
  else process.env.CRON_SECRET = originalCronSecret;
});

describe('analytics retention cron', () => {
  it('fails closed when CRON_SECRET is not configured', async () => {
    delete process.env.CRON_SECRET;
    const response = await GET(request());

    expect(response.status).toBe(503);
    expect(mocks.pruneAnalyticsData).not.toHaveBeenCalled();
  });

  it('does not trust query parameters or x-vercel-cron without a bearer secret', async () => {
    const response = await GET(request(
      '/api/analytics/prune?secret=cron-test-secret-with-enough-entropy',
      { 'x-vercel-cron': '1' },
    ));

    expect(response.status).toBe(401);
    expect(mocks.pruneAnalyticsData).not.toHaveBeenCalled();
  });

  it('accepts an exact bearer secret for GET and POST', async () => {
    const headers = { authorization: 'Bearer cron-test-secret-with-enough-entropy' };
    const getResponse = await GET(request('/api/analytics/prune', headers));
    const postResponse = await POST(request('/api/analytics/prune', headers));

    expect(getResponse.status).toBe(200);
    expect(postResponse.status).toBe(200);
    expect(mocks.pruneAnalyticsData).toHaveBeenCalledTimes(2);
    expect(await getResponse.json()).toMatchObject({
      success: true,
      result: { retentionMonths: 13, eventsDeleted: 7, rateLimitsDeleted: 3 },
    });
  });

  it('rejects an incorrect bearer secret', async () => {
    const response = await GET(request('/api/analytics/prune', {
      authorization: 'Bearer incorrect-secret',
    }));

    expect(response.status).toBe(401);
    expect(mocks.pruneAnalyticsData).not.toHaveBeenCalled();
  });
});
