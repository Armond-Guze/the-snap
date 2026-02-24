import 'server-only';
import Link from 'next/link';
import { aggregateLast7Days } from '../../../lib/analytics-store';

export const dynamic = 'force-dynamic';

function formatLatency(ms?: number) {
  if (ms == null) return '—';
  if (ms < 0) return '—';
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = (mins / 60).toFixed(1);
  return `${hrs}h`;
}

export default async function InsightsPage() {
  const { topArticles, risingTopics, orphaned, generatedAt } = await aggregateLast7Days();

  return (
    <div className="min-h-screen bg-black text-white px-6 py-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-baseline justify-between mb-10">
          <div>
            <h1 className="text-4xl font-bold mb-2">Editorial Insights</h1>
            <p className="text-gray-400 text-sm">Generated {new Date(generatedAt).toLocaleString()}</p>
          </div>
          <Link href="/admin" className="text-sm text-gray-400 hover:text-white">← Admin</Link>
        </div>

        {/* Top Articles */}
        <section className="mb-14">
          <div className="flex items-center gap-4 mb-4">
            <h2 className="text-2xl font-semibold">Top 20 Articles (Last 7 Days)</h2>
            <div className="h-px flex-1 bg-white/10" />
          </div>
          {topArticles.length === 0 ? (
            <p className="text-gray-500">No view data yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="min-w-full text-sm">
                <thead className="bg-white/5 text-gray-300">
                  <tr>
                    <th className="px-3 py-2 text-left">#</th>
                    <th className="px-3 py-2 text-left">Title</th>
                    <th className="px-3 py-2">Views</th>
                    <th className="px-3 py-2">Category</th>
                    <th className="px-3 py-2">First View</th>
                    <th className="px-3 py-2">Publish</th>
                    <th className="px-3 py-2">Idx Latency</th>
                  </tr>
                </thead>
                <tbody>
                  {topArticles.map((a, i) => (
                    <tr key={a.articleId} className="odd:bg-white/[0.015] hover:bg-white/[0.05] transition-colors">
                      <td className="px-3 py-2 text-gray-400">{i+1}</td>
                      <td className="px-3 py-2 max-w-xs">
                        <Link href={`/${a.articleSlug.startsWith('fantasy') ? '' : 'articles/'}${a.articleSlug}`} className="hover:underline line-clamp-2">
                          {a.articleTitle || a.articleSlug}
                        </Link>
                      </td>
                      <td className="px-3 py-2 text-center font-semibold">{a.views}</td>
                      <td className="px-3 py-2 text-center text-gray-400">{a.category || '—'}</td>
                      <td className="px-3 py-2 text-center text-gray-400">{a.firstViewAt ? new Date(a.firstViewAt).toLocaleDateString(undefined,{month:'short',day:'numeric'}) : '—'}</td>
                      <td className="px-3 py-2 text-center text-gray-400">{a.publishedAt ? new Date(a.publishedAt).toLocaleDateString(undefined,{month:'short',day:'numeric'}) : '—'}</td>
                      <td className="px-3 py-2 text-center text-gray-300">{formatLatency(a.indexLatencyMs)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Rising Topics */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Rising Topics</h2>
            {risingTopics.length === 0 ? <p className="text-gray-500 text-sm">No category view data.</p> : (
              <ul className="space-y-2">
                {risingTopics.map(rt => (
                  <li key={rt.category} className="flex items-center justify-between bg-white/[0.04] rounded-lg px-3 py-2 text-sm">
                    <span className="font-medium capitalize">{rt.category.replace(/-/g,' ')}</span>
                    <span className="flex items-center gap-3">
                      <span className="text-gray-400">{rt.previous} → {rt.current}</span>
                      <span className={rt.pctChange >= 0 ? 'text-green-400' : 'text-red-400'}>
                        {rt.pctChange >= 0 ? '+' : ''}{rt.pctChange.toFixed(1)}%
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Orphaned Articles */}
            <section>
              <h2 className="text-xl font-semibold mb-4">Potential Orphans (&lt;3 sources)</h2>
              {orphaned.length === 0 ? <p className="text-gray-500 text-sm">None detected (or insufficient data).</p> : (
                <ul className="space-y-2">
                  {orphaned.map(o => (
                    <li key={o.articleId} className="bg-white/[0.04] rounded-lg px-3 py-2 text-sm flex flex-col gap-1">
                      <div className="flex justify-between gap-4">
                        <span className="font-medium truncate">{o.slug}</span>
                        <span className="text-gray-400">{o.views} views</span>
                      </div>
                      <div className="text-[11px] text-gray-500 line-clamp-1">Sources: {o.sources.length ? o.sources.join(', ') : '—'}</div>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-3 text-xs text-gray-500">Heuristic: counts distinct click sources (needs richer internal link graph for accuracy).</p>
            </section>
        </div>

        <div className="text-xs text-gray-500 space-y-2 max-w-3xl">
          <p><strong>Notes:</strong> This dashboard uses a file-based store (development). For production, migrate to a persistent DB (Postgres / ClickHouse / Turso / Redis) and replace functions in <code>lib/analytics-store.ts</code>.</p>
          <p>Index latency = first tracked view minus publish time (negative/blank means missing publish data or view before publish timestamp correction).</p>
        </div>
      </div>
    </div>
  );
}
