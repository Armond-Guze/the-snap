import { TEAM_META, TEAM_ABBRS, getTeamSeasonSchedule } from '@/lib/schedule';
import { formatGameDateParts } from '@/lib/schedule-format';
import type { Metadata } from 'next';
import Link from 'next/link';

interface Params { team: string }

export async function generateStaticParams() {
  return TEAM_ABBRS.map(t => ({ team: t.toLowerCase() }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const abbr = params.team.toUpperCase();
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

export default async function TeamSchedulePage({ params }: { params: Params }) {
  const abbr = params.team.toUpperCase();
  const meta = TEAM_META[abbr];
  if (!meta) return <div className="max-w-4xl mx-auto px-4 py-12 text-white">Unknown team.</div>;
  const games = await getTeamSeasonSchedule(abbr);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 text-white">
      <h1 className="text-3xl font-bold mb-2">{meta.name} 2025 Schedule</h1>
      <p className="text-white/60 mb-6 text-sm">Kickoff times expressed in Eastern Time (ET). Live status and final scores update automatically.</p>
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
            {games.map(g => {
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
            <p className="text-white/70">(Add once schedule JSON includes bye markers.)</p>
          </div>
          <div>
            <h3 className="font-semibold">How many primetime games do the {meta.name} have in 2025?</h3>
            <p className="text-white/70">Count matchups on Thu/Sun/Mon night once final schedule is present.</p>
          </div>
          <div>
            <h3 className="font-semibold">Who do the {meta.name} play in Week 1?</h3>
            <p className="text-white/70">This section updates automatically from the schedule data.</p>
          </div>
        </div>
      </section>
    </div>
  );
}