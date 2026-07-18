import { PortableText } from '@portabletext/react';
import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import Breadcrumb from '@/app/components/Breadcrumb';
import StructuredData from '@/app/components/StructuredData';
import { ARTICLE_COVER_SIZES } from '@/lib/image-sizes';
import {
  powerRankingsLatestSnapshotForSeasonQuery,
  powerRankingsLatestSnapshotQuery,
  powerRankingsLiveQuery,
  powerRankingsSnapshotByParamsQuery,
  powerRankingsSnapshotSlugsQuery,
} from '@/lib/queries/power-rankings';
import { portableTextComponents } from '@/lib/portabletext-components';
import { getActiveSeason } from '@/lib/season';
import { SITE_URL } from '@/lib/site-config';
import { teamNameFromCode } from '@/lib/team-utils';
import { client } from '@/sanity/lib/client';
import type { PowerRankingEntry, PowerRankingsDoc } from '@/types';

export const metadata: Metadata = {
  title: 'NFL Power Rankings: Current 1-32 Rankings & Analysis | The Snap',
  description:
    'Current NFL power rankings for all 32 teams, with weekly movement, analysis, methodology, and a complete archive of past rankings.',
  openGraph: {
    title: 'NFL Power Rankings: Current 1-32 Rankings & Analysis | The Snap',
    description: 'Current 1-32 NFL team rankings, movement notes, analysis, and weekly archives.',
    url: `${SITE_URL}/articles/power-rankings`,
    type: 'website',
  },
  alternates: { canonical: `${SITE_URL}/articles/power-rankings` },
  robots: { index: true, follow: true },
};

export const revalidate = 300;

type SnapshotTarget = {
  seasonYear: number;
  weekNumber?: number;
  playoffRound?: string;
};

type SnapshotArchiveItem = SnapshotTarget & {
  title?: string;
  summary?: string;
  date?: string;
  publishedAt?: string;
  dateModified?: string;
};

const PLAYOFF_LABELS: Record<string, string> = {
  WC: 'Wild Card',
  DIV: 'Divisional Round',
  CONF: 'Conference Championships',
  SB: 'Super Bowl',
  OFF: 'Offseason',
};

function getWeekPart(item: SnapshotTarget): string | null {
  if (typeof item.weekNumber === 'number') return `week-${item.weekNumber}`;
  return item.playoffRound?.toLowerCase() || null;
}

function getSnapshotPath(item: SnapshotTarget): string | null {
  const weekPart = getWeekPart(item);
  return weekPart ? `/articles/power-rankings/${item.seasonYear}/${weekPart}` : null;
}

function getSnapshotLabel(item: SnapshotTarget): string {
  if (typeof item.weekNumber === 'number') return `${item.seasonYear} Week ${item.weekNumber}`;
  return `${item.seasonYear} ${PLAYOFF_LABELS[item.playoffRound || ''] || item.playoffRound || 'Rankings'}`;
}

function getTeamName(entry: PowerRankingEntry): string {
  const referencedName = entry.team?.title?.trim();
  if (referencedName) return referencedName;
  const explicitName = entry.teamName?.trim();
  if (explicitName && !/^[A-Z]{2,4}$/.test(explicitName.toUpperCase())) return explicitName;
  const code = (entry.teamAbbr || explicitName || '').trim().toUpperCase();
  return teamNameFromCode(code) || explicitName || code || 'NFL Team';
}

