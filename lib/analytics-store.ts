import fs from 'fs';
import path from 'path';
import { client } from '@/sanity/lib/client';

// Basic file-based analytics store (local dev / low scale). For production, swap with a DB provider.

export interface AnalyticsEventBase {
  type: string;
  articleId: string;
  articleSlug: string;
  articleTitle?: string;
  category?: string;
  author?: string;
  readingTime?: number;
  timestamp: string; // ISO
}

export interface ArticleViewEvent extends AnalyticsEventBase { type: 'article_view'; }
export interface ArticleClickEvent extends AnalyticsEventBase { type: 'article_click'; source?: string; position?: number; }
export interface ReadingProgressEvent extends AnalyticsEventBase { type: 'reading_progress'; progress: number; }

export type AnalyticsEvent = ArticleViewEvent | ArticleClickEvent | ReadingProgressEvent;

const DATA_DIR = path.join(process.cwd(), 'data', 'analytics');
const EVENTS_FILE = path.join(DATA_DIR, 'events.ndjson');
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB rotate threshold
const ROTATION_CHECK_EVERY_WRITES = 25;

const fsPromises = fs.promises;
let writesSinceRotationCheck = 0;
let ensuredDir = false;

async function ensureDir() {
  if (ensuredDir) return;
  await fsPromises.mkdir(DATA_DIR, { recursive: true });
  ensuredDir = true;
}

export async function appendEvent(event: AnalyticsEvent) {
  try {
    await ensureDir();

    writesSinceRotationCheck += 1;
    if (writesSinceRotationCheck >= ROTATION_CHECK_EVERY_WRITES) {
      writesSinceRotationCheck = 0;
      try {
        const stats = await fsPromises.stat(EVENTS_FILE);
        if (stats.size > MAX_FILE_BYTES) {
          const rotated = path.join(DATA_DIR, `events-${Date.now()}.ndjson`);
          await fsPromises.rename(EVENTS_FILE, rotated);
        }
      } catch (error) {
        const code = (error as NodeJS.ErrnoException).code;
        if (code !== 'ENOENT') throw error;
      }
    }

    await fsPromises.appendFile(EVENTS_FILE, JSON.stringify(event) + '\n');
  } catch (err) {
    console.error('appendEvent failed', err);
  }
}

export interface AggregatedArticle {
  articleId: string;
  articleSlug: string;
  articleTitle?: string;
  category?: string;
  author?: string;
  views: number;
  firstViewAt?: string;
  lastViewAt?: string;
  publishedAt?: string;
  indexLatencyMs?: number;
}

export async function readEvents(sinceISO?: string): Promise<AnalyticsEvent[]> {
  try {
    if (!fs.existsSync(EVENTS_FILE)) return [];
    const since = sinceISO ? new Date(sinceISO).getTime() : 0;
    const lines = fs.readFileSync(EVENTS_FILE, 'utf-8').split('\n').filter(Boolean);
    return lines.map(l => JSON.parse(l) as AnalyticsEvent).filter(e => new Date(e.timestamp).getTime() >= since);
  } catch (err) {
    console.error('readEvents failed', err);
    return [];
  }
}

export async function aggregateLast7Days() {
  const now = Date.now();
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
  const prevSevenStart = new Date(now - 14 * 24 * 60 * 60 * 1000).toISOString();
  const events7 = await readEvents(sevenDaysAgo);
  const eventsPrev = await readEvents(prevSevenStart); // includes last14; we'll slice out prev window

  const prevWindowEvents = eventsPrev.filter(e => new Date(e.timestamp).getTime() < new Date(sevenDaysAgo).getTime());

  // Top articles by views
  const articleMap = new Map<string, AggregatedArticle>();
  for (const e of events7) {
    if (e.type !== 'article_view') continue;
    const a = articleMap.get(e.articleId) || {
      articleId: e.articleId,
      articleSlug: e.articleSlug,
      articleTitle: e.articleTitle,
      category: e.category,
      author: e.author,
      views: 0,
      firstViewAt: e.timestamp,
      lastViewAt: e.timestamp
    };
    a.views += 1;
    if (new Date(e.timestamp) < new Date(a.firstViewAt!)) a.firstViewAt = e.timestamp;
    if (new Date(e.timestamp) > new Date(a.lastViewAt!)) a.lastViewAt = e.timestamp;
    articleMap.set(e.articleId, a);
  }
  let topArticles = Array.from(articleMap.values()).sort((a,b)=> b.views - a.views).slice(0,20);

  // Fetch publishedAt for index latency
  if (topArticles.length) {
    const ids = topArticles.map(a => a.articleId);
    // Fetch headline or fantasy docs
    const query = `*[_id in $ids]{ _id, publishedAt, _createdAt }`;
    const published = await client.fetch<{_id:string; publishedAt?: string; _createdAt: string}[]>(query, { ids });
    const mapPub = new Map(published.map(p => [p._id, p] as const));
    topArticles = topArticles.map(a => {
      const meta = mapPub.get(a.articleId);
      if (meta) {
        const pub = meta.publishedAt || meta._createdAt;
        a.publishedAt = pub;
        if (pub && a.firstViewAt) {
          a.indexLatencyMs = new Date(a.firstViewAt).getTime() - new Date(pub).getTime();
        }
      }
      return a;
    });
  }

  // Rising topics: category counts current vs previous window
  const countBy = (evts: AnalyticsEvent[]) => {
    const m = new Map<string, number>();
    for (const e of evts) if (e.type === 'article_view') m.set(e.category || 'unknown', (m.get(e.category || 'unknown')||0)+1);
    return m;
  };
  const curCat = countBy(events7);
  const prevCat = countBy(prevWindowEvents);
  const risingTopics = Array.from(curCat.entries()).map(([cat, cur]) => {
    const prev = prevCat.get(cat) || 0;
    const diff = cur - prev;
    const pct = prev === 0 ? (cur > 0 ? 100 : 0) : (diff / prev) * 100;
    return { category: cat, current: cur, previous: prev, diff, pctChange: pct };
  }).sort((a,b)=> b.pctChange - a.pctChange).slice(0,10);

  // Orphaned new articles: first view within last 14 days with <3 distinct click sources leading to them.
  const clickEvents14 = eventsPrev; // already last 14 days
  const clickSources = new Map<string, Set<string>>();
  for (const e of clickEvents14) {
    if (e.type !== 'article_click') continue;
    const set = clickSources.get(e.articleId) || new Set();
    if ((e as ArticleClickEvent).source) set.add((e as ArticleClickEvent).source!);
    clickSources.set(e.articleId, set);
  }
  const orphaned = topArticles
    .filter(a => (clickSources.get(a.articleId)?.size || 0) < 3)
    .map(a => ({ articleId: a.articleId, slug: a.articleSlug, views: a.views, sources: Array.from(clickSources.get(a.articleId)||[]) }));

  return { topArticles, risingTopics, orphaned, generatedAt: new Date().toISOString() };
}
