// Lightweight schedule utilities (initial scaffold)
// Designed to be extended later with automatic ingestion.

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
  ARI: { name: 'Arizona Cardinals', logo: '/images/logos/nfl/ARI.png' },
  ATL: { name: 'Atlanta Falcons', logo: '/images/logos/nfl/ATL.png' },
  BAL: { name: 'Baltimore Ravens', logo: '/images/logos/nfl/BAL.png' },
  BUF: { name: 'Buffalo Bills', logo: '/images/logos/nfl/BUF.png' },
  CAR: { name: 'Carolina Panthers', logo: '/images/logos/nfl/CAR.png' },
  CHI: { name: 'Chicago Bears', logo: '/images/logos/nfl/CHI.png' },
  CIN: { name: 'Cincinnati Bengals', logo: '/images/logos/nfl/CIN.png' },
  CLE: { name: 'Cleveland Browns', logo: '/images/logos/nfl/CLE.png' },
  DAL: { name: 'Dallas Cowboys', logo: '/images/logos/nfl/DAL.png' },
  DEN: { name: 'Denver Broncos', logo: '/images/logos/nfl/DEN.png' },
  DET: { name: 'Detroit Lions', logo: '/images/logos/nfl/DET.png' },
  GB: { name: 'Green Bay Packers', logo: '/images/logos/nfl/GB.png' },
  HOU: { name: 'Houston Texans', logo: '/images/logos/nfl/HOU.png' },
  IND: { name: 'Indianapolis Colts', logo: '/images/logos/nfl/IND.png' },
  JAX: { name: 'Jacksonville Jaguars', logo: '/images/logos/nfl/JAX.png' },
  KC: { name: 'Kansas City Chiefs', logo: '/images/logos/nfl/KC.png' },
  LAC: { name: 'Los Angeles Chargers', logo: '/images/logos/nfl/LAC.png' },
  LAR: { name: 'Los Angeles Rams', logo: '/images/logos/nfl/LAR.png' },
  LV: { name: 'Las Vegas Raiders', logo: '/images/logos/nfl/LV.png' },
  MIA: { name: 'Miami Dolphins', logo: '/images/logos/nfl/MIA.png' },
  MIN: { name: 'Minnesota Vikings', logo: '/images/logos/nfl/MIN.png' },
  NE: { name: 'New England Patriots', logo: '/images/logos/nfl/NE.png' },
  NO: { name: 'New Orleans Saints', logo: '/images/logos/nfl/NO.png' },
  NYG: { name: 'New York Giants', logo: '/images/logos/nfl/NYG.png' },
  NYJ: { name: 'New York Jets', logo: '/images/logos/nfl/NYJ.png' },
  PHI: { name: 'Philadelphia Eagles', logo: '/images/logos/nfl/PHI.png' },
  PIT: { name: 'Pittsburgh Steelers', logo: '/images/logos/nfl/PIT.png' },
  SEA: { name: 'Seattle Seahawks', logo: '/images/logos/nfl/SEA.png' },
  SF: { name: 'San Francisco 49ers', logo: '/images/logos/nfl/SF.png' },
  TB: { name: 'Tampa Bay Buccaneers', logo: '/images/logos/nfl/TB.png' },
  TEN: { name: 'Tennessee Titans', logo: '/images/logos/nfl/TEN.png' },
  WAS: { name: 'Washington Commanders', logo: '/images/logos/nfl/WAS.png' }
};

export const TEAM_ABBRS = Object.keys(TEAM_META);

export interface GroupedGamesBucket { label: string; games: EnrichedGame[] }

export function bucketLabelFor(game: EnrichedGame): string {
  const d = new Date(game.dateUTC);
  const day = d.getUTCDay(); // 0 Sun
  const hour = d.getUTCHours();
  // Rough ET calculation (UTC-4 or -5). We'll just compare UTC hour ranges relative.
  if (day === 4) return 'Thursday Night';
  if (day === 1) return 'Monday Night';
  if (day === 0) { // Sunday variants
    if (hour < 19) return 'Sunday Early'; // before ~1:00 PM ET (17 UTC early season) - approximate
    if (hour < 23) return 'Sunday Late';
    return 'Sunday Night';
  }
  if (day === 5 || day === 6) return 'Weekend';
  return d.toLocaleDateString(undefined, { weekday: 'long' });
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
  // Basic heuristic: choose week whose range contains now.
  const weeks = new Map<number, { min: number; max: number }>();
  schedule.forEach(g => {
    const t = Date.parse(g.dateUTC);
    const w = weeks.get(g.week);
    if (!w) weeks.set(g.week, { min: t, max: t }); else { w.min = Math.min(w.min, t); w.max = Math.max(w.max, t); }
  });
  const ts = now.getTime();
  for (const [week, range] of weeks) {
    if (ts >= range.min - 6*3600*1000 && ts <= range.max + 24*3600*1000) return week; // small buffer
  }
  return 1; // default
}

export async function getScheduleWeekOrCurrent(weekParam?: number): Promise<{ week: number; games: EnrichedGame[] }> {
  const schedule = await loadStaticSchedule();
  const current = determineCurrentWeek(schedule);
  const week = weekParam && weekParam >=1 && weekParam <= 18 ? weekParam : current;
  const games = await getEnrichedWeek(week);
  return { week, games };
}

// Return all games (enriched) for a given team across the season
export async function getTeamSeasonSchedule(team: string): Promise<EnrichedGame[]> {
  const schedule = await loadStaticSchedule();
  const lower = team.toUpperCase();
  const teamGames = schedule.filter(g => g.home === lower || g.away === lower);
  // Enrich by fetching per-week live data in parallel (group by week)
  const weeks = Array.from(new Set(teamGames.map(g => g.week)));
  const enrichedWeeks = await Promise.all(weeks.map(w => getEnrichedWeek(w)));
  const merged = enrichedWeeks.flat().filter(g => g.home === lower || g.away === lower);
  // ensure unique by gameId
  const map = new Map<string, EnrichedGame>();
  merged.forEach(g => map.set(g.gameId, g));
  return Array.from(map.values()).sort((a,b) => a.week - b.week);
}

// Fetch a single game by id (enriched with possible live data)
export async function getGameById(gameId: string): Promise<EnrichedGame | null> {
  const schedule = await loadStaticSchedule();
  const base = schedule.find(g => g.gameId === gameId);
  if (!base) return null;
  const enrichedWeek = await getEnrichedWeek(base.week);
  return enrichedWeek.find(g => g.gameId === gameId) || null;
}
