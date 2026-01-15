import { getScheduleWeekOrCurrent, TEAM_META, groupGamesByBucket, EnrichedGame } from '@/lib/schedule';
import { fetchTeamRecords, shortRecord } from '@/lib/team-records';
import { getActiveSeason } from '@/lib/season';
import type { TeamRecordDoc } from '@/lib/team-records';
import { formatGameDateParts, shortNetworkLabel } from '@/lib/schedule-format';
import TimezoneClient from './TimezoneClient';
import Image from 'next/image';
import { headers } from 'next/headers';
import type { Metadata } from 'next';
import StructuredData from '../components/StructuredData';
import WeekDropdown from './WeekDropdown';
import { buildSportsEventList } from '@/lib/seo/sportsEventSchema';

// Root schedule metadata (static – week specific pages handle granular titles)
export const metadata: Metadata = {
  title: 'NFL Schedule 2025 – Times, TV Channels & Matchups (ET) | The Snap',
  description: 'Comprehensive 2025 NFL schedule hub: weekly matchups, kickoff times (ET), TV channels, live score status and network info. View every week 1–18 plus primetime games.',
  keywords: [
    'NFL schedule 2025',
    '2025 NFL schedule',
    'NFL games this week',
    'NFL kickoff times',
    'NFL TV schedule',
    'NFL matchups',
    'NFL week by week schedule'
  ].join(', '),
  alternates: { canonical: '/schedule' },
  openGraph: {
    title: 'NFL Schedule 2025 – Times & TV Channels | The Snap',
    description: 'Full 2025 NFL schedule hub: matchups, times (ET), networks, live status and weekly navigation.',
    url: 'https://thegamesnap.com/schedule',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NFL Schedule 2025 – Times & Networks',
    description: 'Weekly NFL matchups, kickoff times (ET) and TV channels – Week 1 through 18.'
  },
  robots: { index: true, follow: true }
};

export const revalidate = 300; // updated frequently in season

// Root schedule page (auto-detect current week)
export default async function ScheduleLandingPage() {
  const hdrs = await headers();
  const url = new URL(hdrs.get('x-url') || 'http://localhost');
  const teamParam = url.searchParams.get('team')?.toUpperCase();
  const { week, games } = await getScheduleWeekOrCurrent();
  const season = await getActiveSeason();
  const recordsMap = await fetchTeamRecords(season);
  const filteredGames = teamParam ? games.filter(g => g.home === teamParam || g.away === teamParam) : games;
  const enableEventSchema = process.env.ENABLE_EVENT_SCHEMA === 'true';
  const events = enableEventSchema ? buildSportsEventList(filteredGames, { country: 'US' }).slice(0, 25) : [];
  const sd = enableEventSchema && events.length
    ? {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: `NFL Schedule Week ${week}`,
        itemListElement: events,
      }
    : null;
  return (
    <div className="max-w-5xl mx-auto px-4 pt-3 pb-8 md:pt-8 text-white">
      {sd && <StructuredData data={sd} id={`sd-schedule-week-${week}`} />}
      <h1 className="text-3xl font-bold mb-2">NFL Schedule</h1>
      <p className="text-sm text-white/60 mb-6">Week {week} (auto-detected). Choose another week below.</p>
  <WeekDropdown currentWeek={week} showAutoWeekLink={false} />
  <TimezoneClient />
  <GamesBuckets games={filteredGames} recordsMap={recordsMap} />
  <ScheduleFAQ />
    </div>
  );
}

interface GameProps { games: Awaited<ReturnType<typeof getScheduleWeekOrCurrent>>['games']; recordsMap?: Map<string, TeamRecordDoc> }

function GamesBuckets({ games, recordsMap }: GameProps) {
  if (!games.length) return <p className="text-white/60">No games found for this week (placeholder schedule, add more games JSON).</p>;
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
  // Always format in ET per request
  const { dateLabel, timeLabel } = formatGameDateParts(game.dateUTC, { timezoneCode: 'ET', includeRelative: false });
  return (
  <div className="border border-white/10 rounded-lg p-4 sm:p-5 flex items-center justify-between bg-white/5">
      {/* Left info + matchup */}
  <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
        {/* Kickoff info column (date on top, then time • network) */}
        <div className="w-28 sm:w-40 shrink-0 text-white/70 leading-tight">
          <div className="text-[12px] font-medium">{dateLabel}</div>
          <div className="text-[12px]">
            {timeLabel} •
            {/* Shorten network on mobile, full on sm+ */}
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

      {/* Right status (hidden on mobile to free space) */}
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

function ScheduleFAQ() {
  const faq = [
    {
      q: 'What week of the NFL season is it right now?',
      a: 'The page auto-detects the current regular season week based on game dates. Use the week selector to jump ahead or back.'
    },
    {
      q: 'How often is the schedule updated with live scores?',
      a: 'Live status and scores refresh automatically during game windows (every few minutes). Final scores appear shortly after games end.'
    },
    {
      q: 'What time zone are kickoff times listed in?',
      a: 'All kickoff times are shown in Eastern Time (ET) on this page. Future enhancement: choose your local timezone.'
    },
    {
      q: 'Where can I see a specific team\'s full schedule?',
      a: 'Visit dedicated team pages like /teams/kc or /teams/sf for the full 2025 slate.'
    }
  ];
  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map(item => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a }
    }))
  };
  return (
    <div className="mt-16">
      <StructuredData id="schedule-faq" data={faqLd} />
      <h2 className="text-2xl font-semibold mb-6">NFL Schedule FAQ</h2>
      <div className="space-y-6 text-sm leading-relaxed">
        {faq.map(f => (
          <div key={f.q}>
            <h3 className="font-semibold mb-1">{f.q}</h3>
            <p className="text-white/70">{f.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
