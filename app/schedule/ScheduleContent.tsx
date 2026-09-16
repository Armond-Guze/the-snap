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
      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-6 text-sm text-neutral-600">
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
            className="mb-3 text-lg font-semibold tracking-wide text-neutral-600"
          >
            {bucket.label}
          </h2>
          <div className="schedule-grid">
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

function GameRow({game,recordsMap,timezoneCode}:{game:EnrichedGame;recordsMap?:Map<string,TeamRecordDoc>;timezoneCode:string}) {
 const formatted=game.dateTimeTBD?{dateLabel:'Date to be announced',timeLabel:'TBD'}:formatGameDateParts(game.dateUTC,{timezoneCode,includeRelative:false});
 return <article className="schedule-match">
  <div className="schedule-match-meta"><time dateTime={game.dateTimeTBD?undefined:game.dateUTC}>{formatted.dateLabel}</time><strong>{formatted.timeLabel}{!game.dateTimeTBD && ' '+timezoneCode}</strong><span>{shortNetworkLabel(game.network)||'Network TBD'}</span></div>
  <div className="schedule-match-teams">{(['away','home'] as const).map(side=>{const code=game[side];const meta=TEAM_META[code];const record=shortRecord(recordsMap?.get(code));return <div className="schedule-match-team" key={side}><Link href={meta?'/teams/'+meta.name.toLowerCase().replace(/[^a-z0-9]+/g,'-'):'/teams'}>{meta&&<Image src={meta.logo} alt="" width={40} height={40}/>}<span><strong>{meta?.name||code}</strong><small>{side==='home'?'Home':'Away'}{record?' · '+record:''}</small></span></Link>{game.scores && <b>{game.scores[side]}</b>}</div>;})}</div>
  <div className="schedule-match-status" data-live={game.status==='IN_PROGRESS'}>{game.status==='FINAL'?'Final':game.status==='IN_PROGRESS'?'Live · '+(game.quarter||'')+' '+(game.clock||''):game.dateTimeTBD?'Time TBD':'Scheduled'}</div>
 </article>;
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
            <p className="text-neutral-600">{item.a}</p>
          </div>
        ))}
      </div>
      <p className="mt-6 text-sm text-neutral-600">
        Looking for one club? Browse all <Link href="/teams" className="font-semibold text-neutral-900 underline decoration-white/30 underline-offset-4 hover:decoration-white">NFL team hubs</Link>.
      </p>
    </section>
  );
}
