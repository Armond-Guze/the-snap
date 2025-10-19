import { TwitterApi } from 'twitter-api-v2';

export type TweetTemplate = (args: {
  title: string;
  url: string;
  category?: string | null;
  author?: string | null;
  tags?: string[];
}) => string;

// A few rotating templates – keep under 280 chars, leave room for link shortening
const templates: TweetTemplate[] = [
  ({ title, url, category }) => `${title} ${category ? `(${category}) ` : ''}— read more at ${url}`,
  ({ title, url }) => `New on The Snap: ${title} \n\n${url}`,
  ({ title, url, tags }) => {
    const topical = (tags || []).slice(0, 2).map(t => `#${t.replace(/\s+/g, '')}`).join(' ');
    return `${title} ${topical ? `\n${topical}\n` : ''}${url}`.trim();
  },
  ({ title, url, author }) => `${title} — by ${author || 'The Snap'}\n${url}`,
];

function pickTemplate(idx?: number): TweetTemplate {
  if (typeof idx === 'number' && idx >= 0 && idx < templates.length) return templates[idx];
  const i = Math.floor(Math.random() * templates.length);
  return templates[i];
}

function truncateForTweet(text: string, reserve = 30) {
  // Reserve chars for URL + spacing; Twitter shortens links ~23 chars, add buffer
  const limit = 280 - reserve;
  if (text.length <= limit) return text;
  return text.slice(0, Math.max(0, limit - 1)).trimEnd() + '…';
}

export function getTwitterClient() {
  const bearer = process.env.X_BEARER_TOKEN || process.env.TWITTER_BEARER_TOKEN;
  const appKey = process.env.X_API_KEY || process.env.TWITTER_API_KEY;
  const appSecret = process.env.X_API_SECRET || process.env.TWITTER_API_SECRET;
  const accessToken = process.env.X_ACCESS_TOKEN || process.env.TWITTER_ACCESS_TOKEN;
  const accessSecret = process.env.X_ACCESS_SECRET || process.env.TWITTER_ACCESS_SECRET;

  if (bearer) {
    return new TwitterApi(bearer);
  }
  if (appKey && appSecret && accessToken && accessSecret) {
    return new TwitterApi({ appKey, appSecret, accessToken, accessSecret });
  }
  return null;
}

export async function postTweet(args: {
  title: string;
  url: string;
  category?: string | null;
  author?: string | null;
  tags?: string[];
  templateIndex?: number;
  dryRun?: boolean;
}) {
  const { title, url, category, author, tags, templateIndex, dryRun } = args;

  const t = pickTemplate(templateIndex);
  const raw = t({ title: truncateForTweet(title), url, category: category || undefined, author: author || undefined, tags });
  const text = truncateForTweet(raw, 0);

  const client = getTwitterClient();
  if (!client || dryRun) {
    return { ok: true, dryRun: true, text };
  }

  try {
    const res = await client.v2.tweet(text);
    return { ok: true, id: res.data?.id, text };
  } catch (err) {
    return { ok: false, error: (err as Error).message, text };
  }
}
