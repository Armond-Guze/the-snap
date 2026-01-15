import { client } from '@/sanity/lib/client';
import Link from 'next/link';
import type { Metadata } from 'next';

interface RankingDoc {
  _id: string;
  seasonYear?: number;
  weekNumber?: number;
  playoffRound?: string;
  rankings?: { rank?: number; teamName?: string; teamAbbr?: string; team?: { title?: string } }[];
}

export const metadata: Metadata = {
  title: 'NFL Power Rankings Change Log – Week-to-Week Movement | The Snap',
  description: 'Historical movement in our NFL power rankings: track how each team rises or falls week to week throughout the current season.'
};

export const revalidate = 600;

export default async function PowerRankingsChangeLogPage() {
  const latestSeason: number | null = await client.fetch(`*[_type == "article" && format == "powerRankings" && rankingType == "snapshot" && published == true] | order(seasonYear desc)[0].seasonYear`);
  if (!latestSeason) return <div className="max-w-5xl mx-auto px-4 py-12 text-white">No rankings history yet.</div>;
  const docs: RankingDoc[] = await client.fetch(
    `*[_type == "article" && format == "powerRankings" && rankingType == "snapshot" && published == true && seasonYear == $season] | order(weekNumber desc){ _id, seasonYear, weekNumber, playoffRound, rankings[]{ rank, teamName, teamAbbr, team->{ title } } }`,
    { season: latestSeason }
  );
  if (!docs.length) return <div className="max-w-5xl mx-auto px-4 py-12 text-white">No rankings history yet.</div>;
  // Build movement map per team across snapshots
  const teamMap = new Map<string, { snapshots: { week: number; rank: number; prev?: number }[] }>();
  docs
    .slice()
    .reverse()
    .forEach((doc, idx) => {
      const week = typeof doc.weekNumber === 'number' ? doc.weekNumber : idx + 1;
      (doc.rankings || []).forEach(t => {
        const name = t.teamName || t.team?.title || t.teamAbbr;
        if (!name || !t.rank) return;
        const entry = teamMap.get(name) || { snapshots: [] };
        entry.snapshots.push({ week, rank: t.rank! });
        teamMap.set(name, entry);
      });
    });
  const rows = Array.from(teamMap.entries()).map(([team, data]) => ({ team, snapshots: data.snapshots.sort((a,b)=>a.week-b.week) }));
  return (
    <div className="max-w-6xl mx-auto px-4 py-10 text-white">
      <h1 className="text-3xl font-bold mb-4">NFL Power Rankings Change Log</h1>
      <p className="text-white/60 text-sm mb-8">Week-to-week movement of each team in our published power rankings. Newer weeks appear to the right. Click a week heading to view that edition.</p>
      <div className="overflow-auto border border-white/10 rounded-lg">
        <table className="min-w-full text-xs">
          <thead className="bg-white/10">
            <tr>
              <th className="p-2 text-left font-semibold">Team</th>
              {docs.slice().reverse().map((d) => {
                const weekPart = typeof d.weekNumber === 'number' ? `week-${d.weekNumber}` : d.playoffRound?.toLowerCase();
                if (!d.seasonYear || !weekPart) return null;
                const label = typeof d.weekNumber === 'number' ? `Wk ${d.weekNumber}` : (d.playoffRound || '').toUpperCase();
                return (
                  <th key={d._id} className="p-2 font-semibold whitespace-nowrap">
                    <Link href={`/power-rankings/${d.seasonYear}/${weekPart}`} className="hover:underline">{label}</Link>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.team} className="border-t border-white/5 hover:bg-white/5">
                <td className="p-2 font-medium whitespace-nowrap">{r.team}</td>
                {docs.slice().reverse().map((d) => {
                  const week = typeof d.weekNumber === 'number' ? d.weekNumber : undefined;
                  const snap = typeof week === 'number' ? r.snapshots.find(s => s.week === week) : undefined;
                  const rank = snap?.rank;
                  return <td key={d._id} className={`p-2 text-center ${rank ? 'text-white' : 'text-white/30'}`}>{rank || '—'}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}