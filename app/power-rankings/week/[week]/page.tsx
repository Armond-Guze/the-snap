import { client } from '@/sanity/lib/client';
import { powerRankingWeekByParamsQuery, powerRankingWeeksSlugsQuery } from '@/lib/queries/power-rankings';
import type { Metadata } from 'next';

type Params = Promise<{ week: string }>; // format: "1-2025"

export async function generateStaticParams() {
  const slugs: { slug: string }[] = await client.fetch(powerRankingWeeksSlugsQuery);
  return slugs.map(s => ({ week: s.slug?.replace('week-', '') ?? '1-2025' }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { week } = await params;
  const [w, season] = week.split('-');
  const title = `NFL Power Rankings ${season} — Week ${w}: Full 1–32, Movers & Notes`;
  const description = `Complete Week ${w} NFL Power Rankings for ${season}. See team movement from last week and quick notes for all 32 teams.`;
  return { title, description, alternates: { canonical: `/power-rankings/week/${week}` }, openGraph: { title, description } };
}

export const revalidate = 300;

export default async function RankingsWeekPage({ params }: { params: Params }) {
  const { week } = await params;
  const [wStr, seasonStr] = week.split('-');
  const season = Number(seasonStr);
  const w = Number(wStr);
  const data = await client.fetch(powerRankingWeekByParamsQuery, { season, week: w });
  if (!data) return <div className="max-w-5xl mx-auto px-4 py-12 text-white">No snapshot for Week {w} — {season} yet.</div>;
  type Item = { rank: number; teamAbbr: string; teamName?: string; note?: string; prevRank?: number; movement?: number };
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thegamesnap.com';
  const listLd = data ? {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `NFL Power Rankings ${season} — Week ${w}`,
    itemListOrder: 'http://schema.org/ItemListOrderAscending',
    itemListElement: (data.items || []).map((it: Item, idx: number) => ({
      '@type': 'ListItem',
      position: it.rank ?? idx + 1,
      url: `${baseUrl}/teams/${(it.teamAbbr||'').toLowerCase()}`,
      name: it.teamName || it.teamAbbr
    }))
  } : null;
  return (
    <div className="max-w-5xl mx-auto px-4 py-12 text-white">
      {listLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(listLd) }} />}
      <h1 className="text-3xl md:text-4xl font-bold mb-2">NFL Power Rankings {season} — Week {w}</h1>
      <p className="text-gray-400 mb-6">Published {data.publishedAt ? new Date(data.publishedAt).toLocaleDateString() : '—'}</p>
      <ol className="space-y-3">
  {data.items?.slice().sort((a: Item, b: Item) => a.rank - b.rank).map((it: Item) => (
          <li key={`${it.teamAbbr}-${it.rank}`} className="flex items-start gap-3 bg-[#0d0d0d] border border-[#1e1e1e] rounded p-3">
            <div className="w-8 text-right font-bold">{it.rank}</div>
            <div className="flex-1">
              <div className="font-semibold">
                <a className="hover:underline" href={`/teams/${it.teamAbbr?.toLowerCase?.()}`}>{it.teamName || it.teamAbbr}</a>
                {typeof it.movement === 'number' && (
                  <span className={`ml-2 text-xs ${it.movement > 0 ? 'text-green-400' : it.movement < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                    {it.movement > 0 ? `▲ ${it.movement}` : it.movement < 0 ? `▼ ${Math.abs(it.movement)}` : '—'}
                  </span>
                )}
              </div>
              {it.note && <p className="text-sm text-gray-300 mt-1">{it.note}</p>}
            </div>
            {typeof it.prevRank === 'number' && (
              <div className="text-xs text-gray-400">Prev: {it.prevRank}</div>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
