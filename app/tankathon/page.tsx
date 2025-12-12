import Link from 'next/link';
import type { Metadata } from 'next';
import { computeDraftOrder } from '@/lib/draft-order';
import { TEAM_META } from '@/lib/schedule';

export const revalidate = 900; // 15 minutes; cron/API revalidation will force-refresh sooner

export const metadata: Metadata = {
  title: 'NFL Draft Order Tracker | Tank-a-thon | The Snap',
  description: 'Live NFL draft order with pick ownership, traded picks, and updated records after every game.',
  alternates: { canonical: '/tankathon' },
  openGraph: {
    title: 'NFL Draft Order Tracker | Tank-a-thon',
    description: 'Updated draft order with traded picks and movement after every game.',
    url: 'https://thegamesnap.com/tankathon'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NFL Draft Order Tracker',
    description: 'See who owns each pick, updated after every game.'
  }
};

export default async function TankathonPage() {
  const data = await computeDraftOrder();
  const top = data.picks.slice(0, 5);

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      <header className="border-b border-white/10 bg-gradient-to-b from-rose-500/10 via-black to-black px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-rose-200">Tank-a-thon</p>
            <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight">NFL Draft Order Tracker</h1>
            <p className="text-sm sm:text-base text-white/70 max-w-2xl">Live pick order with traded ownership baked in. Updated after every game window.</p>
            <p className="text-xs text-white/50">Generated {new Date(data.generatedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/New_York' })}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {top.map((pick) => (
              <div key={pick.pick} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
                <div className="flex items-center justify-between text-xs text-white/60 uppercase tracking-[0.25em]">
                  <span>Pick {pick.pick}</span>
                  <span>{pick.record}</span>
                </div>
                <h3 className="mt-3 text-lg font-semibold">{teamName(pick.owningTeam)}</h3>
                {pick.owningTeam !== pick.originalTeam && (
                  <p className="text-xs text-rose-200">Via {teamName(pick.originalTeam)}</p>
                )}
                {pick.note && <p className="mt-2 text-xs text-white/60">{pick.note}</p>}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-white/70">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1">Traded picks display the current owning team</span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1">Ties broken by win % then wins/losses</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 space-y-10">
        <section className="rounded-3xl border border-white/10 bg-white/[0.02] p-4 sm:p-6 shadow-[0_25px_70px_rgba(0,0,0,0.35)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/5 pb-4">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-white/50">Full order</p>
              <h2 className="text-xl font-semibold">Top 32 picks</h2>
            </div>
            <div className="text-xs text-white/60">Season {data.season}</div>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-xs uppercase tracking-[0.2em] text-white/60">
                <tr>
                  <th className="py-2 pr-4 text-left">Pick</th>
                  <th className="py-2 pr-4 text-left">Owning Team</th>
                  <th className="py-2 pr-4 text-left">Original Team</th>
                  <th className="py-2 pr-4 text-left">Record</th>
                  <th className="py-2 pr-4 text-left">Win %</th>
                  <th className="py-2 pr-4 text-left">Note</th>
                </tr>
              </thead>
              <tbody>
                {data.picks.map((pick) => (
                  <tr key={pick.pick} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-2 pr-4 font-semibold text-white">{pick.pick}</td>
                    <td className="py-2 pr-4 text-white/90">{teamName(pick.owningTeam)}</td>
                    <td className="py-2 pr-4 text-white/70">{pick.owningTeam === pick.originalTeam ? '—' : teamName(pick.originalTeam)}</td>
                    <td className="py-2 pr-4 text-white/90">{pick.record}</td>
                    <td className="py-2 pr-4 text-white/70">{(pick.winPct * 100).toFixed(1)}%</td>
                    <td className="py-2 pr-4 text-white/60">{pick.note || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.015] p-4 sm:p-6">
          <h3 className="text-lg font-semibold mb-2">How this works</h3>
          <ul className="list-disc pl-5 space-y-1 text-sm text-white/70">
            <li>Draft order is sorted by worst record (win %), then wins, then losses.</li>
            <li>Traded picks are reassigned to the acquiring team; add more trades in <code className="text-rose-200">data/traded-picks.ts</code>.</li>
            <li>Data comes from SportsDataIO standings; we refresh after each game window via sync.</li>
          </ul>
          <div className="mt-3 text-sm text-white/60">Need a correction? <Link className="text-rose-200 underline" href="/contact">Contact us</Link>.</div>
        </section>
      </main>
    </div>
  );
}

function teamName(abbr: string): string {
  const meta = TEAM_META[abbr];
  return meta?.name || abbr;
}
