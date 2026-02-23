import { client } from '@/sanity/lib/client';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { powerRankingsLiveQuery, powerRankingsSnapshotByParamsQuery, powerRankingsSnapshotSlugsQuery } from '@/lib/queries/power-rankings';
import type { HeadlineListItem, MovementIndicator, PageProps, PowerRankingsDoc, PowerRankingEntry } from '@/types';
import Image from 'next/image';
import { PortableText } from '@portabletext/react';
import { portableTextComponents } from '@/lib/portabletext-components';
import Breadcrumb from '@/app/components/Breadcrumb';
import RelatedArticles from '@/app/components/RelatedArticles';
import SocialShare from '@/app/components/SocialShare';
import MostRead from '@/app/components/MostRead';
import { AVATAR_SIZES, ARTICLE_COVER_SIZES } from '@/lib/image-sizes';
import { formatArticleDate } from '@/lib/date-utils';
import { gradientClassForTeam } from '@/lib/team-utils';
import { fetchTeamRecords, shortRecord } from '@/lib/team-records';
import { teamCodeFromName } from '@/lib/team-utils';
import { SITE_URL } from '@/lib/site-config';

const TEAM_COLOR_CLASSES: Record<string, string> = {
  '#97233F': 'text-[#97233F]',
  '#A71930': 'text-[#A71930]',
  '#241773': 'text-[#241773]',
  '#00338D': 'text-[#00338D]',
  '#0085CA': 'text-[#0085CA]',
  '#0B162A': 'text-[#0B162A]',
  '#FB4F14': 'text-[#FB4F14]',
  '#311D00': 'text-[#311D00]',
  '#041E42': 'text-[#041E42]',
  '#0076B6': 'text-[#0076B6]',
  '#203731': 'text-[#203731]',
  '#03202F': 'text-[#03202F]',
  '#002C5F': 'text-[#002C5F]',
  '#006778': 'text-[#006778]',
  '#E31837': 'text-[#E31837]',
  '#000000': 'text-[#000000]',
  '#0080C6': 'text-[#0080C6]',
  '#003594': 'text-[#003594]',
  '#008E97': 'text-[#008E97]',
  '#4F2683': 'text-[#4F2683]',
  '#002244': 'text-[#002244]',
  '#D3BC8D': 'text-[#D3BC8D]',
  '#0B2265': 'text-[#0B2265]',
  '#125740': 'text-[#125740]',
  '#004C54': 'text-[#004C54]',
  '#FFB612': 'text-[#FFB612]',
  '#AA0000': 'text-[#AA0000]',
  '#D50A0A': 'text-[#D50A0A]',
  '#0C2340': 'text-[#0C2340]',
  '#5A1414': 'text-[#5A1414]',
};

const getTeamColorClass = (color?: string | null) => {
  if (!color) return 'text-white';
  const normalized = color.toUpperCase();
  return TEAM_COLOR_CLASSES[normalized] ?? 'text-white';
};

const PLAYOFF_LABELS: Record<string, string> = {
  WC: 'Wild Card',
  DIV: 'Divisional',
  CONF: 'Conference Championship',
  SB: 'Super Bowl',
};

const PLAYOFF_ORDER: string[] = ['WC', 'DIV', 'CONF', 'SB'];

type ParsedWeek =
  | { weekNumber: number; playoffRound?: undefined }
  | { playoffRound: string; weekNumber?: undefined }
  | { invalid: true };

function parseWeekParam(raw: string): ParsedWeek {
  const normalized = raw.toLowerCase();
  if (normalized.startsWith('week-')) {
    const weekNumber = Number(normalized.replace('week-', ''));
    if (Number.isFinite(weekNumber) && weekNumber >= 1 && weekNumber <= 18) {
      return { weekNumber };
    }
  }
  const round = normalized.toUpperCase();
  if (PLAYOFF_ORDER.includes(round)) {
    return { playoffRound: round };
  }
  return { invalid: true };
}

function getPrevPlayoffRound(round?: string | null) {
  if (!round) return null;
  const index = PLAYOFF_ORDER.indexOf(round);
  if (index <= 0) return null;
  return PLAYOFF_ORDER[index - 1];
}

