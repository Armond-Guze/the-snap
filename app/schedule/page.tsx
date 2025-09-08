import { getScheduleWeekOrCurrent, TEAM_META, groupGamesByBucket, EnrichedGame } from '@/lib/schedule';
import { formatGameDateParts } from '@/lib/schedule-format';
import TimezoneClient from './TimezoneClient';
import Link from 'next/link';
import Image from 'next/image';
import TeamFilterClient from './TeamFilterClient';
import { headers } from 'next/headers';
import type { Metadata } from 'next';
import StructuredData from '../components/StructuredData';

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
  const filteredGames = teamParam ? games.filter(g => g.home === teamParam || g.away === teamParam) : games;
  // Build SportsEvent list structured data (limited to first 25 to keep payload small)
  const events = filteredGames.slice(0,25).map(g => ({
    '@type': 'SportsEvent',
    name: `${g.away} @ ${g.home}`,
    startDate: g.dateUTC,
    eventStatus: g.status === 'FINAL' ? 'https://schema.org/EventCompleted' : 'https://schema.org/EventScheduled',
    location: { '@type':'Place', name: g.venue || 'Stadium' },
    competitor: [
      { '@type':'SportsTeam', name: g.away },
      { '@type':'SportsTeam', name: g.home }
    ],
    broadcastChannel: g.network || undefined
  }));
  const sd = {
    '@context':'https://schema.org',
    '@type':'SportsEvent',
    name:`NFL Schedule Week ${week}`,
    hasPart: events
  };
  return (
    <div className="max-w-5xl mx-auto px-4 pt-3 pb-8 md:pt-8 text-white">
      <StructuredData data={sd} id={`sd-schedule-week-${week}`} />
      <h1 className="text-3xl font-bold mb-2">NFL Schedule</h1>
      <p className="text-sm text-white/60 mb-6">Week {week} (auto-detected). Choose another week below.</p>
  <WeekSelector currentWeek={week} />
  <TimezoneClient />
  <TeamFilterClient />
  <GamesBuckets games={filteredGames} />
  <ScheduleFAQ />
    </div>
  );
}

function WeekSelector({ currentWeek }: { currentWeek: number }) {
  const weeks = Array.from({ length: 18 }, (_, i) => i + 1);
  return (
    <div className="flex flex-wrap gap-2 mb-8">
      {weeks.map(w => (
        <Link key={w} href={`/schedule/week/${w}`} className={`px-3 py-1 rounded-md text-sm border transition-colors ${w === currentWeek ? 'bg-white text-black border-white' : 'border-white/20 text-white/70 hover:text-white hover:border-white/50'}`}>Week {w}</Link>
      ))}
    </div>
  );
}

interface GameProps { games: Awaited<ReturnType<typeof getScheduleWeekOrCurrent>>['games']; }

function GamesBuckets({ games }: GameProps) {
  if (!games.length) return <p className="text-white/60">No games found for this week (placeholder schedule, add more games JSON).</p>;
  const buckets = groupGamesByBucket(games);
  return (
    <div className="space-y-8">
      {buckets.map(b => (
        <div key={b.label}>
          <h2 className="text-lg font-semibold mb-3 tracking-wide text-white/80">{b.label}</h2>
          <div className="space-y-3">
            {b.games.map(g => <GameRow key={g.gameId} game={g} />)}
          </div>
        </div>
      ))}
    </div>
  );
}


function GameRow({ game }: { game: EnrichedGame }) {
  // read tz from location (server headers only accessible at top-level; fallback to ET)
  // For server component we can't use hooks, parse from referer like earlier.
  const tz = 'ET'; // server fallback; client hydration will update via separate component if necessary.
  const { dateLabel, timeLabel, relative } = formatGameDateParts(game.dateUTC, { timezoneCode: tz });
  return (
    <div className="border border-white/10 rounded-lg p-4 flex items-center justify-between bg-white/5" itemScope itemType="https://schema.org/SportsEvent">
      <div className="flex flex-col text-sm">
        <span className="font-semibold flex items-center gap-2">
          <TeamBadge abbr={game.away} /> @ <TeamBadge abbr={game.home} />
        </span>
        <span className="text-white/50 text-xs">{dateLabel} {timeLabel} • {game.network || 'TBD'}{relative ? <span className="text-white/40"> • {relative}</span> : null}</span>
  <meta itemProp="startDate" content={game.dateUTC} />
      </div>
      <div className="text-right text-sm min-w-[110px]">
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
    <span className="inline-flex items-center gap-1">
      <span className="relative w-5 h-5 inline-block">
        <Image src={meta.logo} alt={meta.name} fill sizes="20px" className="object-contain" />
      </span>
      <span>{abbr}</span>
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
      a: 'Use the team filter above or visit dedicated team pages like /teams/kc or /teams/sf for the full 2025 slate.'
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
