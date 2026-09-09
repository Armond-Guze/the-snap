import { client } from '@/sanity/lib/client';
import { fetchNFLStandingsWithFallback, ProcessedTeamData, resolveNFLSeason } from '@/lib/nfl-api';
import { TEAM_META } from '@/lib/schedule';

const SANITY_WRITE_TOKEN = process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_WRITE_TOKEN;

const writeClient = client.withConfig({
  token: SANITY_WRITE_TOKEN,
  useCdn: false,
});

const NAME_TO_ABBR = Object.entries(TEAM_META).reduce<Record<string, string>>((acc, [abbr, meta]) => {
  if (meta?.name) acc[meta.name] = abbr;
  return acc;
}, {});

export interface SyncTeamRecordsResult {
  success: boolean;
  created: number;
  updated: number;
  skipped: number;
  season: number;
  errors: string[];
}

function guessAbbr(teamName: string): string | null {
  if (NAME_TO_ABBR[teamName]) return NAME_TO_ABBR[teamName];
  const normalized = teamName.replace(/[^a-z0-9]/gi, '').toLowerCase();
  for (const [abbr, meta] of Object.entries(TEAM_META)) {
    const metaName = meta.name.replace(/[^a-z0-9]/gi, '').toLowerCase();
    if (metaName === normalized) return abbr;
  }
  return null;
}

function toRecordDoc(team: ProcessedTeamData, teamAbbr: string, season: number) {
  return {
    _id: `teamRecord-${teamAbbr}-${season}`,
    _type: 'teamRecord',
    teamAbbr,
    season,
    wins: team.wins,
    losses: team.losses,
    ties: team.ties,
    lastUpdated: new Date().toISOString(),
  };
}

export async function syncTeamRecords(seasonOverride?: number): Promise<SyncTeamRecordsResult> {
  if (!SANITY_WRITE_TOKEN) {
    throw new Error('SANITY_API_WRITE_TOKEN (or SANITY_WRITE_TOKEN) is not configured.');
  }

  const season = resolveNFLSeason(seasonOverride);
  const result: SyncTeamRecordsResult = {
    success: false,
    created: 0,
    updated: 0,
    skipped: 0,
    season,
    errors: [],
  };

  try {
    const standings = await fetchNFLStandingsWithFallback(season);
    if (standings.length !== 32) {
      throw new Error(`Standings API returned ${standings.length} entries; expected 32.`);
    }

    const mappedStandings = standings.flatMap((team) => {
      const teamAbbr = guessAbbr(team.teamName);
      if (!teamAbbr) {
        result.skipped++;
        result.errors.push(`Unknown team mapping for ${team.teamName}`);
        return [];
      }
      return [{ team, teamAbbr }];
    });

    const mappedTeams = new Set(mappedStandings.map(({ teamAbbr }) => teamAbbr));
    if (mappedStandings.length !== 32 || mappedTeams.size !== 32 || result.skipped > 0) {
      throw new Error(
        `Refusing to write incomplete ${season} standings: ` +
          `mapped ${mappedStandings.length} rows across ${mappedTeams.size} unique teams.`,
      );
    }

    const existing = await writeClient.fetch<Array<{ _id: string; teamAbbr: string }>>(
      `*[_type == "teamRecord" && season == $season]{ _id, teamAbbr }`,
      { season }
    );
    const existingMap = new Map(existing.map(doc => [doc.teamAbbr.toUpperCase(), doc._id]));

    let tx = writeClient.transaction();
    let pending = 0;
    let created = 0;
    let updated = 0;

    for (const { team, teamAbbr } of mappedStandings) {
      const doc = toRecordDoc(team, teamAbbr, season);
      const existingId = existingMap.get(teamAbbr);
      if (existingId) {
        doc._id = existingId;
        updated++;
      } else {
        created++;
      }

      tx = tx.createOrReplace(doc);
      pending++;
    }

    if (pending !== 32) {
      throw new Error(`Refusing to commit incomplete ${season} standings transaction (${pending}/32).`);
    }

    await tx.commit();
    result.created = created;
    result.updated = updated;
    result.success = true;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown sync error';
    result.errors.push(message);
  }

  return result;
}