function getMovementIndicator(change: number): MovementIndicator {
  if (change > 0) {
    return { symbol: "▲", color: "text-green-400" };
  } else if (change < 0) {
    return { symbol: "▼", color: "text-red-500" };
  }
  return { symbol: "–", color: "text-gray-400" };
}

export async function generateStaticParams() {
  const slugs: { seasonYear?: number; weekNumber?: number; playoffRound?: string }[] = await client.fetch(powerRankingsSnapshotSlugsQuery);
  return slugs
    .map((s) => {
      if (!s?.seasonYear) return null;
      if (typeof s.weekNumber === 'number') {
        return { season: String(s.seasonYear), week: `week-${s.weekNumber}` };
      }
      if (s.playoffRound) {
        return { season: String(s.seasonYear), week: s.playoffRound.toLowerCase() };
      }
      return null;
    })
    .filter(Boolean) as Array<{ season: string; week: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { season: seasonParam, week } = await params;
  const season = Number(seasonParam);
  const parsed = parseWeekParam(week);
  if (!Number.isFinite(season) || 'invalid' in parsed) {
    return { title: 'NFL Power Rankings', description: 'Weekly NFL power rankings.' };
  }
  const weekLabel = parsed.weekNumber ? `Week ${parsed.weekNumber}` : PLAYOFF_LABELS[parsed.playoffRound || ''] || 'Playoffs';
  const title = `NFL Power Rankings ${season} — ${weekLabel}: Full 1–32, Movers & Notes`;
  const description = `Complete ${weekLabel} NFL Power Rankings for ${season}. See team movement from last week and quick notes for all 32 teams.`;
  const baseUrl = SITE_URL;
  const canonical = `${baseUrl}/articles/power-rankings/${season}/${week}`;
  const ogImage = `${baseUrl}/api/og?${new URLSearchParams({
    title,
    subtitle: description,
    category: 'Power Rankings',
    date: `${season} ${weekLabel}`,
  }).toString()}`;
  return {
    title,
    description,
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph: { title, description, url: canonical, images: [{ url: ogImage }], type: 'article' },
    twitter: { card: 'summary_large_image', title, description, images: [ogImage] },
  };
}

export const revalidate = 300;

export default async function RankingsWeekPage({ params }: PageProps) {
  const { season: seasonParam, week } = await params;
  const season = Number(seasonParam);
  const parsed = parseWeekParam(week);
  if (!Number.isFinite(season) || 'invalid' in parsed) {
    notFound();
  }

  const [data, liveDoc, otherContent] = await Promise.all([
    client.fetch<PowerRankingsDoc | null>(powerRankingsSnapshotByParamsQuery, {
      season,
      week: parsed.weekNumber ?? null,
      playoffRound: parsed.playoffRound ?? null,
    }),
    client.fetch<PowerRankingsDoc | null>(powerRankingsLiveQuery),
    client.fetch<HeadlineListItem[]>(
      `*[(_type in ["unifiedContent", "headline", "powerRanking", "article", "rankings"]) && published == true] | order(_createdAt desc)[0...8]{
        _id,
        _type,
        title,
        homepageTitle,
        slug,
        excerpt,
        date,
        publishedAt,
        contentType,
        week,
        format,
        rankingType,
        seasonYear,
        weekNumber,
        playoffRound,
        author-> { name },
        featuredImage { asset->{ url } },
        coverImage { asset->{ url } },
        image { asset->{ url } }
      }`
    )
  ]);

  if (!data) {
    return <div className="max-w-5xl mx-auto px-4 py-12 text-white">No snapshot found for {week} — {season} yet.</div>;
  }

  const records = await fetchTeamRecords(season);

  const prevSnapshot: PowerRankingsDoc | null = await client.fetch(powerRankingsSnapshotByParamsQuery, {
    season,
    week: parsed.weekNumber ? parsed.weekNumber - 1 : null,
    playoffRound: parsed.playoffRound ? getPrevPlayoffRound(parsed.playoffRound) : null,
  });

  const prevMap = new Map(
    (prevSnapshot?.rankings || []).map((entry) => [entry.teamAbbr || entry.teamName || entry.team?.title || '', entry.rank])
  );

  const weekLabel = parsed.weekNumber ? `Week ${parsed.weekNumber}` : PLAYOFF_LABELS[data.playoffRound || ''] || 'Playoffs';
  const published = data.publishedAt || data.date || liveDoc?.publishedAt || liveDoc?.date;
  const displayTitle = data.title || liveDoc?.title || `NFL Power Rankings ${season} — ${weekLabel}`;
  const displaySummary = data.summary || liveDoc?.summary;
  const displayCover = data.coverImage || liveDoc?.coverImage;
  const displayAuthor = data.author || liveDoc?.author;
  const displayIntro = (Array.isArray(data.rankingIntro) && data.rankingIntro.length > 0 ? data.rankingIntro : liveDoc?.rankingIntro) || [];
  const displayConclusion = (Array.isArray(data.rankingConclusion) && data.rankingConclusion.length > 0 ? data.rankingConclusion : liveDoc?.rankingConclusion) || [];
  const biggestRiser = data.biggestRiser || liveDoc?.biggestRiser;
  const biggestFaller = data.biggestFaller || liveDoc?.biggestFaller;
  const shareUrl = `${SITE_URL}/articles/power-rankings/${season}/${week}`;
  const breadcrumbItems = [
    { label: 'Articles', href: '/articles' },
    { label: 'Power Rankings', href: '/articles/power-rankings' },
    { label: `${season} ${weekLabel}` }
  ];

  return (
    <>
    <main className="bg-[hsl(0_0%_3.9%)] text-white min-h-screen">
      <div className="px-6 md:px-12 py-10 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12">
        <article className="lg:col-span-2 flex flex-col">
          <div className="hidden sm:block">
            <Breadcrumb items={breadcrumbItems} className="mb-4" />
          </div>
          <header className="mb-10">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold leading-tight text-white mb-3 md:mb-4 text-left">{displayTitle}</h1>
            <div className="text-[13px] sm:text-sm text-gray-400 mb-6 flex items-center gap-3 text-left flex-wrap">
              {displayAuthor?.image?.asset?.url && (
                <div className="relative w-8 h-8 rounded-full overflow-hidden">
                  <Image
                    src={displayAuthor.image.asset.url}
                    alt={(displayAuthor.image as { alt?: string })?.alt || displayAuthor?.name || 'Author'}
                    fill
                    sizes={AVATAR_SIZES}
                    className="object-cover"
                  />
                </div>
              )}
              <span className="font-medium text-white/90">
                {displayAuthor?.name || 'The Snap'}
              </span>
              {published && (
                <>
                  <span>• {formatArticleDate(published)}</span>
                  <span className="text-gray-500 hidden sm:inline">•</span>
                </>
              )}
              <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white">Power Rankings</span>
            </div>
          </header>

	          {displayCover?.asset?.url && (
            <div className="w-full mb-6">
              <div className="relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] h-[240px] sm:h-[350px] md:h-[500px] overflow-hidden rounded-none md:rounded-md shadow-sm md:w-full md:left-0 md:right-0 md:ml-0 md:mr-0">
                <Image
                  src={displayCover.asset.url}
                  alt={(displayCover as { alt?: string })?.alt || displayTitle}
                  fill
                  sizes={ARTICLE_COVER_SIZES}
                  className="object-cover w-full h-full"
                  priority
                />
              </div>
              {displaySummary && (
                <p className="mt-4 text-lg text-gray-300 leading-relaxed max-w-3xl">
                  {displaySummary}
                </p>
              )}
            </div>
	          )}

          {(biggestRiser || biggestFaller) && (
            <div className="mb-8 flex flex-wrap gap-3">
              {biggestRiser && (
                <span className="inline-flex items-center rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-300">
                  Biggest Riser: {biggestRiser}
                </span>
              )}
              {biggestFaller && (
                <span className="inline-flex items-center rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-300">
                  Biggest Faller: {biggestFaller}
                </span>
              )}
            </div>
          )}

          {Array.isArray(displayIntro) && displayIntro.length > 0 && (
            <section className="mb-10 prose prose-invert text-white text-lg leading-relaxed max-w-4xl text-left">
              <PortableText value={displayIntro} components={portableTextComponents} />
            </section>
          )}

	          <div className="space-y-12">
            {(data.rankings || [])
              .slice()
              .sort((a, b) => a.rank - b.rank)
              .map((team: PowerRankingEntry, index: number) => {
                const rank = team.rank;
                const teamName = team.teamName || team.team?.title || '';
                const teamLogo = team.teamLogo;
                const teamNameClass = getTeamColorClass(team.teamColor);
	                const key = `${team.teamAbbr || teamName}-${rank}-${index}`;
	                const prevRank =
	                  typeof team.previousRank === 'number'
	                    ? team.previousRank
                    : typeof team.prevRankOverride === 'number'
                      ? team.prevRankOverride
	                    : prevMap.get(team.teamAbbr || teamName || team.team?.title || '');
	                const change = typeof team.movement === 'number'
                    ? team.movement
	                  : typeof team.movementOverride === 'number'
	                    ? team.movementOverride
	                  : typeof prevRank === 'number'
	                    ? prevRank - rank
	                    : 0;
                const movement = getMovementIndicator(change);

                return (
                  <article key={key} className="group">
                    <div className="relative bg-[hsl(0_0%_3.9%)] p-3">
                      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-full ${gradientClassForTeam(teamName)}`} />

                      <div className="flex items-center gap-4">
                        <div className="flex flex-col items-center min-w-[60px] bg-[hsl(0_0%_3.9%)] rounded-lg p-2">
                          <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Rank</span>
                          <span className="text-2xl font-black text-white">{rank}</span>
                        </div>

                        {teamLogo?.asset?.url && (
                          <div className="flex-shrink-0">
                            <Image
                              src={teamLogo.asset.url}
                              alt={(teamLogo as { alt?: string })?.alt || `${teamName} logo`}
                              width={60}
                              height={60}
                              className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-contain"
                              priority={rank <= 5}
                            />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="flex flex-col items-start">
                              <h2 className={`text-xl sm:text-2xl font-bold truncate ${teamNameClass}`}>{teamName}</h2>
                              {(() => {
                                const abbr = team.teamAbbr || teamCodeFromName(teamName);
                                const rec = shortRecord(abbr ? records.get(abbr) : undefined);
                                return rec ? (<span className="text-xs text-white/60 mt-0.5">{rec}</span>) : null;
                              })()}
                            </div>

                            <div className="flex flex-col items-center min-w-[50px] rounded-lg p-2">
                              <span className={`text-lg font-bold ${movement.color}`}>
                                {movement.symbol}
                              </span>
                              {change !== 0 ? (
                                <span className={`text-xs font-semibold ${movement.color}`}>
                                  {Math.abs(change)}
                                </span>
                              ) : (
                                <span className="text-xs text-gray-400">—</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 bg-[hsl(0_0%_3.9%)] p-6">
                      {Array.isArray(team.analysis) && team.analysis.length > 0 && (
                        <div className="prose prose-invert text-white text-lg leading-relaxed max-w-4xl text-left">
                          <PortableText value={team.analysis} components={portableTextComponents} />
                        </div>
                      )}
	                      {(!Array.isArray(team.analysis) || team.analysis.length === 0) && (team.summary || team.note) && (
	                        <p className="text-lg text-gray-300 leading-relaxed max-w-4xl text-left">{team.summary || team.note}</p>
	                      )}
	                    </div>
	                  </article>
	                );
	              })}
	          </div>

          {Array.isArray(displayConclusion) && displayConclusion.length > 0 && (
            <section className="mt-12 prose prose-invert text-white text-lg leading-relaxed max-w-4xl text-left">
              <PortableText value={displayConclusion} components={portableTextComponents} />
            </section>
          )}
	        </article>

        <aside className="space-y-8 lg:sticky lg:top-24 self-start">
          <MostRead />
          <RelatedArticles currentSlug={data.slug?.current || 'power-rankings'} articles={otherContent} />
        </aside>
      </div>
    </main>
    <div className="px-6 md:px-12 pb-12 max-w-7xl mx-auto">
      <SocialShare url={shareUrl} title={displayTitle} description={displaySummary || ''} variant="compact" />
    </div>
    </>
  );
}
