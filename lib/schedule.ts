// Lightweight schedule utilities (initial scaffold)
// Designed to be extended later with automatic ingestion.

import { isSportsDataEnabled } from './config/sportsdata'
import {
  fetchSportsDataCurrentWeek,
  fetchSportsDataScoresByWeek,
  SportsDataScore
} from './sportsdata-client'

export interface StaticGame {
  gameId: string; // ESPN event id if known
  week: number;
  dateUTC: string; // ISO string in UTC
  home: string; // team abbreviation (KC)
  away: string; // team abbreviation (BAL)
  network?: string;
  venue?: string;
}

export interface LiveGameUpdate {
  gameId: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'FINAL';
  quarter?: string;
  clock?: string;
  scores?: { home: number; away: number };
}

export interface EnrichedGame extends StaticGame, LiveGameUpdate {}

// Lazy loaded cache for static schedule
let _staticSchedule: StaticGame[] | null = null;
const _teamSeasonCache = new Map<string, Promise<EnrichedGame[]>>();

function mapSportsDataStatus(score: SportsDataScore): LiveGameUpdate['status'] {
  const raw = (score.Status || '').toUpperCase();
  if (raw.includes('FINAL')) return 'FINAL';
  if (raw.includes('INPROGRESS') || raw.includes('IN_PROGRESS') || raw.includes('LIVE')) return 'IN_PROGRESS';
  return 'SCHEDULED';
}

function mapSportsDataScore(score: SportsDataScore): EnrichedGame {
  const status = mapSportsDataStatus(score);
  const date = score.DateTime || score.Date;
  const dateUTC = date ? new Date(date).toISOString() : new Date().toISOString();
  return {
    gameId: String(score.GlobalGameID || score.GameKey || `${score.Season}-${score.Week}-${score.HomeTeam}-${score.AwayTeam}`),
    week: score.Week,
    dateUTC,
    home: score.HomeTeam,
    away: score.AwayTeam,
    network: score.Channel,
    venue: score.StadiumDetails?.Name || undefined,
    status,
    quarter: score.Quarter ? `Q${score.Quarter}` : undefined,
    clock: score.TimeRemaining || undefined,
    scores: (score.HomeScore != null && score.AwayScore != null)
      ? { home: Number(score.HomeScore), away: Number(score.AwayScore) }
      : undefined,
  };
}

export async function loadStaticSchedule(): Promise<StaticGame[]> {
  if (_staticSchedule) return _staticSchedule;
  try {
  // dynamic import to keep edge bundling small
  const mod = await import('../data/nfl-2025-schedule.json');
  const data = mod.default as StaticGame[];
    _staticSchedule = data;
    return data;
  } catch (e) {
    console.error('Failed to load static schedule json', e);
    _staticSchedule = [];
    return _staticSchedule;
  }
}

async function loadSportsDataWeek(week: number): Promise<EnrichedGame[] | null> {
  if (!isSportsDataEnabled()) return null;
  try {
    const scores = await fetchSportsDataScoresByWeek(week);
    if (!scores || scores.length === 0) return null;
    return scores.map(mapSportsDataScore).sort((a, b) => a.dateUTC.localeCompare(b.dateUTC));
  } catch (e) {
    console.warn('SportsData week fetch failed, falling back to static schedule', e);
    return null;
  }
}

// Determine smart revalidate seconds (shorter during Thu-Mon game windows)
export function computeRevalidate(now = new Date()): number {
  const day = now.getUTCDay(); // 0 Sun ... 6 Sat
  // Game heavy windows (Thu-Mon) -> 5 min, otherwise 6h
  return [4,5,6,0,1].includes(day) ? 300 : 21600;
}

