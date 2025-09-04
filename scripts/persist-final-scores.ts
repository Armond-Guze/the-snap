#!/usr/bin/env ts-node
/**
 * Placeholder script to show how nightly persistence could work without paid infra.
 * Strategy:
 *  - Iterate past weeks (<= current week - 1)
 *  - Fetch each week via internal API route (or directly via lib)
 *  - Filter FINAL games and (future) upsert into a JSON file or Sanity dataset.
 * For now it only logs. You could schedule this via GitHub Action daily.
 */
import { loadStaticSchedule, getEnrichedWeek, determineCurrentWeek } from '../lib/schedule';

async function run() {
  const schedule = await loadStaticSchedule();
  const currentWeek = determineCurrentWeek(schedule);
  const targetWeeks = Array.from({ length: currentWeek - 1 }, (_, i) => i + 1).filter(w => w >= 1);
  console.log('Persist finals for weeks:', targetWeeks);
  for (const w of targetWeeks) {
    const games = await getEnrichedWeek(w);
    const finals = games.filter(g => g.status === 'FINAL');
    if (!finals.length) continue;
    // TODO: Write to a JSON archive or Sanity mutation.
    console.log(`Week ${w} finals (${finals.length}):`, finals.map(f => `${f.away}@${f.home} ${f.scores?.away}-${f.scores?.home}`));
  }
  console.log('Done. (Extend this to persist data)');
}

run().catch(e => { console.error(e); process.exit(1); });
