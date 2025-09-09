import { TEAM_META, TEAM_ABBRS, getTeamSeasonSchedule, computeByeWeek, primetimeSummary, isPrimetimeGame } from '@/lib/schedule';
import { formatGameDateParts } from '@/lib/schedule-format';
import type { Metadata } from 'next';
import Link from 'next/link';

// Follow project convention: params delivered as a Promise
interface TeamPageProps { params: Promise<{ team: string }> }

export async function generateStaticParams() {
  return TEAM_ABBRS.map(t => ({ team: t.toLowerCase() }));
}

export async function generateMetadata({ params }: TeamPageProps): Promise<Metadata> {
  const { team } = await params;
  const abbr = team.toUpperCase();
  const meta = TEAM_META[abbr];
  if (!meta) return { title: 'Team Schedule | The Snap' };
  const year = 2025;
  const name = meta.name;
  const title = `${name} ${year} Schedule, Matchups & TV Channels | The Snap`;
  const description = `Full ${year} ${name} schedule: weekly opponents, dates, kickoff times (ET), TV channels plus final scores and live status updates.`;
  return {
    title,
    description,
    alternates: { canonical: `/teams/${abbr.toLowerCase()}` },
    openGraph: { title, description },
    twitter: { card: 'summary_large_image', title, description }
  };
}

export const revalidate = 300;

export default async function TeamSchedulePage({ params }: TeamPageProps) {
  const { team } = await params;
  const abbr = team.toUpperCase();
  const meta = TEAM_META[abbr];
  if (!meta) return <div className="max-w-4xl mx-auto px-4 py-12 text-white">Unknown team.</div>;
  const games = await getTeamSeasonSchedule(abbr);
  const byeWeek = computeByeWeek(games);
  const prime = primetimeSummary(games);
  const sd = {
    '@context': 'https://schema.org',
    '@type': 'SportsTeam',
    name: meta.name,
    sport: 'American Football',
    memberOf: { '@type': 'SportsOrganization', name: 'NFL' },
    season: '2025',
    url: `https://thegamesnap.com/teams/${abbr.toLowerCase()}`,
    hasPart: games.slice(0,50).map(g => ({
      '@type':'SportsEvent',
      name: `${g.away} @ ${g.home}`,
      startDate: g.dateUTC,
      eventStatus: g.status === 'FINAL' ? 'https://schema.org/EventCompleted' : 'https://schema.org/EventScheduled',
      location: g.venue ? { '@type':'Place', name: g.venue } : undefined,
      homeTeam: { '@type':'SportsTeam', name: TEAM_META[g.home]?.name || g.home },
      awayTeam: { '@type':'SportsTeam', name: TEAM_META[g.away]?.name || g.away },
      broadcastChannel: g.network || undefined
    }))
  };

  const totalGames = games.length;
  const expected = 17; // ignoring postseason; regular season target
  const partial = totalGames < expected;

  // Simple filter states (server-side via query later; placeholder static for now)
  const dynamicFilter: string = 'ALL'; // placeholder; later read from query params for filtering
  const filtered = games.filter(g => {
    if (dynamicFilter === 'COMPLETED') return g.status === 'FINAL';
    if (dynamicFilter === 'UPCOMING') return g.status !== 'FINAL';
    if (dynamicFilter === 'PRIMETIME') return isPrimetimeGame(g);
    return true; // ALL
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 text-white">
      <h1 className="text-3xl font-bold mb-2">{meta.name} 2025 Schedule</h1>
      <p className="text-white/60 mb-4 text-sm">Kickoff times expressed in Eastern Time (ET). Live status and final scores update automatically.</p>
      <div className="flex flex-wrap gap-4 text-xs text-white/70 mb-6">
        {byeWeek && <span className="px-2 py-1 bg-white/5 rounded border border-white/10">Bye Week: {byeWeek}</span>}
        <span className="px-2 py-1 bg-white/5 rounded border border-white/10">Primetime Games: {prime.count}{prime.count ? ` (Weeks ${prime.weeks.join(', ')})` : ''}</span>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(sd) }} />
      {partial && (
        <div className="mb-4 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-2 rounded">
          Partial schedule data – additional games will appear as the JSON file is expanded.
        </div>
      )}
      <div className="flex gap-2 mb-4 text-xs">
        {['ALL','COMPLETED','UPCOMING','PRIMETIME'].map(f => (
          <span key={f} className={`px-2 py-1 rounded border ${f===dynamicFilter ? 'bg-white text-black border-white' : 'border-white/20 text-white/60'}`}>{f}</span>
        ))}
      </div>
      <div className="border border-white/10 rounded-lg overflow-hidden">
        <table className="w-full text-sm">    
          <thead className="bg-white/10 text-left">
            <tr>
              <th className="p-2 font-semibold">Week</th>
              <th className="p-2 font-semibold">Matchup</th>
              <th className="p-2 font-semibold">Date</th>
              <th className="p-2 font-semibold">Time (ET)</th>
              <th className="p-2 font-semibold">Network</th>
              <th className="p-2 font-semibold">Result</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(g => {
              const { dateLabel, timeLabel } = formatGameDateParts(g.dateUTC, { timezoneCode: 'ET' });
              const matchup = `${g.away} @ ${g.home}`;
              let result: string | null = null;
              if (g.status === 'FINAL' && g.scores) result = `${g.scores.away}-${g.scores.home} Final`;
              else if (g.status === 'IN_PROGRESS') result = `Live ${g.quarter || ''} ${g.clock || ''}`.trim();
              return (
                <tr key={g.gameId} className="border-t border-white/5">
                  <td className="p-2">{g.week}</td>
                  <td className="p-2">
                    <Link href={`/matchup/${g.gameId}`} className="hover:underline">{matchup}</Link>
                    <div className="text-[10px] text-white/40 mt-0.5 space-x-1">
                      <Link href={`/teams/${g.away.toLowerCase()}`} className="hover:text-white">{g.away}</Link>
                      <span>@</span>
                      <Link href={`/teams/${g.home.toLowerCase()}`} className="hover:text-white">{g.home}</Link>
                      {isPrimetimeGame(g) && <span className="text-amber-400">• Primetime</span>}
                    </div>
                  </td>
                  <td className="p-2 whitespace-nowrap">{dateLabel}</td>
                  <td className="p-2">{timeLabel}</td>
                  <td className="p-2">{g.network || 'TBD'}</td>
                  <td className="p-2 text-xs text-white/70">{result || '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

  <section className="mt-12 space-y-6">
        <h2 className="text-2xl font-semibold">{meta.name} Schedule FAQs</h2>
        <div className="space-y-4 text-sm leading-relaxed">
          <div>
            <h3 className="font-semibold">When is the {meta.name} bye week?</h3>
    <p className="text-white/70">{byeWeek ? `Their bye comes in Week ${byeWeek}.` : 'Bye week not yet determined in current data.'}</p>
          </div>
          <div>
            <h3 className="font-semibold">How many primetime games do the {meta.name} have in 2025?</h3>
    <p className="text-white/70">{prime.count ? `${prime.count} primetime appearance${prime.count>1?'s':''} in Weeks ${prime.weeks.join(', ')}.` : 'No primetime games in current data.'}</p>
          </div>
          <div>
            <h3 className="font-semibold">Who do the {meta.name} play in Week 1?</h3>
    <p className="text-white/70">{(() => { const w1 = games.find(g => g.week === 1); return w1 ? `${w1.away} @ ${w1.home}` : 'Week 1 matchup not listed.'; })()}</p>
          </div>
        </div>
      </section>
    </div>
  );
}