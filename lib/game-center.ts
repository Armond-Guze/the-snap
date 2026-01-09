import {
  EnrichedGame,
  TEAM_META,
  bucketLabelFor,
  computeRevalidate,
  getGameById,
  isPrimetimeGame,
} from '@/lib/schedule';
import { client } from '@/sanity/lib/client';
import { urlFor } from '@/sanity/lib/image';
import { SanityImageSource } from '@sanity/image-url/lib/types/types';

export type GameCenterTone = 'scheduled' | 'live' | 'final';
export type GameCenterInsightTag = 'Storyline' | 'Fantasy' | 'Trend' | 'Sponsor';
const VALID_INSIGHT_TAGS: GameCenterInsightTag[] = ['Storyline', 'Fantasy', 'Trend', 'Sponsor'];

export interface GameCenterHeroData {
  title: string;
  subtitle: string;
  statusLabel: string;
  statusTone: GameCenterTone;
  kickoffLabel: string;
  detailLabel: string;
  backgroundImageUrl?: string;
  sponsorPanel?: GameCenterSponsorPanel;
  scoreboard: {
    home: GameCenterTeamCard;
    away: GameCenterTeamCard;
  };
}

export interface GameCenterSponsorPanel {
  label?: string;
  logoUrl?: string;
  ctaText?: string;
  ctaUrl?: string;
  backgroundHex?: string;
}

export interface GameCenterTeamCard {
  abbr: string;
  name: string;
  logo?: string;
  score?: number;
  recordHint?: string;
}

export interface GameCenterInsight {
  id: string;
  tag: GameCenterInsightTag;
  title: string;
  body: string;
}

export interface GameCenterTimelineEntry {
  id: string;
  label: string;
  detail: string;
  status: 'upcoming' | 'live' | 'complete';
}

export interface GameCenterArticleLink {
  id: string;
  title: string;
  href: string;
  typeLabel: string;
}

export interface GameCenterPayload {
  game: EnrichedGame;
  hero: GameCenterHeroData;
  insights: GameCenterInsight[];
  timeline: GameCenterTimelineEntry[];
  curatedArticles: GameCenterArticleLink[];
  meta: {
    pageTitle: string;
    description: string;
  };
}

export async function buildGameCenterPayload(gameId: string): Promise<GameCenterPayload | null> {
  const game = await resolveGame(gameId);
  if (!game) return null;

  let hero = buildHero(game);
  let insights = buildInsights(game);
  const timeline = buildTimeline(game);

  const settings = await fetchGameCenterSettings(game.gameId);
  if (settings) {
    hero = applyHeroOverrides(hero, settings);
    insights = mergeInsightsWithOverrides(insights, settings);
  }
  const curatedArticles = settings ? buildCuratedArticles(settings) : [];
  const meta = buildMeta(game, hero);

  return { game, hero, insights, timeline, curatedArticles, meta };
}

const GAME_CENTER_SETTINGS_QUERY = `
  *[_type == "gameCenterSettings" && gameId == $gameId][0]{
    _id,
    heroTitle,
    heroSubtitle,
    heroStatusLabel,
    heroBackground,
    sponsorPanel{
      label,
      ctaText,
      ctaUrl,
      backgroundHex,
      logo
    },
    insightMode,
    customInsights[]{
      _key,
      tag,
      title,
      body
    },
    curatedArticles[]->{
      _id,
      _type,
      title,
      slug
    }
  }
`;

type InsightMode = 'replace' | 'append';

interface SanityGameCenterSettings {
  _id: string;
  heroTitle?: string;
  heroSubtitle?: string;
  heroStatusLabel?: string;
  heroBackground?: SanityImageSource;
  sponsorPanel?: SanitySponsorPanel;
  insightMode?: InsightMode;
  customInsights?: SanityInsight[];
  curatedArticles?: SanityArticleDoc[];
}

interface SanitySponsorPanel {
  label?: string;
  ctaText?: string;
  ctaUrl?: string;
  backgroundHex?: string;
  logo?: SanityImageSource;
}

interface SanityInsight {
  _key?: string;
  tag?: GameCenterInsightTag;
  title?: string;
  body?: string;
}

interface SanityArticleDoc {
  _id: string;
  _type: string;
  title?: string;
  slug?: { current?: string };
}

