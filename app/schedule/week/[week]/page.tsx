import { getScheduleWeekOrCurrent, groupGamesByBucket, TEAM_META, EnrichedGame } from '@/lib/schedule';
import { fetchTeamRecords, shortRecord } from '@/lib/team-records';
import type { TeamRecordDoc } from '@/lib/team-records';
import { formatGameDateParts } from '@/lib/schedule-format';
import TimezoneClient from '../../TimezoneClient';
import Image from 'next/image';
import TeamFilterClient from '../../TeamFilterClient';
import { headers } from 'next/headers';
import type { Metadata } from 'next';
import StructuredData from '../../../components/StructuredData';
import WeekDropdown from '../../WeekDropdown';

export const revalidate = 300;

interface Params { week: string }

// Week-level metadata (dynamic per param) – ensures unique keyword rich titles
export async function generateMetadata(p: { params: Promise<Params> }): Promise<Metadata> {
  const params = await p.params;
  const rawWeek = Number(params.week);
  const week = isNaN(rawWeek) || rawWeek < 1 || rawWeek > 18 ? undefined : rawWeek;
  const weekLabel = week ? `Week ${week}` : 'Week';
  const baseTitle = `NFL Schedule ${weekLabel} 2025 – Matchups, Times (ET) & TV Channels`;
  const desc = `Complete NFL ${weekLabel} 2025 schedule: kickoff times in Eastern Time (ET), TV channels, networks and live status for every game plus primetime matchups.`;
  const canonical = week ? `/schedule/week/${week}` : '/schedule';
  return {
    title: baseTitle + ' | The Snap',
    description: desc,
    alternates: { canonical },
    openGraph: {
      title: baseTitle + ' | The Snap',
      description: desc,
      url: `https://thegamesnap.com${canonical}`,
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
  const recordsMap = await fetchTeamRecords(2025);
  const filteredGames = teamParam ? games.filter(g => g.home === teamParam || g.away === teamParam) : games;
  const events = filteredGames.slice(0,25).map(g => ({
    '@type':'SportsEvent',
    name:`${g.away} @ ${g.home}`,
    startDate:g.dateUTC,
    eventStatus: g.status === 'FINAL' ? 'https://schema.org/EventCompleted' : 'https://schema.org/EventScheduled',
    location:{ '@type':'Place', name: g.venue || 'Stadium' },
    competitor:[{ '@type':'SportsTeam', name:g.away },{ '@type':'SportsTeam', name:g.home }],
    broadcastChannel: g.network || undefined
  }));
  const sd = { '@context':'https://schema.org', '@type':'SportsEvent', name:`NFL Schedule Week ${week}`, hasPart: events };
  return (
    <div className="max-w-5xl mx-auto px-4 pt-3 pb-8 md:pt-8 text-white">
      <StructuredData data={sd} id={`sd-week-${week}`} />
      <h1 className="text-3xl font-bold mb-2">NFL Schedule - Week {week}</h1>
  <WeekDropdown currentWeek={week} showAutoWeekLink={false} />
  <TimezoneClient />
  <TeamFilterClient />
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
    <div className="border border-white/10 rounded-lg p-5 flex items-center justify-between bg-white/5" itemScope itemType="https://schema.org/SportsEvent">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {/* Kickoff info column (left of away team) */}
        <div className="w-40 shrink-0 text-white/70 leading-tight">
          <div className="text-[12px] font-medium">{dateLabel}</div>
          <div className="text-[12px]">{timeLabel} • {game.network || 'TBD'}</div>
          <meta itemProp="startDate" content={game.dateUTC} />
        </div>

        {/* Teams */}
        <div className="flex flex-col leading-[1.15] text-[18px] sm:text-[20px] flex-1 min-w-0">
          <span className="font-semibold flex items-center gap-2 truncate">
            <TeamBadge abbr={game.away} />
            {(() => { const rec = shortRecord(recordsMap?.get(game.away)); return rec ? (<span className="text-white/50 text-[14px]">({rec})</span>) : null; })()}
            <span>@</span>
            <TeamBadge abbr={game.home} />
            {(() => { const rec = shortRecord(recordsMap?.get(game.home)); return rec ? (<span className="text-white/50 text-[14px]">({rec})</span>) : null; })()}
          </span>
        </div>
      </div>
      <div className="text-right text-base min-w-[120px] ml-4">
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
      <span className="relative w-7 h-7 inline-block shrink-0">
        <Image src={meta.logo} alt={meta.name} fill sizes="28px" className="object-contain" />
      </span>
      <span className="truncate">{abbr}</span>
    </span>
  );
}

export async function generateStaticParams() {
  // Pre-render all 18 weeks for SEO
  return Array.from({ length: 18 }, (_, i) => ({ week: String(i + 1) }));
}
