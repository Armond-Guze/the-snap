import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../lib/season', () => ({
  getExpectedStandingsSeason: () => 2025,
}));

import {
  fetchNFLStandingsWithFallback,
  NFL_TEAMS_MAP,
  resolveNFLSeason,
} from '../../../lib/nfl-api';

const originalSeason = process.env.NFL_SEASON;
const originalSportsDataEnabled = process.env.SPORTSDATA_ENABLED;

function espnStandingsResponse(teamNames: string[]) {
  return {
    children: [
      {
        standings: {
          entries: teamNames.map((displayName) => ({
            team: { displayName },
            stats: [
              { name: 'wins', value: 1 },
              { name: 'losses', value: 0 },
              { name: 'ties', value: 0 },
            ],
          })),
        },
      },
    ],
  };
}

afterEach(() => {
  if (originalSeason === undefined) delete process.env.NFL_SEASON;
  else process.env.NFL_SEASON = originalSeason;

  if (originalSportsDataEnabled === undefined) delete process.env.SPORTSDATA_ENABLED;
  else process.env.SPORTSDATA_ENABLED = originalSportsDataEnabled;

  vi.unstubAllGlobals();
});

describe('NFL standings season integrity', () => {
  it('uses an explicit season, then configured and calendar-aware defaults', () => {
    process.env.NFL_SEASON = '2024';
    expect(resolveNFLSeason(2023)).toBe(2023);
    expect(resolveNFLSeason()).toBe(2024);

    delete process.env.NFL_SEASON;
    expect(resolveNFLSeason()).toBe(2025);
    expect(() => resolveNFLSeason(1900)).toThrow(/between 1920 and 2100/);
  });

  it('passes the requested season to ESPN and accepts only a complete league', async () => {
    process.env.SPORTSDATA_ENABLED = 'false';
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => espnStandingsResponse(Object.keys(NFL_TEAMS_MAP)),
    });
    vi.stubGlobal('fetch', fetchMock);

    const standings = await fetchNFLStandingsWithFallback(2031);

    expect(standings).toHaveLength(32);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const requestedUrl = new URL(String(fetchMock.mock.calls[0]?.[0]));
    expect(requestedUrl.searchParams.get('season')).toBe('2031');
  });

  it('rejects incomplete provider data instead of substituting a static snapshot', async () => {
    process.env.SPORTSDATA_ENABLED = 'false';
    const teamNames = Object.keys(NFL_TEAMS_MAP).slice(0, 31);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => espnStandingsResponse(teamNames),
    }));

    await expect(fetchNFLStandingsWithFallback(2032)).rejects.toThrow(
      'static fallback data was not used',
    );
  });
});
