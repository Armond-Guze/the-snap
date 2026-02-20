import { getScheduleWeekOrCurrent, groupGamesByBucket, TEAM_META, EnrichedGame } from '@/lib/schedule';
import { fetchTeamRecords, shortRecord } from '@/lib/team-records';
import { getActiveSeason } from '@/lib/season';
import type { TeamRecordDoc } from '@/lib/team-records';
import { formatGameDateParts, shortNetworkLabel } from '@/lib/schedule-format';
import TimezoneClient from '../../TimezoneClient';
import Image from 'next/image';
import { headers } from 'next/headers';
import type { Metadata } from 'next';
import StructuredData from '../../../components/StructuredData';
import WeekDropdown from '../../WeekDropdown';
import { buildSportsEventList } from '@/lib/seo/sportsEventSchema';
import { SITE_URL } from '@/lib/site-config';

export const revalidate = 300;

interface Params { week: string }

// Week-level metadata (dynamic per param) – ensures unique keyword rich titles
export async function generateMetadata(p: { params: Promise<Params> }): Promise<Metadata> {
  const params = await p.params;
  const rawWeek = Number(params.week);
  const week = isNaN(rawWeek) || rawWeek < 1 || rawWeek > 18 ? undefined : rawWeek;
  const weekLabel = week ? `Week ${week}` : 'Week';
  const season = await getActiveSeason();
  const baseTitle = `NFL Schedule ${weekLabel} ${season} – Matchups, Times (ET) & TV Channels`;
  const desc = `Complete NFL ${weekLabel} ${season} schedule: kickoff times in Eastern Time (ET), TV channels, networks and live status for every game plus primetime matchups.`;
  const canonical = `${SITE_URL}${week ? `/schedule/week/${week}` : '/schedule'}`;
  return {
    title: baseTitle + ' | The Snap',
    description: desc,
    alternates: { canonical },
    openGraph: {
      title: baseTitle + ' | The Snap',
      description: desc,
      url: canonical,
      type: 'website'
    },
    twitter: {
      card: 'summary_large_image',
      title: baseTitle,
      description: desc
    },
    robots: { index: true, follow: true }
  };
}

// In Next.js 15, dynamic route params are provided as a Promise
export default async function WeekSchedulePage({ params }: { params: Promise<Params> }) {
  const resolved = await params;
  const hdrs = await headers();
  const url = new URL(hdrs.get('x-url') || 'http://localhost');
  const teamParam = url.searchParams.get('team')?.toUpperCase();
  const weekNum = Number(resolved.week);
  const { week, games } = await getScheduleWeekOrCurrent(weekNum);
  const season = await getActiveSeason();
  const recordsMap = await fetchTeamRecords(season);
  const filteredGames = teamParam ? games.filter(g => g.home === teamParam || g.away === teamParam) : games;
  const enableEventSchema = process.env.ENABLE_EVENT_SCHEMA === 'true';
  const events = enableEventSchema ? buildSportsEventList(filteredGames, { country: 'US' }).slice(0, 25) : [];
  const sd = enableEventSchema && events.length
    ? { '@context':'https://schema.org', '@type':'ItemList', name:`NFL Schedule Week ${week}`, itemListElement: events }
    : null;
  return (
    <div className="max-w-5xl mx-auto px-4 pt-3 pb-8 md:pt-8 text-white">
      {sd && <StructuredData data={sd} id={`sd-week-${week}`} />}
      <h1 className="text-3xl font-bold mb-2">NFL Schedule - Week {week}</h1>
  <WeekDropdown currentWeek={week} showAutoWeekLink={false} />
  <TimezoneClient />
  <GamesBuckets games={filteredGames} recordsMap={recordsMap} />
    </div>
  );
}

interface GameProps { games: EnrichedGame[]; recordsMap?: Map<string, TeamRecordDoc> }

function GamesBuckets({ games, recordsMap }: GameProps) {
  if (!games.length) return <p className="text-white/60">No games found for this week (expand schedule JSON).</p>;
  const buckets = groupGamesByBucket(games);
  return (
    <div className="space-y-8">
      {buckets.map(b => (
        <div key={b.label}>
          <h2 className="text-lg font-semibold mb-3 tracking-wide text-white/80">{b.label}</h2>
          <div className="space-y-3">
            {b.games.map(g => <GameRow key={g.gameId} game={g} recordsMap={recordsMap} />)}
          </div>
        </div>
      ))}
    </div>
  );
}


function GameRow({ game, recordsMap }: { game: EnrichedGame; recordsMap?: Map<string, TeamRecordDoc> }) {
  const { dateLabel, timeLabel } = formatGameDateParts(game.dateUTC, { timezoneCode: 'ET', includeRelative: false });
  return (
    <div className="border border-white/10 rounded-lg p-4 sm:p-5 flex items-center justify-between bg-white/5">
  <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
        {/* Kickoff info column (left of away team) */}
        <div className="w-28 sm:w-40 shrink-0 text-white/70 leading-tight">
          <div className="text-[12px] font-medium">{dateLabel}</div>
          <div className="text-[12px]">
            {timeLabel} •
            <span className="sm:hidden">{shortNetworkLabel(game.network)}</span>
            <span className="hidden sm:inline">{game.network || 'TBD'}</span>
          </div>
        </div>

        {/* Teams: left-aligned on mobile; allow truncation if extremely narrow */}
        <div className="leading-[1.15] text-[16px] sm:text-[20px] flex-1 min-w-0">
          <span className="flex font-semibold items-center gap-2 truncate">
            <TeamBadge abbr={game.away} />
            {(() => { const rec = shortRecord(recordsMap?.get(game.away)); return rec ? (<span className="text-white/50 text-[14px] hidden sm:inline">({rec})</span>) : null; })()}
            <span>@</span>
            <TeamBadge abbr={game.home} />
            {(() => { const rec = shortRecord(recordsMap?.get(game.home)); return rec ? (<span className="text-white/50 text-[14px] hidden sm:inline">({rec})</span>) : null; })()}
          </span>
        </div>
      </div>
      <div className="text-right text-base min-w-[120px] ml-4 hidden sm:block">
        {game.status === 'FINAL' && game.scores ? (
          <span className="font-bold">{game.scores.away}-{game.scores.home} <span className="text-white/50 font-normal">Final</span></span>
        ) : game.status === 'IN_PROGRESS' ? (
          <span className="text-amber-400 animate-pulse">Live {game.quarter} {game.clock}</span>
        ) : (
          <span className="text-white/50">Scheduled</span>
        )}
      </div>
    </div>
  )
}

function TeamBadge({ abbr }: { abbr: string }) {
  const meta = TEAM_META[abbr];
  if (!meta) return <span>{abbr}</span>;
  return (
    <span className="inline-flex items-center gap-1.5 min-w-0">
      <span className="relative w-6 h-6 sm:w-7 sm:h-7 inline-block shrink-0">
        <Image src={meta.logo} alt={meta.name} fill sizes="24px, (min-width: 640px) 28px" className="object-contain" />
      </span>
      <span className="truncate">{abbr}</span>
    </span>
  );
}

export async function generateStaticParams() {
  // Pre-render all 18 weeks for SEO
  return Array.from({ length: 18 }, (_, i) => ({ week: String(i + 1) }));
}
