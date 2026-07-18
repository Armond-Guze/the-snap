import Image from 'next/image';
import Link from 'next/link';
import StructuredData from '../components/StructuredData';
import { EnrichedGame, TEAM_META, groupGamesByBucket } from '@/lib/schedule';
import { formatGameDateParts, shortNetworkLabel } from '@/lib/schedule-format';
import { shortRecord, type TeamRecordDoc } from '@/lib/team-records';

interface GamesBucketsProps {
  games: EnrichedGame[];
  recordsMap?: Map<string, TeamRecordDoc>;
  timezoneCode: string;
}

export function GamesBuckets({ games, recordsMap, timezoneCode }: GamesBucketsProps) {
  if (!games.length) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 text-sm text-white/65">
        The schedule is temporarily unavailable. Please try again shortly.
      </div>
    );
  }

  const buckets = groupGamesByBucket(games);
  return (
    <div className="space-y-8">
      {buckets.map((bucket) => (
        <section key={bucket.label} aria-labelledby={`schedule-${bucket.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}>
          <h2
            id={`schedule-${bucket.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
            className="mb-3 text-lg font-semibold tracking-wide text-white/80"
          >
            {bucket.label}
          </h2>
          <div className="space-y-3">
            {bucket.games.map((game) => (
              <GameRow
                key={game.gameId}
                game={game}
                recordsMap={recordsMap}
                timezoneCode={timezoneCode}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function GameRow({
  game,
  recordsMap,
  timezoneCode,
}: {
  game: EnrichedGame;
  recordsMap?: Map<string, TeamRecordDoc>;
  timezoneCode: string;
}) {
  const formatted = game.dateTimeTBD
    ? { dateLabel: 'Date/time', timeLabel: 'TBD' }
    : formatGameDateParts(game.dateUTC, { timezoneCode, includeRelative: false });

  return (
    <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4 sm:p-5">
      <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
        <div className="w-28 shrink-0 leading-tight text-white/70 sm:w-40">
          <div className="text-[12px] font-medium">{formatted.dateLabel}</div>
          <div className="text-[12px]">
            {formatted.timeLabel}
            {!game.dateTimeTBD && <span> {timezoneCode}</span>}
            <span aria-hidden="true"> · </span>
            <span className="sm:hidden">{shortNetworkLabel(game.network)}</span>
            <span className="hidden sm:inline">{game.network || 'TBD'}</span>
          </div>
        </div>

        <div className="min-w-0 flex-1 text-[16px] leading-[1.15] sm:text-[20px]">
          <span className="flex items-center gap-2 truncate font-semibold">
            <TeamBadge abbr={game.away} />
            <TeamRecord record={recordsMap?.get(game.away)} />
            <span>@</span>
            <TeamBadge abbr={game.home} />
            <TeamRecord record={recordsMap?.get(game.home)} />
          </span>
        </div>
      </div>

      <div className="ml-4 hidden min-w-[120px] text-right text-base sm:block">
        {game.status === 'FINAL' && game.scores ? (
          <span className="font-bold">
            {game.scores.away}-{game.scores.home}{' '}
            <span className="font-normal text-white/50">Final</span>
          </span>
        ) : game.status === 'IN_PROGRESS' ? (
          <span className="text-amber-400">Live {game.quarter} {game.clock}</span>
        ) : game.dateTimeTBD ? (
          <span className="text-white/50">Flexible scheduling</span>
        ) : (
          <span className="text-white/50">Scheduled</span>
        )}
      </div>
    </div>
  );
}

function TeamRecord({ record }: { record?: TeamRecordDoc }) {
  const value = shortRecord(record);
  return value ? <span className="hidden text-[14px] text-white/50 sm:inline">({value})</span> : null;
}

function TeamBadge({ abbr }: { abbr: string }) {
  const meta = TEAM_META[abbr];
  if (!meta) return <span>{abbr}</span>;
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5">
      <span className="relative inline-block h-6 w-6 shrink-0 sm:h-7 sm:w-7">
        <Image src={meta.logo} alt="" fill sizes="(min-width: 640px) 28px, 24px" className="object-contain" />
      </span>
      <span className="truncate" title={meta.name}>{abbr}</span>
    </span>
  );
}

export function ScheduleFAQ({ season }: { season: number }) {
  const faq = [
    {
      q: 'How is the current NFL week selected?',
      a: 'The schedule opens to the nearest upcoming regular-season week and moves to the active week once games begin. You can use the week selector to view any Week 1 through Week 18 slate.',
    },
    {
      q: 'How often are scores and game statuses updated?',
      a: 'During game windows, live status and scores are refreshed every few minutes. Final scores appear after games end.',
    },
    {
      q: 'Can I change the timezone for NFL kickoff times?',
      a: 'Yes. Use the timezone selector to display kickoff times in Eastern, Central, Mountain, Pacific or UTC time.',
    },
    {
      q: 'Why do some late-season games show a date and time as TBD?',
      a: 'The NFL can hold selected late-season matchups for flexible scheduling. The date, kickoff time and network are added once the league announces them.',
    },
  ];
  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };

  return (
    <section className="mt-16" aria-labelledby="schedule-faq-heading">
      <StructuredData id="schedule-faq" data={faqLd} />
      <h2 id="schedule-faq-heading" className="mb-6 text-2xl font-semibold">{season} NFL Schedule FAQ</h2>
      <div className="space-y-6 text-sm leading-relaxed">
        {faq.map((item) => (
          <div key={item.q}>
            <h3 className="mb-1 font-semibold">{item.q}</h3>
            <p className="text-white/70">{item.a}</p>
          </div>
        ))}
      </div>
      <p className="mt-6 text-sm text-white/65">
        Looking for one club? Browse all <Link href="/teams" className="font-semibold text-white underline decoration-white/30 underline-offset-4 hover:decoration-white">NFL team hubs</Link>.
      </p>
    </section>
  );
}
