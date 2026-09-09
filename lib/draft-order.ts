import { fetchSportsDataStandings, SportsDataStandingsTeam } from '@/lib/sportsdata-client';
import { fetchNFLStandingsWithFallback, ProcessedTeamData, resolveNFLSeason } from '@/lib/nfl-api';
import { TEAM_META } from '@/lib/schedule';
import { tradedPicks, TradedPick } from '@/data/traded-picks';

export interface DraftPick {
  pick: number;
  originalTeam: string; // abbr
  owningTeam: string; // abbr (after trades)
  wins: number;
  losses: number;
  ties: number;
  winPct: number;
  record: string;
  sos?: number;
  note?: string;
}

export interface DraftOrderResult {
  season: number;
  generatedAt: string;
  picks: DraftPick[];
}

export async function computeDraftOrder(season?: number): Promise<DraftOrderResult> {
  const seasonUsed = resolveNFLSeason(season);
  const base = await getStandingsRows(seasonUsed);
  const sorted = base.sort(compareForDraft);
  const picks = applyTradedPicks(sorted, tradedPicks).map((row, idx) => ({
    pick: idx + 1,
    originalTeam: row.teamAbbr,
    owningTeam: row.owningTeam,
    wins: row.wins,
    losses: row.losses,
    ties: row.ties,
    winPct: row.winPct,
    record: row.record,
    sos: row.sos,
    note: row.note,
  }));

  return {
    season: seasonUsed,
    generatedAt: new Date().toISOString(),
    picks,
  };
}

type StandingsRow = ReturnType<typeof mapStandingRow>;

async function getStandingsRows(season: number): Promise<StandingsRow[]> {
  const hasApiKey = Boolean(process.env.SPORTSDATA_API_KEY);

  if (hasApiKey) {
    try {
      const standings = await fetchSportsDataStandings(season);
      return assertCompleteStandingsRows(standings.map(mapStandingRow), season, 'SportsDataIO');
    } catch (err) {
      console.warn('SportsDataIO standings failed, falling back to ESPN data:', err);
    }
  }

  // Fallback path: use ESPN-derived standings (no API key required).
  const fallback = await fetchNFLStandingsWithFallback(season);
  const rows = fallback
    .map((team) => mapFallbackTeam(team))
    .filter((row): row is StandingsRow => Boolean(row));
  return assertCompleteStandingsRows(rows, season, 'ESPN');
}

function assertCompleteStandingsRows(rows: StandingsRow[], season: number, source: string): StandingsRow[] {
  const teams = new Set(rows.map((row) => row.teamAbbr));
  const expectedTeams = new Set(Object.keys(TEAM_META));
  const hasInvalidRow = rows.some(
    (row) =>
      !expectedTeams.has(row.teamAbbr) ||
      !Number.isInteger(row.wins) ||
      !Number.isInteger(row.losses) ||
      !Number.isInteger(row.ties) ||
      row.wins < 0 ||
      row.losses < 0 ||
      row.ties < 0 ||
      !Number.isFinite(row.winPct) ||
      (row.sos !== undefined && !Number.isFinite(row.sos)),
  );
  if (rows.length !== 32 || teams.size !== 32 || expectedTeams.size !== 32 || hasInvalidRow) {
    throw new Error(
      `${source} returned incomplete or invalid ${season} draft standings ` +
        `(rows=${rows.length}, uniqueTeams=${teams.size}, expected=32)`,
    );
  }
  return rows;
}

function mapStandingRow(team: SportsDataStandingsTeam) {
  const wins = team.Wins ?? 0;
  const losses = team.Losses ?? 0;
  const ties = team.Ties ?? 0;
  const games = wins + losses + ties;
  const winPct = games > 0 ? (wins + ties * 0.5) / games : 0;
  const abbr = (team.Key || team.TeamName || team.TeamID?.toString() || '').toUpperCase();
  const sos = team.StrengthOfSchedule ?? computeSosFromOpponents(team);
  return {
    teamAbbr: abbr,
    wins,
    losses,
    ties,
    winPct,
    record: `${wins}-${losses}${ties ? `-${ties}` : ''}`,
    sos,
    owningTeam: abbr as string,
    note: undefined as string | undefined,
  };
}

function mapFallbackTeam(team: ProcessedTeamData): StandingsRow | null {
  const abbr = findAbbr(team.teamName);
  if (!abbr) return null;
  const wins = team.wins ?? 0;
  const losses = team.losses ?? 0;
  const ties = team.ties ?? 0;
  const games = wins + losses + ties;
  const winPct = games > 0 ? (wins + ties * 0.5) / games : 0;

  return {
    teamAbbr: abbr,
    wins,
    losses,
    ties,
    winPct,
    record: `${wins}-${losses}${ties ? `-${ties}` : ''}`,
    sos: undefined,
    owningTeam: abbr,
    note: undefined,
  };
}

function findAbbr(teamName: string): string | null {
  const entry = Object.entries(TEAM_META).find(([, meta]) => meta.name === teamName);
  if (entry) return entry[0];
  return null;
}

function compareForDraft(a: StandingsRow, b: StandingsRow): number {
  // Worse records first (lower winPct).
  if (a.winPct !== b.winPct) return a.winPct - b.winPct;
  // If tied, fewer wins first.
  if (a.wins !== b.wins) return a.wins - b.wins;
  // If still tied, more losses first.
  if (a.losses !== b.losses) return b.losses - a.losses;
  // Use SOS (lower SOS = easier opponents -> lower priority), so higher SOS should pick later. NFL tie-break uses strength of schedule; smaller SOS wins the tie.
  if (a.sos !== undefined && b.sos !== undefined && a.sos !== b.sos) return a.sos - b.sos;
  // Finally, deterministic by team name.
  return a.teamAbbr.localeCompare(b.teamAbbr);
}

function applyTradedPicks(rows: StandingsRow[], trades: TradedPick[]): StandingsRow[] {
  const tradeMap = new Map<string, TradedPick[]>();
  for (const trade of trades) {
    const list = tradeMap.get(trade.originalTeam.toUpperCase()) ?? [];
    list.push(trade);
    tradeMap.set(trade.originalTeam.toUpperCase(), list);
  }

  return rows.map((row) => {
    const t = tradeMap.get(row.teamAbbr);
    if (!t || !t.length) return row;
    // Assume one trade per team per round for now; extend if needed.
    const primary = t[0];
    const owner = primary.toTeam.toUpperCase();
    return {
      ...row,
      owningTeam: owner,
      note: primary.note,
    };
  });
}

function computeSosFromOpponents(team: SportsDataStandingsTeam): number | undefined {
  if (team.OpponentWins === undefined || team.OpponentLosses === undefined) return undefined;
  const oppWins = team.OpponentWins ?? 0;
  const oppLosses = team.OpponentLosses ?? 0;
  const oppTies = team.OpponentTies ?? 0;
  const games = oppWins + oppLosses + oppTies;
  if (games === 0) return undefined;
  return (oppWins + oppTies * 0.5) / games;
}
