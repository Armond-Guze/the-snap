import { client } from '@/sanity/lib/client';
import Link from 'next/link';
import type { Metadata } from 'next';

interface RankingDoc { _id: string; slug: { current: string }; publishedAt?: string; title: string; teams?: { rank?: number; previousRank?: number; teamName?: string }[] }

export const metadata: Metadata = {
  title: 'NFL Power Rankings Change Log – Week-to-Week Movement | The Snap',
  description: 'Historical movement in our NFL power rankings: track how each team rises or falls week to week throughout the 2025 season.'
};

export const revalidate = 600;

export default async function PowerRankingsChangeLogPage() {
  // Pull last 10 published team ranking docs
  const docs: RankingDoc[] = await client.fetch(`*[_type == "rankings" && rankingType == "team" && published == true] | order(publishedAt desc)[0...10]{ _id,slug,publishedAt,title,teams[]{rank,previousRank,teamName} }`);
  if (!docs.length) return <div className="max-w-5xl mx-auto px-4 py-12 text-white">No rankings history yet.</div>;
  // Build movement map per team across snapshots
  const teamMap = new Map<string, { snapshots: { week: number; rank: number; prev?: number }[] }>();
  docs.forEach((doc, idx) => {
    const week = docs.length - idx; // simple descending to ascending mapping
    (doc.teams || []).forEach(t => {
      if (!t.teamName || !t.rank) return;
      const entry = teamMap.get(t.teamName) || { snapshots: [] };
      entry.snapshots.push({ week, rank: t.rank!, prev: t.previousRank });
      teamMap.set(t.teamName, entry);
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
              {docs.slice().reverse().map((d,i) => (
                <th key={d._id} className="p-2 font-semibold whitespace-nowrap">
                  <Link href={`/articles/${d.slug.current}`} className="hover:underline">Wk {i+1}</Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.team} className="border-t border-white/5 hover:bg-white/5">
                <td className="p-2 font-medium whitespace-nowrap">{r.team}</td>
                {docs.slice().reverse().map((d,i) => {
                  const snap = r.snapshots.find(s => s.week === i+1);
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