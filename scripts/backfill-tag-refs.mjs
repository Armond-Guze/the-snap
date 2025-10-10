#!/usr/bin/env node
// Backfill tagRefs on headlines and rankings by matching existing string tags to tag documents
// Usage:
//   node scripts/backfill-tag-refs.mjs            # executes with real writes
//   node scripts/backfill-tag-refs.mjs --dry-run  # logs changes without patching

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

if (!token) {
  console.warn('No write token found. Script will run in read-only. Use --dry-run or set SANITY_WRITE_TOKEN.');
}

const client = sanityClient({ projectId, dataset, apiVersion, token, useCdn: false });

const DRY_RUN = process.argv.includes('--dry-run') || !token;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchAllTags() {
  const tags = await client.fetch(`*[_type == "tag"]{ _id, title, slug, aliases }`);
  const mapByTitle = new Map();
  const mapBySlug = new Map();
  const mapByAlias = new Map();
  for (const t of tags) {
    if (t.title) mapByTitle.set(t.title.toLowerCase(), t);
    if (t.slug?.current) mapBySlug.set(t.slug.current.toLowerCase(), t);
    if (Array.isArray(t.aliases)) {
      for (const a of t.aliases) {
        if (a && typeof a === 'string') mapByAlias.set(a.toLowerCase(), t);
      }
    }
  }
  return { mapByTitle, mapBySlug, mapByAlias };
}

function normalizeTagString(s) {
  if (!s || typeof s !== 'string') return '';
  return s.trim().replace(/^#/, '').toLowerCase();
}

function toRef(tag) {
  return { _type: 'reference', _ref: tag._id };
}

async function backfillForType(typeName) {
  const { mapByTitle, mapBySlug, mapByAlias } = await fetchAllTags();

  console.log(`\nProcessing type: ${typeName}`);
  const docs = await client.fetch(`*[_type == $type && defined(tags) && count(tags) > 0]{ _id, tags, tagRefs }`, { type: typeName });
  console.log(`Found ${docs.length} ${typeName} documents with string tags`);

  let patched = 0, skipped = 0;

  for (const doc of docs) {
    const existingRefs = Array.isArray(doc.tagRefs) ? new Set(doc.tagRefs.map(r => r?._ref).filter(Boolean)) : new Set();
    const newRefs = [];
    for (const raw of doc.tags) {
      const key = normalizeTagString(raw);
      if (!key) continue;
      const byTitle = mapByTitle.get(key);
      const bySlug = mapBySlug.get(key);
      const byAlias = mapByAlias.get(key);
      const tag = byTitle || bySlug || byAlias ||
        // built-in synonyms for common primetime tags
        (key === 'mnf' || key === 'monday night football' || key === 'monday night') ? mapByTitle.get('monday night football') :
        (key === 'tnf' || key === 'thursday night football' || key === 'thursday night') ? mapByTitle.get('thursday night football') :
        (key === 'snf' || key === 'sunday night football' || key === 'sunday night') ? mapByTitle.get('sunday night football') :
        null;
      if (tag && !existingRefs.has(tag._id)) {
        newRefs.push(toRef(tag));
      }
    }

    if (newRefs.length === 0) {
      skipped++;
      continue;
    }

    const nextRefs = [...existingRefs].map(_ref => ({ _type: 'reference', _ref }));
    for (const r of newRefs) nextRefs.push(r);

    console.log(`Would patch ${typeName} ${doc._id}: add ${newRefs.length} tagRefs`);
    if (!DRY_RUN) {
      await client
        .patch(doc._id)
        .set({ tagRefs: nextRefs })
        .commit({ autoGenerateArrayKeys: true });
      patched++;
      // be gentle on API
      await sleep(50);
    }
  }

  console.log(`Finished ${typeName}: ${patched} patched, ${skipped} skipped.`);
}

async function main() {
  console.log(`Starting tagRefs backfill (dataset=${dataset}) ${DRY_RUN ? '[DRY RUN]' : ''}`);
  await backfillForType('headline');
  await backfillForType('rankings');
  console.log('Done.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
