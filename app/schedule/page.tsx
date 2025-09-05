import { getScheduleWeekOrCurrent, TEAM_META, groupGamesByBucket, EnrichedGame } from '@/lib/schedule';
import Link from 'next/link';
import Image from 'next/image';
import TeamFilterClient from './TeamFilterClient';
import { headers } from 'next/headers';

export const revalidate = 300; // updated frequently in season

// Root schedule page (auto-detect current week)
export default async function ScheduleLandingPage() {
  const hdrs = await headers();
  const url = new URL(hdrs.get('x-url') || 'http://localhost');
  const teamParam = url.searchParams.get('team')?.toUpperCase();
  const { week, games } = await getScheduleWeekOrCurrent();
  const filteredGames = teamParam ? games.filter(g => g.home === teamParam || g.away === teamParam) : games;
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 text-white">
      <h1 className="text-3xl font-bold mb-2">NFL Schedule</h1>
      <p className="text-sm text-white/60 mb-6">Week {week} (auto-detected). Choose another week below.</p>
      <WeekSelector currentWeek={week} />
  <TeamFilterClient />
  <GamesBuckets games={filteredGames} />
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
  const d = new Date(game.dateUTC);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfGame = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((startOfGame.getTime() - startOfToday.getTime()) / 86400000);
  let dateLabel: string;
  if (diffDays === 0) dateLabel = 'Today';
  else if (diffDays === 1) dateLabel = 'Tomorrow';
  else dateLabel = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  const timeLabel = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  return (
    <div className="border border-white/10 rounded-lg p-4 flex items-center justify-between bg-white/5">
      <div className="flex flex-col text-sm">
        <span className="font-semibold flex items-center gap-2">
          <TeamBadge abbr={game.away} /> @ <TeamBadge abbr={game.home} />
        </span>
        <span className="text-white/50 text-xs">{dateLabel} {timeLabel} • {game.network || 'TBD'}</span>
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
