import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  authorizeAdminRequest: vi.fn(),
  getAnalyticsDashboard: vi.fn(),
  aggregateLast7Days: vi.fn(),
}));

vi.mock('server-only', () => ({}));
vi.mock('../../../lib/security/admin-auth', () => ({
  authorizeAdminRequest: mocks.authorizeAdminRequest,
}));
vi.mock('../../../lib/analytics-store', () => ({
  getAnalyticsDashboard: mocks.getAnalyticsDashboard,
  aggregateLast7Days: mocks.aggregateLast7Days,
}));

import { GET as getDashboard } from '../../../app/api/analytics/dashboard/route';
import { GET as getInsights } from '../../../app/api/analytics/insights/route';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('analytics admin APIs', () => {
  it('blocks non-admin dashboard requests before querying analytics', async () => {
    mocks.authorizeAdminRequest.mockResolvedValue({ authorized: false, reason: 'forbidden' });

    const response = await getDashboard();

    expect(response.status).toBe(403);
    expect(mocks.getAnalyticsDashboard).not.toHaveBeenCalled();
  });

  it('fails closed when admin authorization is not configured', async () => {
    mocks.authorizeAdminRequest.mockResolvedValue({ authorized: false, reason: 'unconfigured' });

    const response = await getInsights();

    expect(response.status).toBe(503);
    expect(mocks.aggregateLast7Days).not.toHaveBeenCalled();
  });

  it('returns durable analytics only after admin authorization', async () => {
    mocks.authorizeAdminRequest.mockResolvedValue({ authorized: true, userId: 'admin-user' });
    mocks.getAnalyticsDashboard.mockResolvedValue({ overview: { totalViews: 4 } });
    mocks.aggregateLast7Days.mockResolvedValue({ topArticles: [], risingTopics: [], orphaned: [] });

    const dashboard = await getDashboard();
    const insights = await getInsights();

    expect(dashboard.status).toBe(200);
    expect(insights.status).toBe(200);
    expect(mocks.getAnalyticsDashboard).toHaveBeenCalledTimes(1);
    expect(mocks.aggregateLast7Days).toHaveBeenCalledTimes(1);
  });
});
