#!/usr/bin/env node
// Backfill helper fields on power ranking article docs.
// - Sets editorialStatus (default from published flag when missing)
// - Computes biggestRiser / biggestFaller
// - Copies note -> summary on ranking entries when summary is empty
// - Refreshes SEO prefill when seo.autoGenerate !== false
//
// Usage:
//   node scripts/backfill-power-ranking-helpers.mjs            # live run (requires SANITY_WRITE_TOKEN)
//   node scripts/backfill-power-ranking-helpers.mjs --dry-run  # preview only

import { createClient } from '@sanity/client';
import dotenv from 'dotenv';

dotenv.config();

const projectId =
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ||
  process.env.SANITY_STUDIO_PROJECT_ID ||
  process.env.SANITY_PROJECT_ID;

const dataset =
  process.env.NEXT_PUBLIC_SANITY_DATASET ||
  process.env.SANITY_STUDIO_DATASET ||
  process.env.SANITY_DATASET ||
  'production';

const apiVersion =
  process.env.NEXT_PUBLIC_SANITY_API_VERSION ||
  process.env.SANITY_STUDIO_API_VERSION ||
  '2024-06-01';

const token =
  process.env.SANITY_WRITE_TOKEN ||
  process.env.SANITY_API_WRITE_TOKEN ||
  process.env.SANITY_API_TOKEN ||
  process.env.SANITY_TOKEN;

if (!projectId || !dataset) {
  console.error('Missing SANITY projectId/dataset in env');
  process.exit(1);
}

const DRY_RUN = process.argv.includes('--dry-run') || !token;
if (!token) {
  console.warn('No write token found. Running in dry-run mode.');
}

const client = createClient({ projectId, dataset, apiVersion, token, useCdn: false });

const PLAYOFF_LABELS = {
  WC: 'Wild Card',
  DIV: 'Divisional',
  CONF: 'Conference Championship',
  SB: 'Super Bowl',
};

function teamLabel(item) {
  return item.teamAbbr || item.teamName || item.team?.title || 'TEAM';
}

function previousRank(item) {
  if (typeof item.previousRank === 'number') return item.previousRank;
  if (typeof item.prevRankOverride === 'number') return item.prevRankOverride;
  return null;
}

function movement(item) {
  if (typeof item.movement === 'number') return item.movement;
  if (typeof item.movementOverride === 'number') return item.movementOverride;
  if (typeof item.rank === 'number') {
    const prev = previousRank(item);
    if (typeof prev === 'number') return prev - item.rank;
  }
  return 0;
}

function normalizeItems(items) {
  return (Array.isArray(items) ? items : [])
    .filter((item) => !!item && typeof item === 'object')
    .map((item) => {
      const prev = previousRank(item);
      const move = movement(item);
      return {
        ...item,
        summary: item.summary || item.note || '',
        note: item.note || item.summary || '',
        previousRank: typeof prev === 'number' ? prev : undefined,
        prevRankOverride: typeof prev === 'number' ? prev : undefined,
        movement: move,
        movementOverride: move,
      };
    });
}

function deriveMovers(items) {
  const normalized = normalizeItems(items);
  let riserLabel = '';
  let riserMove = 0;
  let fallerLabel = '';
  let fallerMove = 0;

  for (const item of normalized) {
    const move = movement(item);
    if (move > 0 && (!riserLabel || move > riserMove)) {
      riserLabel = teamLabel(item);
      riserMove = move;
    }
    if (move < 0 && (!fallerLabel || move < fallerMove)) {
      fallerLabel = teamLabel(item);
      fallerMove = move;
    }
  }

  return {
    biggestRiser: riserLabel ? `${riserLabel} (+${riserMove})` : '',
    biggestFaller: fallerLabel ? `${fallerLabel} (${fallerMove})` : '',
  };
}

function clamp(input, max, minSplit) {
  const text = String(input || '').trim().replace(/\s+/g, ' ');
  if (text.length <= max) return text;
  const short = text.slice(0, max);
  const split = short.lastIndexOf(' ');
  const trimmed = split > minSplit ? short.slice(0, split) : short;
  return `${trimmed.trim()}…`;
}

function buildSeoPrefill(doc) {
  const season = doc.seasonYear || new Date().getFullYear();
  const weekLabel =
    typeof doc.weekNumber === 'number'
      ? `Week ${doc.weekNumber}`
      : doc.playoffRound
        ? (PLAYOFF_LABELS[doc.playoffRound] || doc.playoffRound)
        : null;

  const titleBase = doc.title || `NFL Power Rankings ${season}${weekLabel ? ` - ${weekLabel}` : ''}`;
  const metaTitle = clamp(`${titleBase} | The Snap`, 60, 30);
  const metaDescription = clamp(
    doc.summary ||
      `Complete NFL Power Rankings for ${season}${weekLabel ? `, ${weekLabel}` : ''}. See biggest risers, fallers, and team-by-team analysis.`,
    160,
    80
  );

  return {
    autoGenerate: true,
    metaTitle,
    metaDescription,
    ogTitle: metaTitle,
    ogDescription: metaDescription,
    focusKeyword: weekLabel
      ? `nfl power rankings ${season} ${weekLabel.toLowerCase()}`
      : `nfl power rankings ${season}`,
    additionalKeywords: [
      `nfl rankings ${season}`,
      weekLabel ? `${weekLabel.toLowerCase()} power rankings` : 'weekly nfl power rankings',
      'the snap nfl rankings',
    ],
    lastGenerated: new Date().toISOString(),
  };
}

async function main() {
  console.log(`Backfilling power ranking helpers (dataset=${dataset}) ${DRY_RUN ? '[DRY RUN]' : ''}`);

  const docs = await client.fetch(
    `*[_type=="article" && format=="powerRankings"]{
      _id,
      title,
      summary,
      seasonYear,
      weekNumber,
      playoffRound,
      published,
      rankingType,
      editorialStatus,
      biggestRiser,
      biggestFaller,
      seo,
      rankings[]{
        ...,
        team->{title}
      }
    }`
  );

  console.log(`Found ${docs.length} power ranking article docs.`);

  let patched = 0;
  for (const doc of docs) {
    const normalized = normalizeItems(doc.rankings);
    const movers = deriveMovers(normalized);
    const editorialStatus =
      doc.editorialStatus || (doc.published ? 'published' : 'draft');

    const setPayload = {
      rankings: normalized,
      biggestRiser: movers.biggestRiser,
      biggestFaller: movers.biggestFaller,
      editorialStatus,
    };

    if (!doc.seo || doc.seo.autoGenerate !== false) {
      setPayload.seo = { ...(doc.seo || {}), ...buildSeoPrefill(doc) };
    }

    if (DRY_RUN) {
      console.log(`- Would patch ${doc._id}: status=${editorialStatus}, riser="${movers.biggestRiser}", faller="${movers.biggestFaller}"`);
      continue;
    }

    await client.patch(doc._id).set(setPayload).commit({ autoGenerateArrayKeys: true });
    patched += 1;
  }

  console.log(DRY_RUN ? 'Dry run complete.' : `Done. Patched ${patched} docs.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
