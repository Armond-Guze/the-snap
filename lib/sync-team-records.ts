import { client } from '@/sanity/lib/client';
import { fetchNFLStandingsWithFallback, ProcessedTeamData } from '@/lib/nfl-api';
import { TEAM_META } from '@/lib/schedule';

const writeClient = client.withConfig({
  token: process.env.SANITY_API_WRITE_TOKEN,
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
  if (!process.env.SANITY_API_WRITE_TOKEN) {
    throw new Error('SANITY_API_WRITE_TOKEN is not configured.');
  }

  const season = seasonOverride ?? Number(process.env.NFL_SEASON ?? new Date().getFullYear());
  const result: SyncTeamRecordsResult = {
    success: false,
    created: 0,
    updated: 0,
    skipped: 0,
    season,
    errors: [],
  };

  try {
    const standings = await fetchNFLStandingsWithFallback();
    if (!standings.length) throw new Error('Standings API returned 0 entries.');

    const existing = await writeClient.fetch<Array<{ _id: string; teamAbbr: string }>>(
      `*[_type == "teamRecord" && season == $season]{ _id, teamAbbr }`,
      { season }
    );
    const existingMap = new Map(existing.map(doc => [doc.teamAbbr.toUpperCase(), doc._id]));

    let tx = writeClient.transaction();
    let pending = 0;

    for (const team of standings) {
      const abbr = guessAbbr(team.teamName);
      if (!abbr) {
        result.skipped++;
        result.errors.push(`Unknown team mapping for ${team.teamName}`);
        continue;
      }

      const doc = toRecordDoc(team, abbr, season);
      const existingId = existingMap.get(abbr);
      if (existingId) {
        doc._id = existingId;
        result.updated++;
      } else {
        result.created++;
      }

      tx = tx.createOrReplace(doc as any);
      pending++;
    }

    if (pending > 0) {
      await tx.commit();
    }

    result.success = true;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown sync error';
    result.errors.push(message);
  }

  return result;
}