async function fetchGameCenterSettings(gameId: string): Promise<SanityGameCenterSettings | null> {
  if (!gameId) return null;
  try {
    return await client.fetch<SanityGameCenterSettings | null>(GAME_CENTER_SETTINGS_QUERY, { gameId });
  } catch (err) {
    console.warn('fetchGameCenterSettings failed', err);
    return null;
  }
}

async function resolveGame(gameId: string): Promise<EnrichedGame | null> {
  const fromSchedule = await getGameById(gameId);
  if (fromSchedule) return fromSchedule;
  if (/^\d+$/.test(gameId)) {
    return await fetchGameFromESPN(gameId);
  }
  return null;
}

async function fetchGameFromESPN(eventId: string): Promise<EnrichedGame | null> {
  try {
    const url = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event=${eventId}`;
    const res = await fetch(url, { next: { revalidate: computeRevalidate() } });
    if (!res.ok) return null;
    type Competitor = {
      homeAway?: 'home' | 'away';
      score?: string;
      team?: { abbreviation?: string; displayName?: string };
      records?: { summary?: string }[];
    };
    type Competition = {
      date?: string;
      venue?: { fullName?: string };
      broadcasts?: { names?: string[] }[];
      competitors?: Competitor[];
      status?: { type?: { name?: string }; period?: number; displayClock?: string };
    };
    interface SummaryResponse {
      header?: {
        week?: { number?: number };
        season?: { year?: number };
        competitions?: Competition[];
      };
    }
    const json = (await res.json()) as SummaryResponse;
    const competition = json.header?.competitions?.[0];
    if (!competition) return null;
    const home = competition.competitors?.find((c) => c.homeAway === 'home');
    const away = competition.competitors?.find((c) => c.homeAway === 'away');
    if (!home?.team?.abbreviation || !away?.team?.abbreviation) return null;
    const statusName = competition.status?.type?.name || 'STATUS_SCHEDULED';
    let mappedStatus: EnrichedGame['status'] = 'SCHEDULED';
    if (statusName === 'STATUS_IN_PROGRESS') mappedStatus = 'IN_PROGRESS';
    else if (statusName === 'STATUS_FINAL') mappedStatus = 'FINAL';

    const hasScores = home.score !== undefined && away.score !== undefined;

    return {
      gameId: eventId,
      week: json.header?.week?.number || 1,
      dateUTC: competition.date || new Date().toISOString(),
      home: home.team.abbreviation,
      away: away.team.abbreviation,
      network: competition.broadcasts?.[0]?.names?.[0],
      venue: competition.venue?.fullName,
      status: mappedStatus,
      quarter: competition.status?.period ? `Q${competition.status.period}` : undefined,
      clock: competition.status?.displayClock || undefined,
      scores: hasScores
        ? {
            home: Number(home.score || 0),
            away: Number(away.score || 0),
          }
        : undefined,
    };
  } catch (err) {
    console.warn('Failed to fetch ESPN summary for', eventId, err);
    return null;
  }
}

function applyHeroOverrides(hero: GameCenterHeroData, settings: SanityGameCenterSettings): GameCenterHeroData {
  const next: GameCenterHeroData = { ...hero };
  if (settings.heroTitle) next.title = settings.heroTitle;
  if (settings.heroSubtitle) next.subtitle = settings.heroSubtitle;
  if (settings.heroStatusLabel) next.statusLabel = settings.heroStatusLabel;
  if (settings.heroBackground) {
    next.backgroundImageUrl = urlFor(settings.heroBackground).width(1600).height(900).fit('crop').quality(75).url();
  }
  const sponsor = buildSponsorPanel(settings.sponsorPanel);
  if (sponsor) next.sponsorPanel = sponsor;
  return next;
}

function mergeInsightsWithOverrides(
  defaultInsights: GameCenterInsight[],
  settings: SanityGameCenterSettings,
): GameCenterInsight[] {
  const custom = (settings.customInsights || [])
    .map((entry, idx) => createCustomInsight(entry, idx))
    .filter((entry): entry is GameCenterInsight => Boolean(entry));
  if (!custom.length) return defaultInsights;
  return settings.insightMode === 'append' ? [...custom, ...defaultInsights] : custom;
}

function createCustomInsight(doc: SanityInsight, idx: number): GameCenterInsight | null {
  const title = doc.title?.trim();
  const body = doc.body?.trim();
  if (!title || !body) return null;
  const tag = VALID_INSIGHT_TAGS.includes(doc.tag as GameCenterInsightTag)
    ? (doc.tag as GameCenterInsightTag)
    : 'Storyline';
  return {
    id: `custom-${doc._key || idx}`,
    tag,
    title,
    body,
  };
}

function buildCuratedArticles(settings: SanityGameCenterSettings): GameCenterArticleLink[] {
  const docs = settings.curatedArticles || [];
  const links: GameCenterArticleLink[] = [];
  docs.forEach((doc) => {
    const href = buildArticleHref(doc);
    if (!href) return;
    links.push({
      id: doc._id,
      title: doc.title || 'Featured story',
      href,
      typeLabel: articleTypeLabel(doc._type),
    });
  });
  return links;
}

function buildSponsorPanel(panel?: SanitySponsorPanel): GameCenterSponsorPanel | undefined {
  if (!panel) return undefined;
  const hasContent = panel.label || panel.ctaText || panel.ctaUrl || panel.backgroundHex || panel.logo;
  if (!hasContent) return undefined;
  return {
    label: panel.label,
    ctaText: panel.ctaText,
    ctaUrl: panel.ctaUrl || undefined,
    backgroundHex: panel.backgroundHex,
    logoUrl: panel.logo ? urlFor(panel.logo).width(320).height(320).fit('max').quality(80).url() : undefined,
  };
}

function buildArticleHref(doc: SanityArticleDoc): string | null {
  const slug = doc.slug?.current;
  if (!slug) return null;
  switch (doc._type) {
    case 'headline':
      return `/headlines/${slug}`;
    case 'fantasyFootball':
      return `/fantasy/${slug}`;
    case 'article':
      return `/articles/${slug}`;
    case 'rankings':
      return `/articles/${slug}`;
    default:
      return null;
  }
}

function articleTypeLabel(type: string): string {
  switch (type) {
    case 'headline':
      return 'Headline';
    case 'fantasyFootball':
      return 'Fantasy';
    case 'article':
      return 'Article';
    case 'rankings':
      return 'Article';
    default:
      return 'Feature';
  }
}

function buildHero(game: EnrichedGame): GameCenterHeroData {
  const homeMeta = TEAM_META[game.home] || { name: game.home, logo: undefined };
  const awayMeta = TEAM_META[game.away] || { name: game.away, logo: undefined };
  const kickoffLabel = formatKickoff(game.dateUTC);
  const detailLabel = [game.network, game.venue].filter(Boolean).join(' • ');
  const status = deriveStatus(game);

  return {
    title: `${awayMeta.name} at ${homeMeta.name}`,
    subtitle: `Week ${game.week} • ${bucketLabelFor(game)}`,
    statusLabel: status.label,
    statusTone: status.tone,
    kickoffLabel,
    detailLabel,
    scoreboard: {
      home: { abbr: game.home, name: homeMeta.name, logo: homeMeta.logo, score: game.scores?.home },
      away: { abbr: game.away, name: awayMeta.name, logo: awayMeta.logo, score: game.scores?.away },
    },
  };
}

function buildInsights(game: EnrichedGame): GameCenterInsight[] {
  const homeMeta = TEAM_META[game.home];
  const awayMeta = TEAM_META[game.away];
  const kickoff = formatKickoff(game.dateUTC);
  const label = bucketLabelFor(game);
  const primetime = isPrimetimeGame(game);

  const insights: GameCenterInsight[] = [
    {
      id: 'window',
      tag: 'Storyline',
      title: `${label} spotlight`,
      body: `${awayMeta?.name || game.away} visit ${homeMeta?.name || game.home} in Week ${game.week}. Kickoff is set for ${kickoff}${game.network ? ` on ${game.network}` : ''}.`,
    },
    {
      id: 'momentum',
      tag: 'Trend',
      title: 'Momentum watch',
      body: `The ${homeMeta?.name || game.home} host a ${primetime ? 'national audience' : 'key conference matchup'}. Keep an eye on scripted drives early — whoever controls the first two possessions often dictates pace.`,
    },
    {
      id: 'fantasy',
      tag: 'Fantasy',
      title: 'Fantasy lens',
      body: `Stack skill players tied to red-zone roles. ${homeMeta?.name || game.home} feature as the home favorite, making their RB/TE options valuable pivots. Monitor inactives 90 minutes before kickoff for final lineup tweaks.`,
    },
  ];

  if (game.status === 'FINAL') {
    insights.unshift({
      id: 'final',
      tag: 'Storyline',
      title: 'Final recap',
      body: `${formatScoreline(game)}. Revisit drive charts and advanced stats below while we package full recap coverage.`,
    });
  } else if (game.status === 'IN_PROGRESS') {
    insights.unshift({
      id: 'live',
      tag: 'Storyline',
      title: 'Live pulse',
      body: `${formatScoreline(game)} with ${game.clock || 'clock ticking'} in ${game.quarter || 'action'}. Bookmark this hub for drive tracking and social heat checks.`,
    });
  }

  return insights;
}

function buildTimeline(game: EnrichedGame): GameCenterTimelineEntry[] {
  const kickoff = new Date(game.dateUTC).getTime();
  const halftime = kickoff + 90 * 60 * 1000;
  const final = kickoff + 3 * 60 * 60 * 1000;

  return [
    {
      id: 'pregame',
      label: 'Pregame Prep',
      detail: 'Inactives drop 90 minutes prior to kickoff. Perfect window to lock fantasy rosters and props.',
      status: determineTimelineStatus(game, kickoff - 90 * 60 * 1000),
    },
    {
      id: 'kickoff',
      label: 'Kickoff',
      detail: formatKickoff(game.dateUTC),
      status: determineTimelineStatus(game, kickoff),
    },
    {
      id: 'halftime',
      label: 'Halftime adjustments',
      detail: 'Expect scripted counters and condensed formations as coordinators settle in.',
      status: determineTimelineStatus(game, halftime),
    },
    {
      id: 'final',
      label: 'Final whistle',
      detail: 'Full recap, fantasy fallout, and social buzz roll in here once the clock hits :00.',
      status: determineTimelineStatus(game, final),
    },
  ];
}

function buildMeta(game: EnrichedGame, hero: GameCenterHeroData): GameCenterPayload['meta'] {
  const score = formatScoreline(game);
  const description = `${hero.title} ${game.status === 'FINAL' ? score : `kicks at ${hero.kickoffLabel}`}. Track live scores, drive summaries, and storylines inside The Snap GameCenter.`;
  return {
    pageTitle: `${hero.title} GameCenter`,
    description,
  };
}

function deriveStatus(game: EnrichedGame): { label: string; tone: GameCenterTone } {
  if (game.status === 'IN_PROGRESS') {
    return { label: `${game.quarter || 'Live'} ${game.clock || ''}`.trim(), tone: 'live' };
  }
  if (game.status === 'FINAL') {
    return { label: 'Final', tone: 'final' };
  }
  const kickoff = new Date(game.dateUTC);
  return { label: `Kickoff ${relativeCountdown(kickoff)}`, tone: 'scheduled' };
}

function relativeCountdown(kickoff: Date): string {
  const diff = kickoff.getTime() - Date.now();
  if (diff <= 0) return 'Today';
  const hours = Math.round(diff / (60 * 60 * 1000));
  if (hours < 24) return `in ${hours}h`;
  const days = Math.round(hours / 24);
  return `in ${days}d`;
}

function formatKickoff(dateUTC: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(dateUTC));
}

function determineTimelineStatus(game: EnrichedGame, ts: number): 'upcoming' | 'live' | 'complete' {
  const now = Date.now();
  if (game.status === 'FINAL' && ts <= now) return 'complete';
  if (game.status === 'IN_PROGRESS' && ts <= now + 10 * 60 * 1000) return 'live';
  if (ts <= now) return 'complete';
  return 'upcoming';
}

function formatScoreline(game: EnrichedGame): string {
  if (!game.scores) return `${game.away} at ${game.home}`;
  const home = `${game.home} ${game.scores.home}`;
  const away = `${game.away} ${game.scores.away}`;
  return game.scores.home > game.scores.away ? `${home} def. ${away}` : `${away} def. ${home}`;
}
