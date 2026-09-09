import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  syncTeamRecords: vi.fn(),
  computeDraftOrder: vi.fn(),
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

vi.mock('@/lib/sync-team-records', () => ({
  syncTeamRecords: mocks.syncTeamRecords,
}));

vi.mock('@/lib/draft-order', () => ({
  computeDraftOrder: mocks.computeDraftOrder,
}));

vi.mock('next/cache', () => ({
  revalidatePath: mocks.revalidatePath,
  revalidateTag: mocks.revalidateTag,
}));

import {
  GET as getTeamRecords,
  POST as postTeamRecords,
} from '../../../app/api/sync/team-records/route';
import {
  GET as getDraftOrder,
  POST as postDraftOrder,
} from '../../../app/api/sync/draft-order/route';

const originalCronSecret = process.env.CRON_SECRET;
const originalSyncCronSecret = process.env.SYNC_CRON_SECRET;

function request(path: string, init?: ConstructorParameters<typeof NextRequest>[1]): NextRequest {
  return new NextRequest(`https://thegamesnap.com${path}`, init);
}

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env.CRON_SECRET;
  delete process.env.SYNC_CRON_SECRET;
});

afterEach(() => {
  if (originalCronSecret === undefined) delete process.env.CRON_SECRET;
  else process.env.CRON_SECRET = originalCronSecret;

  if (originalSyncCronSecret === undefined) delete process.env.SYNC_CRON_SECRET;
  else process.env.SYNC_CRON_SECRET = originalSyncCronSecret;
});

describe('standings sync cron routes', () => {
  it('fails closed when no cron secret is configured', async () => {
    const response = await getTeamRecords(request('/api/sync/team-records'));

    expect(response.status).toBe(503);
    expect(mocks.syncTeamRecords).not.toHaveBeenCalled();
  });

  it('does not trust Vercel marker headers or query-string secrets', async () => {
    process.env.CRON_SECRET = 'expected-secret';
    const response = await getTeamRecords(
      request('/api/sync/team-records?secret=expected-secret', {
        headers: { 'x-vercel-cron': '1' },
      }),
    );

    expect(response.status).toBe(401);
    expect(mocks.syncTeamRecords).not.toHaveBeenCalled();
  });

  it('supports an authenticated Vercel-style GET and propagates the season', async () => {
    process.env.CRON_SECRET = 'expected-secret';
    mocks.syncTeamRecords.mockResolvedValue({
      success: true,
      created: 32,
      updated: 0,
      skipped: 0,
      season: 2025,
      errors: [],
    });

    const response = await getTeamRecords(
      request('/api/sync/team-records?season=2025', {
        headers: { authorization: 'Bearer expected-secret' },
      }),
    );

    expect(response.status).toBe(200);
    expect(mocks.syncTeamRecords).toHaveBeenCalledWith(2025);
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/standings');
  });

  it('returns a failure status and does not revalidate when the sync fails', async () => {
    process.env.SYNC_CRON_SECRET = 'sync-secret';
    mocks.syncTeamRecords.mockResolvedValue({
      success: false,
      created: 0,
      updated: 0,
      skipped: 0,
      season: 2025,
      errors: ['provider unavailable'],
    });

    const response = await postTeamRecords(
      request('/api/sync/team-records', {
        method: 'POST',
        headers: { authorization: 'Bearer sync-secret' },
        body: JSON.stringify({ season: 2025 }),
      }),
    );

    expect(response.status).toBe(502);
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
    expect(mocks.revalidateTag).not.toHaveBeenCalled();
  });
});

describe('draft-order sync cron routes', () => {
  it('supports authenticated POST and rejects incomplete draft data', async () => {
    process.env.SYNC_CRON_SECRET = 'sync-secret';
    mocks.computeDraftOrder.mockResolvedValue({ season: 2025, picks: Array.from({ length: 31 }) });

    const response = await postDraftOrder(
      request('/api/sync/draft-order', {
        method: 'POST',
        headers: { authorization: 'Bearer sync-secret' },
        body: JSON.stringify({ season: 2025 }),
      }),
    );

    expect(response.status).toBe(502);
    expect(mocks.computeDraftOrder).toHaveBeenCalledWith(2025);
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it('supports authenticated GET for a complete draft order', async () => {
    process.env.CRON_SECRET = 'expected-secret';
    mocks.computeDraftOrder.mockResolvedValue({ season: 2025, picks: Array.from({ length: 32 }) });

    const response = await getDraftOrder(
      request('/api/sync/draft-order?season=2025', {
        headers: { authorization: 'Bearer expected-secret' },
      }),
    );

    expect(response.status).toBe(200);
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/tankathon');
  });
});
