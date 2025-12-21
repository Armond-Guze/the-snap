import { getSportsDataApiKey, isSportsDataEnabled, sportsDataConfig } from '@/lib/config/sportsdata';

const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_REVALIDATE_SECONDS = 1_800; // 30 minutes balances freshness vs. quota

type QueryRecord = Record<string, string | number | boolean | undefined>;

interface SportsDataFetchOptions {
  query?: QueryRecord;
  revalidateSeconds?: number;
  signal?: AbortSignal;
}

export interface SportsDataStandingsTeam {
  TeamID: number;
  Key: string;
  City: string;
  Name: string;
  TeamName?: string;
  Conference?: string;
  Division?: string;
  Wins: number;
  Losses: number;
  Ties: number;
  Percentage: number;
  LogoURL?: string;
  StrengthOfSchedule?: number;
  OpponentWins?: number;
  OpponentLosses?: number;
  OpponentTies?: number;
}

export interface SportsDataScore {
  GameKey?: string;
  GlobalGameID?: number;
  Season?: number;
  SeasonType?: number;
  Week: number;
  Date?: string;
  DateTime?: string;
  AwayTeam: string;
  HomeTeam: string;
  Channel?: string;
  StadiumDetails?: { Name?: string } | null;
  Status?: string;
  Quarter?: string;
  TimeRemaining?: string;
  HomeScore?: number | null;
  AwayScore?: number | null;
}

export async function sportsDataFetch<T>(path: string, options: SportsDataFetchOptions = {}): Promise<T> {
  if (!isSportsDataEnabled()) {
    throw new Error('SportsDataIO disabled via SPORTSDATA_ENABLED');
  }
  const apiKey = getSportsDataApiKey();
  const url = buildUrl(path, options.query);
  const controller = options.signal ? null : new AbortController();
  const timeoutId = controller ? setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS) : null;

  try {
    const response = await fetch(url, {
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey
      },
      next: { revalidate: options.revalidateSeconds ?? DEFAULT_REVALIDATE_SECONDS },
      signal: options.signal ?? controller?.signal
    });

    if (!response.ok) {
      const body = await safeReadBody(response);
      throw new Error(`SportsDataIO request failed (${response.status}): ${body}`);
    }

    return response.json() as Promise<T>;
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

export async function fetchSportsDataStandings(season?: number): Promise<SportsDataStandingsTeam[]> {
  const seasonToUse = season ?? sportsDataConfig.defaultSeason;
  return sportsDataFetch<SportsDataStandingsTeam[]>(`scores/json/Standings/${seasonToUse}`);
}

export async function fetchSportsDataScoresByWeek(week: number, season?: number): Promise<SportsDataScore[]> {
  const seasonToUse = season ?? sportsDataConfig.defaultSeason;
  return sportsDataFetch<SportsDataScore[]>(`scores/json/ScoresByWeek/${seasonToUse}/${week}`, { revalidateSeconds: 300 });
}

export async function fetchSportsDataCurrentWeek(): Promise<number> {
  return sportsDataFetch<number>('scores/json/CurrentWeek', { revalidateSeconds: 300 });
}

function buildUrl(path: string, query?: QueryRecord): string {
  const normalizedPath = path.replace(/^\//, '');
  const url = new URL(`${sportsDataConfig.baseUrl}/${normalizedPath}`);

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      url.searchParams.set(key, String(value));
    });
  }

  return url.toString();
}

async function safeReadBody(response: Response): Promise<string> {
  try {
    const text = await response.text();
    return text.slice(0, 500) || 'No response body';
  } catch {
    return 'Unable to read response body';
  }
}
