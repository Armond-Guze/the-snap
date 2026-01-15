#!/usr/bin/env node
// Migrate legacy powerRanking + powerRankingWeek docs into article subtype format.
// Usage:
//   node scripts/migrate-power-rankings-to-articles.mjs --dry-run
//   node scripts/migrate-power-rankings-to-articles.mjs           (requires SANITY_WRITE_TOKEN)

import sanityClient from '@sanity/client';
import dotenv from 'dotenv';

dotenv.config();

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || process.env.SANITY_STUDIO_PROJECT_ID || process.env.SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || process.env.SANITY_STUDIO_DATASET || process.env.SANITY_DATASET || 'production';
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || process.env.SANITY_STUDIO_API_VERSION || '2024-06-01';
const token = process.env.SANITY_WRITE_TOKEN || process.env.SANITY_API_TOKEN || process.env.SANITY_TOKEN;

if (!projectId || !dataset) {
  console.error('Missing SANITY projectId/dataset in env');
  process.exit(1);
}

const DRY_RUN = process.argv.includes('--dry-run') || !token;
if (DRY_RUN) {
  console.log('Running in DRY-RUN (or read-only) mode; no writes will be made.');
} else {
  console.log('Write mode enabled.');
}

const client = sanityClient({ projectId, dataset, apiVersion, token, useCdn: false });

async function fetchLegacyLiveTeams() {
  return client.fetch(`*[_type=="powerRanking"]|order(rank asc){ _id, rank, teamName, teamLogo, summary, body, previousRank, date }`);
}

async function fetchLegacySnapshots() {
  return client.fetch(`*[_type=="powerRankingWeek"]|order(season desc, week desc){ _id, season, week, items[]{ rank, teamAbbr, teamName, note, prevRank, movement }, publishedAt }`);
}

async function fetchExistingPowerRankingArticles() {
  return client.fetch(`*[_type=="article" && format=="powerRankings"]{ _id, rankingType, seasonYear, weekNumber }`);
}

function buildLiveDoc({ seasonYear, rankings }) {
  return {
    _id: 'power-rankings-live',
    _type: 'article',
    format: 'powerRankings',
    rankingType: 'live',
    seasonYear,
    title: `NFL Power Rankings ${seasonYear}`,
    slug: { _type: 'slug', current: 'power-rankings' },
    date: new Date().toISOString(),
    published: true,
    rankings,
  };
}

function buildSnapshotDoc({ season, week, items, publishedAt }) {
  return {
    _id: `prw-${season}-w${week}`,
    _type: 'article',
    format: 'powerRankings',
    rankingType: 'snapshot',
    seasonYear: season,
    weekNumber: week,
    title: `NFL Power Rankings ${season} — Week ${week}`,
    slug: { _type: 'slug', current: `power-rankings-${season}-week-${week}` },
    date: publishedAt || new Date().toISOString(),
    published: true,
    rankings: items.map((it) => ({
      _type: 'object',
      rank: it.rank,
      teamAbbr: it.teamAbbr,
      teamName: it.teamName,
      note: it.note,
      prevRankOverride: it.prevRank ?? undefined,
      movementOverride: it.movement ?? undefined,
    })),
  };
}

async function main() {
  const [teams, snapshots, existing] = await Promise.all([
    fetchLegacyLiveTeams(),
    fetchLegacySnapshots(),
    fetchExistingPowerRankingArticles(),
  ]);

  const existingLive = existing.find((d) => d.rankingType === 'live');
  const existingSnapshots = new Set(existing.filter((d) => d.rankingType === 'snapshot').map((d) => `${d.seasonYear}-${d.weekNumber}`));

  const seasonFromSnapshots = snapshots.reduce((max, s) => Math.max(max, s.season || 0), 0);
  const seasonYear = seasonFromSnapshots || new Date().getFullYear();

  const toCreate = [];

  if (!existingLive && teams?.length) {
    const rankings = teams.map((t) => ({
      _type: 'object',
      rank: t.rank,
      teamName: t.teamName,
      teamLogo: t.teamLogo,
      note: t.summary,
      analysis: t.body || [],
      prevRankOverride: t.previousRank ?? undefined,
    }));
    toCreate.push(buildLiveDoc({ seasonYear, rankings }));
  } else {
    console.log('Live power rankings article already exists; skipping live doc creation.');
  }

  for (const snap of snapshots) {
    const key = `${snap.season}-${snap.week}`;
    if (existingSnapshots.has(key)) {
      continue;
    }
    toCreate.push(buildSnapshotDoc({ season: snap.season, week: snap.week, items: snap.items || [], publishedAt: snap.publishedAt }));
  }

  console.log(`Prepared ${toCreate.length} power rankings article docs (${teams?.length || 0} live teams, ${snapshots?.length || 0} snapshots).`);
  if (!toCreate.length) return;

  if (DRY_RUN) {
    console.log('DRY-RUN complete. No documents created.');
    return;
  }

  const chunkSize = 50;
  let created = 0;
  for (let i = 0; i < toCreate.length; i += chunkSize) {
    const chunk = toCreate.slice(i, i + chunkSize);
    const tx = client.transaction();
    chunk.forEach((doc) => tx.createIfNotExists(doc));
    await tx.commit();
    created += chunk.length;
    console.log(`Committed ${created}/${toCreate.length}...`);
  }

  console.log(`Done. Created ${created} article documents.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