// Fetch live week data from ESPN public API (best-effort / no key)
export async function fetchLiveWeek(week: number, seasonYear = 2025): Promise<LiveGameUpdate[]> {
  try {
    const url = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?week=${week}&dates=${seasonYear}&seasontype=2`;
    const res = await fetch(url, { next: { revalidate: computeRevalidate() } });
    if (!res.ok) throw new Error('bad status ' + res.status);
    interface ESPNEventCompetitor { homeAway: 'home' | 'away'; score?: string; }
    interface ESPNEventCompetition { competitors?: ESPNEventCompetitor[]; status?: { period?: number; displayClock?: string; type?: { name?: string } }; }
    interface ESPNEvent { id: string; competitions?: ESPNEventCompetition[]; }
    interface ESPNScoreboard { events?: ESPNEvent[] }
    const json = await res.json() as ESPNScoreboard;
    const events: ESPNEvent[] = json.events || [];
    return events.map(ev => {
      const comp = ev.competitions?.[0];
      const home = comp?.competitors?.find((c) => c.homeAway === 'home');
      const away = comp?.competitors?.find((c) => c.homeAway === 'away');
      const status = comp?.status?.type?.name || '';
      let mappedStatus: LiveGameUpdate['status'] = 'SCHEDULED';
      if (status === 'STATUS_IN_PROGRESS') mappedStatus = 'IN_PROGRESS';
      else if (status === 'STATUS_FINAL') mappedStatus = 'FINAL';
      return {
        gameId: ev.id,
        status: mappedStatus,
        quarter: comp?.status?.period ? 'Q' + comp.status.period : undefined,
        clock: comp?.status?.displayClock || undefined,
        scores: (home && away) ? {
          home: Number(home.score || 0),
          away: Number(away.score || 0)
        } : undefined
      } as LiveGameUpdate;
    });
  } catch (e) {
    console.warn('live fetch failed', e);
    return [];
  }
}

export async function getEnrichedWeek(week: number): Promise<EnrichedGame[]> {
  // Prefer SportsData API when available
  const sportsDataWeek = await loadSportsDataWeek(week);
  if (sportsDataWeek && sportsDataWeek.length > 0) return sportsDataWeek;

  // Fallback to static schedule + ESPN live scoreboard overlay
  const [staticSchedule, live] = await Promise.all([
    loadStaticSchedule(),
    fetchLiveWeek(week)
  ]);
  const liveMap = new Map(live.map(g => [g.gameId, g]));
  return staticSchedule.filter(g => g.week === week).map(g => ({
    ...g,
    ...(liveMap.get(g.gameId) || { status: 'SCHEDULED' as const })
  }));
}

// Team abbreviation metadata (paths for logos supplied by user later)
export const TEAM_META: Record<string, { name: string; logo: string }> = {
  ARI: { name: 'Arizona Cardinals', logo: '/images/teams/ARI.svg' },
  ATL: { name: 'Atlanta Falcons', logo: '/images/teams/ATL.svg' },
  BAL: { name: 'Baltimore Ravens', logo: '/images/teams/BAL.svg' },
  BUF: { name: 'Buffalo Bills', logo: '/images/teams/BUF.svg' },
  CAR: { name: 'Carolina Panthers', logo: '/images/teams/CAR.svg' },
  CHI: { name: 'Chicago Bears', logo: '/images/teams/CHI.svg' },
  CIN: { name: 'Cincinnati Bengals', logo: '/images/teams/CIN.svg' },
  CLE: { name: 'Cleveland Browns', logo: '/images/teams/CLE.svg' },
  DAL: { name: 'Dallas Cowboys', logo: '/images/teams/DAL.svg' },
  DEN: { name: 'Denver Broncos', logo: '/images/teams/DEN.svg' },
  DET: { name: 'Detroit Lions', logo: '/images/teams/DET.svg' },
  GB: { name: 'Green Bay Packers', logo: '/images/teams/GB.svg' },
  HOU: { name: 'Houston Texans', logo: '/images/teams/HOU.svg' },
  IND: { name: 'Indianapolis Colts', logo: '/images/teams/IND.svg' },
  JAX: { name: 'Jacksonville Jaguars', logo: '/images/teams/JAX.svg' },
  KC: { name: 'Kansas City Chiefs', logo: '/images/teams/KC.svg' },
  LAC: { name: 'Los Angeles Chargers', logo: '/images/teams/LAC.svg' },
  LAR: { name: 'Los Angeles Rams', logo: '/images/teams/LAR.svg' },
  LV: { name: 'Las Vegas Raiders', logo: '/images/teams/LV.svg' },
  MIA: { name: 'Miami Dolphins', logo: '/images/teams/MIA.svg' },
  MIN: { name: 'Minnesota Vikings', logo: '/images/teams/MIN.svg' },
  NE: { name: 'New England Patriots', logo: '/images/teams/NE.svg' },
  NO: { name: 'New Orleans Saints', logo: '/images/teams/NO.svg' },
  NYG: { name: 'New York Giants', logo: '/images/teams/NYG.svg' },
  NYJ: { name: 'New York Jets', logo: '/images/teams/NYJ.svg' },
  PHI: { name: 'Philadelphia Eagles', logo: '/images/teams/PHI.svg' },
  PIT: { name: 'Pittsburgh Steelers', logo: '/images/teams/PIT.svg' },
  SEA: { name: 'Seattle Seahawks', logo: '/images/teams/SEA.svg' },
  SF: { name: 'San Francisco 49ers', logo: '/images/teams/SF.svg' },
  TB: { name: 'Tampa Bay Buccaneers', logo: '/images/teams/TB.svg' },
  TEN: { name: 'Tennessee Titans', logo: '/images/teams/TEN.svg' },
  WAS: { name: 'Washington Commanders', logo: '/images/teams/WAS.svg' }
};

export const TEAM_ABBRS = Object.keys(TEAM_META);

export interface GroupedGamesBucket { label: string; games: EnrichedGame[] }

export function bucketLabelFor(game: EnrichedGame): string {
  // Compute weekday/hour in Eastern Time to avoid UTC day crossover issues.
  const d = new Date(game.dateUTC);
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    weekday: 'short',
    hour: '2-digit',
    hour12: false
  }).formatToParts(d);
  const wd = parts.find(p => p.type === 'weekday')?.value || '';
  const hour = Number(parts.find(p => p.type === 'hour')?.value || '0');
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const day = map[wd as keyof typeof map];

  if (day === 4) return 'Thursday Night';
  if (day === 5) return 'Friday';
  if (day === 6) return 'Saturday';
  if (day === 0) return hour >= 20 ? 'Sunday Night' : 'Sunday';
  if (day === 1) return hour >= 20 ? 'Monday Night' : 'Monday';
  return wd;
}

export function groupGamesByBucket(games: EnrichedGame[]): GroupedGamesBucket[] {
  const map = new Map<string, EnrichedGame[]>();
  games.forEach(g => {
    const lbl = bucketLabelFor(g);
    const arr = map.get(lbl) || [];
    arr.push(g); map.set(lbl, arr);
  });
  return Array.from(map.entries()).map(([label, games]) => ({ label, games: games.sort((a,b)=>a.dateUTC.localeCompare(b.dateUTC)) }));
}

export function determineCurrentWeek(schedule: StaticGame[], now = new Date()): number {
  // Choose: in-range week; else nearest upcoming; else last past; fallback 1.
  const weeks = new Map<number, { min: number; max: number }>();
  schedule.forEach(g => {
    const t = Date.parse(g.dateUTC);
    const w = weeks.get(g.week);
    if (!w) weeks.set(g.week, { min: t, max: t });
    else { w.min = Math.min(w.min, t); w.max = Math.max(w.max, t); }
  });
  if (weeks.size === 0) return 1;
  const ts = now.getTime();
  // 1) In-range
  for (const [week, range] of weeks) {
    if (ts >= range.min - 6*3600*1000 && ts <= range.max + 24*3600*1000) return week;
  }
  // 2) Nearest upcoming (smallest future min)
  let upcoming: { week: number; min: number } | null = null;
  for (const [week, range] of weeks) {
    if (range.min > ts) {
      if (!upcoming || range.min < upcoming.min) upcoming = { week, min: range.min };
    }
  }
  if (upcoming) return upcoming.week;
  // 3) Last past (largest past max)
  let lastPast: { week: number; max: number } | null = null;
  for (const [week, range] of weeks) {
    if (range.max < ts) {
      if (!lastPast || range.max > lastPast.max) lastPast = { week, max: range.max };
    }
  }
  if (lastPast) return lastPast.week;
  // 4) Fallback
  return 1;
}

async function resolveCurrentWeek(): Promise<number> {
  if (isSportsDataEnabled()) {
    try {
      const w = await fetchSportsDataCurrentWeek();
      if (Number.isFinite(w) && w > 0) return w;
    } catch (e) {
      console.warn('SportsData current week lookup failed, falling back to static schedule', e);
    }
  }
  const schedule = await loadStaticSchedule();
  return determineCurrentWeek(schedule);
}

export async function getScheduleWeekOrCurrent(weekParam?: number): Promise<{ week: number; games: EnrichedGame[] }> {
  const resolvedWeek = weekParam && weekParam >=1 && weekParam <= 18 ? weekParam : await resolveCurrentWeek();
  const games = await getEnrichedWeek(resolvedWeek);
  return { week: resolvedWeek, games };
}

// Return all games (enriched) for a given team across the season
export async function getTeamSeasonSchedule(team: string): Promise<EnrichedGame[]> {
  const key = team.toUpperCase();
  let pending = _teamSeasonCache.get(key);
  if (!pending) {
    pending = (async () => {
      const schedule = await loadStaticSchedule();
      const teamGames = schedule.filter(g => g.home === key || g.away === key);
      const weeks = Array.from(new Set(teamGames.map(g => g.week)));
      const enrichedWeeks = await Promise.all(weeks.map(w => getEnrichedWeek(w)));
      const merged = enrichedWeeks.flat().filter(g => g.home === key || g.away === key);
      const map = new Map<string, EnrichedGame>();
      merged.forEach(g => map.set(g.gameId, g));
      return Array.from(map.values()).sort((a,b) => a.week - b.week);
    })();
    _teamSeasonCache.set(key, pending);
  }
  return pending;
}

// Fetch a single game by id (enriched with possible live data)
export async function getGameById(gameId: string): Promise<EnrichedGame | null> {
  const schedule = await loadStaticSchedule();
  const base = schedule.find(g => g.gameId === gameId);
  if (!base) return null;
  const enrichedWeek = await getEnrichedWeek(base.week);
  return enrichedWeek.find(g => g.gameId === gameId) || null;
}

// Determine if a game is a commonly recognized national primetime window (rough heuristic)
export function isPrimetimeGame(game: EnrichedGame): boolean {
  const label = bucketLabelFor(game);
  return ['Thursday Night','Sunday Night','Monday Night'].includes(label);
}

// Compute a team's bye week (simple: first week 1..18 not present among its games)
export function computeByeWeek(teamGames: EnrichedGame[]): number | null {
  const playedWeeks = new Set(teamGames.map(g => g.week));
  for (let w = 1; w <= 18; w++) {
    if (!playedWeeks.has(w)) return w; // assumes exactly one bye
  }
  return null;
}

export function primetimeSummary(teamGames: EnrichedGame[]): { count: number; weeks: number[] } {
  const weeks: number[] = [];
  teamGames.forEach(g => { if (isPrimetimeGame(g)) weeks.push(g.week); });
  return { count: weeks.length, weeks: Array.from(new Set(weeks)).sort((a,b)=>a-b) };
}
