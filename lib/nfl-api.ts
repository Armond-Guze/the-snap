import { fetchSportsDataStandings, SportsDataStandingsTeam } from './sportsdata-client';
import { getExpectedStandingsSeason } from './season';

// NFL team mapping with logo URLs for consistent naming between ESPN API and our system
export const NFL_TEAMS_MAP = {
  // AFC East
  'Buffalo Bills': { 
    division: 'AFC East', 
    conference: 'AFC',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/nfl/500/buf.png'
  },
  'Miami Dolphins': { 
    division: 'AFC East', 
    conference: 'AFC',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/nfl/500/mia.png'
  },
  'New England Patriots': { 
    division: 'AFC East', 
    conference: 'AFC',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/nfl/500/ne.png'
  },
  'New York Jets': { 
    division: 'AFC East', 
    conference: 'AFC',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/nfl/500/nyj.png'
  },
  
  // AFC North
  'Baltimore Ravens': { 
    division: 'AFC North', 
    conference: 'AFC',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/nfl/500/bal.png'
  },
  'Cincinnati Bengals': { 
    division: 'AFC North', 
    conference: 'AFC',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/nfl/500/cin.png'
  },
  'Cleveland Browns': { 
    division: 'AFC North', 
    conference: 'AFC',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/nfl/500/cle.png'
  },
  'Pittsburgh Steelers': { 
    division: 'AFC North', 
    conference: 'AFC',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/nfl/500/pit.png'
  },
  
  // AFC South
  'Houston Texans': { 
    division: 'AFC South', 
    conference: 'AFC',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/nfl/500/hou.png'
  },
  'Indianapolis Colts': { 
    division: 'AFC South', 
    conference: 'AFC',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/nfl/500/ind.png'
  },
  'Jacksonville Jaguars': { 
    division: 'AFC South', 
    conference: 'AFC',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/nfl/500/jax.png'
  },
  'Tennessee Titans': { 
    division: 'AFC South', 
    conference: 'AFC',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/nfl/500/ten.png'
  },
  
  // AFC West
  'Denver Broncos': { 
    division: 'AFC West', 
    conference: 'AFC',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/nfl/500/den.png'
  },
  'Kansas City Chiefs': { 
    division: 'AFC West', 
    conference: 'AFC',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/nfl/500/kc.png'
  },
  'Las Vegas Raiders': { 
    division: 'AFC West', 
    conference: 'AFC',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/nfl/500/lv.png'
  },
  'Los Angeles Chargers': { 
    division: 'AFC West', 
    conference: 'AFC',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/nfl/500/lac.png'
  },
  
  // NFC East
  'Dallas Cowboys': { 
    division: 'NFC East', 
    conference: 'NFC',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/nfl/500/dal.png'
  },
  'New York Giants': { 
    division: 'NFC East', 
    conference: 'NFC',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/nfl/500/nyg.png'
  },
  'Philadelphia Eagles': { 
    division: 'NFC East', 
    conference: 'NFC',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/nfl/500/phi.png'
  },
  'Washington Commanders': { 
    division: 'NFC East', 
    conference: 'NFC',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/nfl/500/wsh.png'
  },
  
  // NFC North
  'Chicago Bears': { 
    division: 'NFC North', 
    conference: 'NFC',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/nfl/500/chi.png'
  },
  'Detroit Lions': { 
    division: 'NFC North', 
    conference: 'NFC',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/nfl/500/det.png'
  },
  'Green Bay Packers': { 
    division: 'NFC North', 
    conference: 'NFC',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/nfl/500/gb.png'
  },
  'Minnesota Vikings': { 
    division: 'NFC North', 
    conference: 'NFC',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/nfl/500/min.png'
  },
  
  // NFC South
  'Atlanta Falcons': { 
    division: 'NFC South', 
    conference: 'NFC',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/nfl/500/atl.png'
  },
  'Carolina Panthers': { 
    division: 'NFC South', 
    conference: 'NFC',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/nfl/500/car.png'
  },
  'New Orleans Saints': { 
    division: 'NFC South', 
    conference: 'NFC',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/nfl/500/no.png'
  },
  'Tampa Bay Buccaneers': { 
    division: 'NFC South', 
    conference: 'NFC',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/nfl/500/tb.png'
  },
  
  // NFC West
  'Arizona Cardinals': { 
    division: 'NFC West', 
    conference: 'NFC',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/nfl/500/ari.png'
  },
  'Los Angeles Rams': { 
    division: 'NFC West', 
    conference: 'NFC',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/nfl/500/lar.png'
  },
  'San Francisco 49ers': { 
    division: 'NFC West', 
    conference: 'NFC',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/nfl/500/sf.png'
  },
  'Seattle Seahawks': { 
    division: 'NFC West', 
    conference: 'NFC',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/nfl/500/sea.png'
  },
};

