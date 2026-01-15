#!/usr/bin/env ts-node
/**
 * Sync game schedule into Sanity `game` documents from local JSON.
 * Usage:
 *   SANITY_WRITE_TOKEN=xxxx SEASON=2025 ts-node scripts/sync-games.ts
 *
 * Reads data/nfl-<SEASON>-schedule.json and upserts docs with ids: game-<gameId>.
 */

import { createClient } from '@sanity/client';
import fs from 'node:fs';
import path from 'node:path';
import { projectId, dataset, apiVersion } from '../sanity/env';
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

interface ScheduleRow {
  gameId: string;
  week: number;
  dateUTC: string;
  home: string;
  away: string;
  network?: string;
  venue?: string;
}

function loadSchedule(): ScheduleRow[] {
  const candidate = path.join(process.cwd(), 'data', `nfl-${season}-schedule.json`);
  if (!fs.existsSync(candidate)) {
    console.error(`Schedule file not found: ${candidate}`);
    process.exit(1);
  }
  const raw = fs.readFileSync(candidate, 'utf8');
  const parsed = JSON.parse(raw) as ScheduleRow[];
  return parsed;
}

function abbrToName(abbr: string): string {
  return TEAM_META[abbr]?.name || abbr;
}

const client = createClient({ projectId, dataset, apiVersion, token, useCdn: false });

async function run() {
  const schedule = loadSchedule();
  const mutations = schedule.map((row) => {
    const gameDate = new Date(row.dateUTC);
    if (Number.isNaN(gameDate.getTime())) {
      console.warn('Skipping row with invalid date', row);
      return null;
    }
    const _id = `game-${row.gameId}`;
    return {
      createOrReplace: {
        _id,
        _type: 'game',
        week: row.week,
        homeTeam: abbrToName(row.home),
        awayTeam: abbrToName(row.away),
        homeRecord: undefined,
        awayRecord: undefined,
        gameDate: gameDate.toISOString(),
        tvNetwork: row.network,
        gameType: 'regular',
        featured: false,
        gameImportance: 'regular',
        preview: undefined,
        published: true,
        season: String(season)
      }
    } as const;
  }).filter(Boolean) as { createOrReplace: any }[];

  if (!mutations.length) {
    console.error('No schedule rows parsed');
    process.exit(1);
  }

  const chunkSize = 50;
  for (let i = 0; i < mutations.length; i += chunkSize) {
    const slice = mutations.slice(i, i + chunkSize);
    await client.transaction(slice).commit();
  }

  console.log(`Synced ${mutations.length} games for season ${season}.`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
