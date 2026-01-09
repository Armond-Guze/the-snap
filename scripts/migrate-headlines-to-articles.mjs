#!/usr/bin/env node
// Clone headline docs into article docs with format="headline" so we can unify content.
// Usage:
//   node scripts/migrate-headlines-to-articles.mjs --dry-run
//   node scripts/migrate-headlines-to-articles.mjs           (requires SANITY_WRITE_TOKEN)

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

function baseId(id) {
  return id.startsWith('drafts.') ? id.slice('drafts.'.length) : id;
}

function withPrefix(id, isDraft) {
  return isDraft ? `drafts.${id}` : id;
}

async function fetchHeadlines() {
  const GROQ = `*[_type == "headline"]{ _id, title, homepageTitle, slug, seo, coverImage, author, date, summary, category, players, teams, tags, tagRefs, published, body, youtubeVideoId, videoTitle, twitterUrl, twitterTitle, instagramUrl, instagramTitle, tiktokUrl, tiktokTitle, priority }`;
  return client.fetch(GROQ);
}

async function fetchArticleSlugs() {
  const rows = await client.fetch(`*[_type == "article" && defined(slug.current)]{ _id, "slug": slug.current }`);
  const map = new Map();
  for (const row of rows) {
    if (row.slug) map.set(row.slug, row._id);
  }
  return map;
}

function buildArticleDoc(headline) {
  const isDraft = headline._id.startsWith('drafts.');
  const newId = withPrefix(`article-${baseId(headline._id)}`, isDraft);
  return {
    _id: newId,
    _type: 'article',
    format: 'headline',
    title: headline.title,
    homepageTitle: headline.homepageTitle,
    slug: headline.slug,
    seo: headline.seo,
    coverImage: headline.coverImage,
    author: headline.author,
    date: headline.date,
    summary: headline.summary,
    category: headline.category,
    players: headline.players,
    teams: headline.teams,
    tags: headline.tags,
    tagRefs: headline.tagRefs,
    published: headline.published,
    body: headline.body,
    youtubeVideoId: headline.youtubeVideoId,
    videoTitle: headline.videoTitle,
    twitterUrl: headline.twitterUrl,
    twitterTitle: headline.twitterTitle,
    instagramUrl: headline.instagramUrl,
    instagramTitle: headline.instagramTitle,
    tiktokUrl: headline.tiktokUrl,
    tiktokTitle: headline.tiktokTitle,
    priority: headline.priority,
    migratedFrom: headline._id,
  };
}

async function main() {
  const headlines = await fetchHeadlines();
  const articleSlugs = await fetchArticleSlugs();
  console.log(`Found ${headlines.length} headline docs. Existing article slugs: ${articleSlugs.size}`);

  const toCreate = [];
  for (const h of headlines) {
    const slug = h.slug?.current;
    if (!slug) {
      console.warn(`Skipping headline ${h._id}: missing slug`);
      continue;
    }
    if (articleSlugs.has(slug)) {
      console.warn(`Skipping headline ${h._id}: article with slug "${slug}" already exists (${articleSlugs.get(slug)})`);
      continue;
    }
    toCreate.push(buildArticleDoc(h));
  }

  console.log(`Prepared ${toCreate.length} article clones.`);
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