function formatDate(value?: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export default async function PowerRankingsArticlePage() {
  let activeSeason: number | null = null;
  try {
    activeSeason = await getActiveSeason();
  } catch (error) {
    console.error('Active NFL season lookup failed:', error);
  }

  let liveDoc: PowerRankingsDoc | null = null;
  let latestTarget: SnapshotTarget | null = null;
  let archive: SnapshotArchiveItem[] = [];

  try {
    const [live, activeSeasonTarget, fallbackTarget, archiveItems] = await Promise.all([
      client.fetch<PowerRankingsDoc | null>(powerRankingsLiveQuery),
      activeSeason
        ? client.fetch<SnapshotTarget | null>(powerRankingsLatestSnapshotForSeasonQuery, {
            season: activeSeason,
          })
        : Promise.resolve(null),
      client.fetch<SnapshotTarget | null>(powerRankingsLatestSnapshotQuery),
      client.fetch<SnapshotArchiveItem[]>(powerRankingsSnapshotSlugsQuery),
    ]);
    liveDoc = live;
    latestTarget = activeSeasonTarget || fallbackTarget;
    archive = archiveItems;
  } catch (error) {
    console.error('Power Rankings hub query failed:', error);
  }

  let latestSnapshot: PowerRankingsDoc | null = null;
  if (latestTarget) {
    try {
      latestSnapshot = await client.fetch<PowerRankingsDoc | null>(powerRankingsSnapshotByParamsQuery, {
        season: latestTarget.seasonYear,
        week: latestTarget.weekNumber ?? null,
        playoffRound: latestTarget.playoffRound ?? null,
      });
    } catch (error) {
      console.error('Latest Power Rankings snapshot query failed:', error);
    }
  }

  const board = latestSnapshot || liveDoc;
  const rankings = (board?.rankings || []).slice().sort((a, b) => a.rank - b.rank);
  const latestPath = latestTarget ? getSnapshotPath(latestTarget) : null;
  const latestLabel = latestTarget ? getSnapshotLabel(latestTarget) : null;
  const updatedLabel = formatDate(board?.dateModified || board?.publishedAt || board?.date);
  const coverImage = board?.coverImage || liveDoc?.coverImage;
  const methodology = liveDoc?.methodology || board?.methodology;
  const intro = liveDoc?.rankingIntro;

  const itemListSchema = rankings.length
    ? {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Current NFL Power Rankings',
        url: `${SITE_URL}/articles/power-rankings`,
        numberOfItems: rankings.length,
        itemListOrder: 'https://schema.org/ItemListOrderAscending',
        itemListElement: rankings.map((entry) => ({
          '@type': 'ListItem',
          position: entry.rank,
          item: {
            '@type': 'SportsTeam',
            name: getTeamName(entry),
            ...(entry.team?.slug?.current
              ? { url: `${SITE_URL}/teams/${entry.team.slug.current}` }
              : {}),
          },
        })),
      }
    : null;

  return (
    <main className="min-h-screen bg-[hsl(0_0%_3.9%)] text-white">
      {itemListSchema && <StructuredData id="sd-current-nfl-power-rankings" data={itemListSchema} />}
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-12">
        <Breadcrumb items={[{ label: 'Articles', href: '/articles' }, { label: 'Power Rankings' }]} className="mb-6" />

        <header className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950 via-zinc-950 to-black">
          <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="p-7 sm:p-10 lg:p-12">
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-sky-300">The Snap Rankings Hub</p>
              <h1 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">NFL Power Rankings</h1>
              <p className="mt-5 max-w-3xl text-base leading-7 text-zinc-300 sm:text-lg">
                A durable, week-to-week ranking of all 32 NFL teams. The board balances quarterback play,
                roster strength, coaching, injuries, recent performance, and how sustainable each team&apos;s results look.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                {latestPath && latestLabel && (
                  <Link
                    href={latestPath}
                    className="rounded-full bg-white px-5 py-2.5 text-sm font-bold text-black transition hover:bg-zinc-200"
                  >
                    Read the full {latestLabel} analysis
                  </Link>
                )}
                {updatedLabel && <span className="text-sm text-zinc-400">Last editorial update: {updatedLabel}</span>}
              </div>
            </div>
            {coverImage?.asset?.url && (
              <div className="relative min-h-64 lg:min-h-full">
                <Image
                  src={coverImage.asset.url}
                  alt={coverImage.alt || 'The Snap NFL power rankings'}
                  fill
                  sizes={ARTICLE_COVER_SIZES}
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent lg:bg-gradient-to-r lg:from-black/45 lg:to-transparent" />
              </div>
            )}
          </div>
        </header>

        {Array.isArray(intro) && intro.length > 0 && (
          <section className="prose prose-invert mt-10 max-w-4xl text-lg leading-relaxed">
            <PortableText value={intro} components={portableTextComponents} />
          </section>
        )}

        <section className="mt-12" aria-labelledby="current-rankings-heading">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">Current board</p>
              <h2 id="current-rankings-heading" className="mt-2 text-3xl font-black sm:text-4xl">
                Latest NFL rankings: 1-32
              </h2>
            </div>
            {latestPath && <Link href={latestPath} className="text-sm font-semibold text-sky-300 hover:text-sky-200">Full team-by-team analysis →</Link>}
          </div>

          {rankings.length > 0 ? (
            <ol className="grid gap-3 md:grid-cols-2">
              {rankings.map((entry) => {
                const teamName = getTeamName(entry);
                const logo = entry.teamLogo || entry.team?.teamLogo;
                const teamPath = entry.team?.slug?.current ? `/teams/${entry.team.slug.current}` : null;
                return (
                  <li key={`${entry.rank}-${teamName}`} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                    <div className="flex items-center gap-4">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-xl font-black text-black">
                        {entry.rank}
                      </span>
                      {logo?.asset?.url && (
                        <Image
                          src={logo.asset.url}
                          alt={logo.alt || `${teamName} logo`}
                          width={48}
                          height={48}
                          className="h-12 w-12 object-contain"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg font-bold">
                          {teamPath ? <Link href={teamPath} className="hover:text-sky-300">{teamName}</Link> : teamName}
                        </h3>
                        {(entry.summary || entry.note) && (
                          <p className="mt-1 line-clamp-2 text-sm leading-5 text-zinc-400">{entry.summary || entry.note}</p>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/15 p-8 text-zinc-400">
              The next 1-32 board is being prepared. Published weekly snapshots remain available below.
            </div>
          )}
        </section>

        {methodology && (
          <section className="mt-14 rounded-3xl border border-white/10 bg-zinc-950 p-7 sm:p-9" aria-labelledby="methodology-heading">
            <h2 id="methodology-heading" className="text-2xl font-black">How The Snap ranks NFL teams</h2>
            <p className="mt-4 max-w-4xl text-base leading-7 text-zinc-300">{methodology}</p>
          </section>
        )}

        <section className="mt-14" aria-labelledby="archive-heading">
          <h2 id="archive-heading" className="text-3xl font-black">Power rankings archive</h2>
          <p className="mt-3 max-w-3xl text-zinc-400">
            Every published snapshot stays available so readers can see how the league changed across the season.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {archive.slice(0, 18).map((item) => {
              const path = getSnapshotPath(item);
              if (!path) return null;
              return (
                <Link key={path} href={path} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-white/25 hover:bg-white/[0.07]">
                  <span className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">Snapshot</span>
                  <span className="mt-2 block text-lg font-bold">{item.title || getSnapshotLabel(item)}</span>
                  <span className="mt-2 block text-sm text-zinc-400">
                    {formatDate(item.dateModified || item.publishedAt || item.date) || 'View rankings'}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
