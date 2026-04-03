import { createClient } from '@sanity/client';
import { client as readClient } from '@/sanity/lib/client';
import { apiVersion, dataset, projectId } from '@/sanity/env';
import { postTweet, isTwitterConfigured } from '@/lib/twitter';
import { SITE_URL } from '@/lib/site-config';

const SANITY_WRITE_TOKEN = process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_WRITE_TOKEN;

const writeClient = SANITY_WRITE_TOKEN
  ? createClient({
      projectId,
      dataset,
      apiVersion,
      token: SANITY_WRITE_TOKEN,
      useCdn: false,
      perspective: 'published',
    })
  : null;

type SupportedDocType = 'article' | 'headline' | 'fantasyFootball' | 'rankings';

type SocialDoc = {
  _id: string;
  _type: SupportedDocType;
  title?: string | null;
  homepageTitle?: string | null;
  summary?: string | null;
  slug?: { current?: string | null } | null;
  category?: { title?: string | null } | null;
  author?: { name?: string | null } | null;
  autoPostToX?: boolean | null;
  xPostCustomText?: string | null;
  xPostStatus?: string | null;
  xPostText?: string | null;
  xPostUrl?: string | null;
  xPostedAt?: string | null;
  xPostError?: string | null;
  format?: string | null;
  rankingType?: string | null;
  seasonYear?: number | null;
  weekNumber?: number | null;
  playoffRound?: string | null;
  tags?: (string | null)[] | null;
};

export type XAutopostResult = {
  ok: boolean;
  dryRun?: boolean;
  skipped?: boolean;
  reason?: string;
  error?: string;
  text?: string;
  tweetId?: string;
  tweetUrl?: string;
  articleUrl?: string;
  docId?: string;
  docType?: SupportedDocType;
  writeBack?: boolean;
};

const SOCIAL_QUERY = `*[
  _id == $id
  && _type in ["article", "headline", "fantasyFootball", "rankings"]
  && coalesce(published, false) == true
][0]{
  _id,
  _type,
  title,
  homepageTitle,
  summary,
  slug,
  category->{title},
  author->{name},
  autoPostToX,
  xPostCustomText,
  xPostStatus,
  xPostText,
  xPostUrl,
  xPostedAt,
  xPostError,
  format,
  rankingType,
  seasonYear,
  weekNumber,
  playoffRound,
  "tags": coalesce(tagRefs[]->title, tags[])
}`;

function cleanId(id: string) {
  return id.replace(/^drafts\./, '');
}

function firstSentence(text: string) {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return '';

  const sentenceMatch = normalized.match(/^(.{1,180}?[.!?])(\s|$)/);
  if (sentenceMatch?.[1]) return sentenceMatch[1].trim();

  if (normalized.length <= 180) return normalized;
  return `${normalized.slice(0, 177).trimEnd()}...`;
}

function truncateAtWord(text: string, max: number) {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized.length <= max) return normalized;
  const sliced = normalized.slice(0, Math.max(0, max - 1));
  const lastSpace = sliced.lastIndexOf(' ');
  const trimmed = lastSpace > 80 ? sliced.slice(0, lastSpace) : sliced;
  return `${trimmed.trimEnd()}…`;
}

function buildArticlePath(doc: SocialDoc) {
  const slug = doc.slug?.current?.trim();
  if (!slug) return null;

  if (doc._type === 'fantasyFootball') {
    return `/fantasy/${encodeURIComponent(slug)}`;
  }

  if (doc._type === 'article' && doc.format === 'powerRankings') {
    if (doc.rankingType === 'live' || !doc.rankingType) {
      return '/articles/power-rankings';
    }

    const season = doc.seasonYear || new Date().getFullYear();
    const weekPart = typeof doc.weekNumber === 'number'
      ? `week-${doc.weekNumber}`
      : doc.playoffRound?.toLowerCase();

    if (weekPart) {
      return `/articles/power-rankings/${season}/${weekPart}`;
    }

    return '/articles/power-rankings';
  }

  return `/articles/${encodeURIComponent(slug)}`;
}

function buildArticleUrl(doc: SocialDoc) {
  const path = buildArticlePath(doc);
  if (!path) return null;

  const url = new URL(path, SITE_URL);
  const slug = doc.slug?.current?.trim();
  url.searchParams.set('utm_source', 'x');
  url.searchParams.set('utm_medium', 'social');
  url.searchParams.set('utm_campaign', 'autopost');
  if (slug) url.searchParams.set('utm_content', slug);
  return url.toString();
}