export interface ESPNStandingsResponse {
  children?: Array<{
    standings?: {
      entries?: ESPNStandingEntry[];
    };
  }>;
}

interface ESPNStandingEntry {
  team?: {
    displayName?: string;
    logos?: Array<{
      href: string;
    }>;
  };
  stats?: ESPNStandingStat[];
}

interface ESPNStandingStat {
  name: string;
  value: number;
}

export interface ProcessedTeamData {
  teamName: string;
  logoUrl?: string;
  wins: number;
  losses: number;
  ties: number;
  winPercentage: number;
  conference: string;
  division: string;
}

const NFL_TEAM_COUNT = Object.keys(NFL_TEAMS_MAP).length;

export function resolveNFLSeason(seasonOverride?: number): number {
  if (seasonOverride !== undefined) {
    if (Number.isInteger(seasonOverride) && seasonOverride >= 1920 && seasonOverride <= 2100) {
      return seasonOverride;
    }
    throw new RangeError('NFL season must be an integer between 1920 and 2100');
  }

  const configuredSeason = Number(process.env.NFL_SEASON);
  if (Number.isInteger(configuredSeason) && configuredSeason >= 1920 && configuredSeason <= 2100) {
    return configuredSeason;
  }

  return getExpectedStandingsSeason();
}

function assertCompleteStandings(
  standings: ProcessedTeamData[],
  source: string,
  season: number,
): ProcessedTeamData[] {
  const uniqueTeams = new Set(standings.map((team) => team.teamName));
  const hasInvalidRecord = standings.some(
    (team) =>
      !Number.isFinite(team.wins) ||
      !Number.isFinite(team.losses) ||
      !Number.isFinite(team.ties) ||
      team.wins < 0 ||
      team.losses < 0 ||
      team.ties < 0,
  );

  if (standings.length !== NFL_TEAM_COUNT || uniqueTeams.size !== NFL_TEAM_COUNT || hasInvalidRecord) {
    throw new Error(
      `${source} returned incomplete or invalid ${season} standings ` +
        `(rows=${standings.length}, uniqueTeams=${uniqueTeams.size}, expected=${NFL_TEAM_COUNT})`,
    );
  }

  return standings;
}

export async function fetchNFLStandings(seasonOverride?: number): Promise<ProcessedTeamData[]> {
  const season = resolveNFLSeason(seasonOverride);
  const sportsDataStandings = await trySportsDataStandings(season);
  if (sportsDataStandings) {
    return sportsDataStandings;
  }

  return fetchEspnStandings(season);
}

async function trySportsDataStandings(season: number): Promise<ProcessedTeamData[] | null> {
  // Skip SportsDataIO when the integration is disabled to avoid noisy errors.
  if (!process.env.SPORTSDATA_ENABLED || process.env.SPORTSDATA_ENABLED.toLowerCase() === 'false') {
    return null;
  }

  try {
    const standings = await fetchSportsDataStandings(season);
    const processed = standings
      .map((team) => processSportsDataTeam(team))
      .filter((team): team is ProcessedTeamData => Boolean(team));

    console.log(`Processed ${processed.length} teams from SportsDataIO API`);
    return assertCompleteStandings(processed, 'SportsDataIO', season);
  } catch (error) {
    console.warn('SportsDataIO API failed, falling back to ESPN:', error);
    return null;
  }
}

