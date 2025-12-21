const DEFAULT_SEASON = Number(process.env.NFL_SEASON ?? new Date().getFullYear());
const DEFAULT_MODE = process.env.NFL_SYNC_MODE ?? 'in-season';

export type NflSyncMode = 'in-season' | 'offseason' | 'paused';

export interface SportsDataConfig {
  baseUrl: string;
  defaultSeason: number;
  syncMode: NflSyncMode;
}

export function isSportsDataEnabled(): boolean {
  // Allow disabling SportsDataIO integration when the API is unavailable or noisy
  return (process.env.SPORTSDATA_ENABLED ?? 'true').toLowerCase() !== 'false';
}

export const sportsDataConfig: SportsDataConfig = {
  baseUrl: 'https://api.sportsdata.io/v3/nfl',
  defaultSeason: Number.isFinite(DEFAULT_SEASON) ? DEFAULT_SEASON : new Date().getFullYear(),
  syncMode: (['in-season', 'offseason', 'paused'].includes(DEFAULT_MODE)
    ? (DEFAULT_MODE as NflSyncMode)
    : 'in-season')
};

export function getSportsDataApiKey(): string {
  const key = process.env.SPORTSDATA_API_KEY;
  if (!key) {
    throw new Error('SPORTSDATA_API_KEY is not set. Add it to your environment to enable premium NFL data syncs.');
  }
  return key;
}