function buildAutopostText(doc: SocialDoc, articleUrl: string) {
  if (doc.xPostCustomText?.trim()) {
    return truncateAtWord(`${doc.xPostCustomText.trim()}\n\n${articleUrl}`, 280);
  }

  const primary = (doc.homepageTitle || doc.title || '').trim();
  const summary = doc.summary ? firstSentence(doc.summary) : '';
  const summaryNeedsInclusion = summary && !primary.toLowerCase().includes(summary.toLowerCase());
  const body = [primary, summaryNeedsInclusion ? summary : ''].filter(Boolean).join('\n\n');
  return truncateAtWord(`${body}\n\n${articleUrl}`, 280);
}

async function writeAutopostState(docId: string, set: Record<string, unknown>, unset: string[] = []) {
  if (!writeClient) return false;
  let patch = writeClient.patch(docId).set(set);
  if (unset.length > 0) patch = patch.unset(unset);
  await patch.commit({ autoGenerateArrayKeys: false });
  return true;
}

export async function autopostDocumentToX(args: {
  id: string;
  force?: boolean;
  dryRun?: boolean;
}) : Promise<XAutopostResult> {
  const id = cleanId(args.id);
  const doc = await readClient
    .withConfig({ useCdn: false })
    .fetch<SocialDoc | null>(SOCIAL_QUERY, { id });

  if (!doc) {
    return { ok: false, skipped: true, reason: 'not-found-or-not-published', docId: id };
  }

  if (doc.autoPostToX === false && !args.force) {
    const writeBack = await writeAutopostState(id, { xPostStatus: 'disabled' }, ['xPostError']);
    return { ok: true, skipped: true, reason: 'disabled', docId: id, docType: doc._type, writeBack };
  }

  if (doc.xPostUrl && !args.force) {
    return {
      ok: true,
      skipped: true,
      reason: 'already-posted',
      tweetUrl: doc.xPostUrl,
      docId: id,
      docType: doc._type,
      writeBack: !!writeClient,
    };
  }

  const articleUrl = buildArticleUrl(doc);
  if (!articleUrl) {
    const writeBack = await writeAutopostState(id, { xPostStatus: 'error', xPostError: 'Missing canonical article URL.' });
    return {
      ok: false,
      error: 'Missing canonical article URL.',
      docId: id,
      docType: doc._type,
      writeBack,
    };
  }

  const text = buildAutopostText(doc, articleUrl);

  if (!isTwitterConfigured() && !args.dryRun) {
    const writeBack = await writeAutopostState(
      id,
      { xPostStatus: 'pendingConfig', xPostText: text },
      ['xPostError'],
    );
    return {
      ok: true,
      dryRun: true,
      skipped: true,
      reason: 'missing-x-config',
      text,
      articleUrl,
      docId: id,
      docType: doc._type,
      writeBack,
    };
  }

  const result = await postTweet({
    title: doc.title || doc.homepageTitle || 'New on The Snap',
    url: articleUrl,
    category: doc.category?.title || null,
    author: doc.author?.name || null,
    tags: Array.isArray(doc.tags) ? doc.tags.filter((tag): tag is string => Boolean(tag)).slice(0, 3) : [],
    dryRun: args.dryRun,
    textOverride: text,
  });

  if (!result.ok) {
    const writeBack = await writeAutopostState(
      id,
      { xPostStatus: 'error', xPostError: result.error || 'Unknown X posting error.', xPostText: result.text || text },
    );
    return {
      ok: false,
      error: result.error || 'Unknown X posting error.',
      text: result.text || text,
      articleUrl,
      docId: id,
      docType: doc._type,
      writeBack,
    };
  }

  if (result.dryRun) {
    const writeBack = await writeAutopostState(
      id,
      { xPostStatus: 'dryRun', xPostText: result.text || text },
      ['xPostError'],
    );
    return {
      ok: true,
      dryRun: true,
      text: result.text || text,
      articleUrl,
      docId: id,
      docType: doc._type,
      writeBack,
    };
  }

  const writeBack = await writeAutopostState(
    id,
    {
      xPostStatus: 'posted',
      xPostText: result.text || text,
      xPostUrl: result.url || null,
      xPostedAt: new Date().toISOString(),
    },
    ['xPostError'],
  );

  return {
    ok: true,
    text: result.text || text,
    tweetId: result.id,
    tweetUrl: result.url,
    articleUrl,
    docId: id,
    docType: doc._type,
    writeBack,
  };
}