async function fetchEspnStandings(seasonYear: number): Promise<ProcessedTeamData[]> {
  const endpoint = new URL('https://site.web.api.espn.com/apis/v2/sports/football/nfl/standings');
  endpoint.searchParams.set('region', 'us');
  endpoint.searchParams.set('lang', 'en');
  endpoint.searchParams.set('season', String(seasonYear));
  endpoint.searchParams.set('seasontype', '2'); // 2 = regular season

  console.log('Trying ESPN API as fallback...', endpoint.toString());
  const response = await fetch(endpoint, {
    next: { revalidate: 3600 }
  });

  if (!response.ok) {
    throw new Error(`ESPN API failed with status ${response.status}`);
  }

  const data = (await response.json()) as ESPNStandingsResponse;

  if (!data.children) {
    throw new Error('ESPN API returned unexpected data structure');
  }

  const processedData: ProcessedTeamData[] = [];

  data.children.forEach((conference) => {
    if (!conference.standings || !conference.standings.entries) {
      console.log('Conference missing standings/entries:', conference);
      return;
    }

    conference.standings.entries.forEach((entry) => {
      const teamData = processESPNTeamEntry(entry);
      if (teamData) processedData.push(teamData);
    });
  });

  console.log(`Processed ${processedData.length} teams from ESPN API`);
  return assertCompleteStandings(processedData, 'ESPN', seasonYear);
}

function processESPNTeamEntry(entry: ESPNStandingEntry): ProcessedTeamData | null {
  const teamName = entry.team?.displayName;
  if (!teamName) {
    console.log('Entry missing team name:', entry);
    return null;
  }

  const teamInfo = NFL_TEAMS_MAP[teamName as keyof typeof NFL_TEAMS_MAP];
  
  if (!teamInfo) {
    console.warn(`Team not found in mapping: ${teamName}`);
    return null;
  }

  // Extract stats from ESPN format
  const stats = entry.stats?.reduce((acc: Record<string, number>, stat) => {
    acc[stat.name] = stat.value;
    return acc;
  }, {} as Record<string, number>) || {};

  const wins = stats['wins'] || 0;
  const losses = stats['losses'] || 0;
  const ties = stats['ties'] || 0;
  const gamesPlayed = wins + losses + ties;
  
  // Calculate win percentage
  const winPercentage = gamesPlayed > 0 
    ? (wins + (ties * 0.5)) / gamesPlayed 
    : 0;

  return {
    teamName,
    logoUrl: entry.team?.logos?.[0]?.href,
    wins,
    losses,
    ties,
    winPercentage: Number(winPercentage.toFixed(3)),
    conference: teamInfo.conference,
    division: teamInfo.division
  };
}

function processSportsDataTeam(team: SportsDataStandingsTeam): ProcessedTeamData | null {
  const teamName = team.Name || team.TeamName;
  if (!teamName) {
    console.log('SportsData team missing name:', team);
    return null;
  }

  const teamInfo = NFL_TEAMS_MAP[teamName as keyof typeof NFL_TEAMS_MAP];
  if (!teamInfo) {
    console.warn(`Team not found in mapping: ${teamName}`);
    return null;
  }

  const wins = team.Wins || 0;
  const losses = team.Losses || 0;
  const ties = team.Ties || 0;
  const gamesPlayed = wins + losses + ties;
  
  const winPercentage = gamesPlayed > 0 
    ? (wins + (ties * 0.5)) / gamesPlayed 
    : 0;

  return {
    teamName,
    logoUrl: teamInfo.logoUrl,
    wins,
    losses,
    ties,
    winPercentage: Number(winPercentage.toFixed(3)),
    conference: teamInfo.conference,
    division: teamInfo.division
  };
}

// Retain the established public function name, but only cache complete live data.
// Static season snapshots must never be returned for a different requested season.
const standingsCache = new Map<number, { data: ProcessedTeamData[]; expiresAt: number }>();
const standingsInFlight = new Map<number, Promise<ProcessedTeamData[]>>();
const STANDINGS_CACHE_MS = 5 * 60 * 1000;

export async function fetchNFLStandingsWithFallback(seasonOverride?: number): Promise<ProcessedTeamData[]> {
  const season = resolveNFLSeason(seasonOverride);
  const now = Date.now();
  const cached = standingsCache.get(season);
  if (cached && cached.expiresAt > now) {
    return cached.data;
  }

  const inFlight = standingsInFlight.get(season);
  if (inFlight) {
    return inFlight;
  }

  const request = (async () => {
    try {
      return await fetchNFLStandings(season);
    } catch (error) {
      throw new Error(
        `Unable to fetch complete live NFL standings for ${season}; static fallback data was not used`,
        { cause: error },
      );
    }
  })();
  standingsInFlight.set(season, request);

  try {
    const data = await request;
    standingsCache.set(season, {
      data,
      expiresAt: Date.now() + STANDINGS_CACHE_MS,
    });
    return data;
  } finally {
    standingsInFlight.delete(season);
  }
}
