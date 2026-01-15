#!/usr/bin/env ts-node
/**
 * Sync team records into Sanity from live standings.
 * Usage:
 *   SANITY_WRITE_TOKEN=xxxx SEASON=2025 ts-node scripts/sync-team-records.ts
 *
 * Notes:
 * - Requires SANITY_WRITE_TOKEN with write access to the dataset.
 * - Prefers live standings (SportsData/ESPN via fetchNFLStandingsWithFallback).
 * - Creates/updates teamRecord docs with ids: teamRecord-<ABBR>-<SEASON>.
 */

import { createClient } from '@sanity/client';
import { projectId, dataset, apiVersion } from '../sanity/env';
import { fetchNFLStandingsWithFallback, ProcessedTeamData } from '../lib/nfl-api';
import { TEAM_META } from '../lib/schedule';

const token = process.env.SANITY_WRITE_TOKEN;
if (!token) {
  console.error('Missing SANITY_WRITE_TOKEN');
  process.exit(1);
}

const season = Number(process.env.SEASON || '2025');
if (!Number.isFinite(season)) {
  console.error('Invalid SEASON env');
  process.exit(1);
}

const client = createClient({ projectId, dataset, apiVersion, token, useCdn: false });

function mapNameToAbbr(): Map<string, string> {
  const map = new Map<string, string>();
  Object.entries(TEAM_META).forEach(([abbr, meta]) => {
    if (meta?.name) map.set(meta.name, abbr);
  });
  return map;
}

async function run() {
  const nameToAbbr = mapNameToAbbr();
  const standings = await fetchNFLStandingsWithFallback();
  const mutations = standings
    .map((team: ProcessedTeamData) => {
      const abbr = nameToAbbr.get(team.teamName);
      if (!abbr) {
        console.warn('Skipping unmapped teamName', team.teamName);
        return null;
      }
      const _id = `teamRecord-${abbr}-${season}`;
      return {
        createOrReplace: {
          _id,
          _type: 'teamRecord',
          teamAbbr: abbr,
          season,
          wins: team.wins,
          losses: team.losses,
          ties: team.ties || 0,
          streak: undefined,
        },
      } as const;
    })
    .filter(Boolean) as { createOrReplace: any }[];

  if (!mutations.length) {
    console.error('No mutations prepared. Exiting.');
    process.exit(1);
  }

  const chunk = 50;
  for (let i = 0; i < mutations.length; i += chunk) {
    const slice = mutations.slice(i, i + chunk);
    await client.transaction(slice).commit();
  }

  console.log(`Synced ${mutations.length} teamRecord docs for season ${season}.`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
