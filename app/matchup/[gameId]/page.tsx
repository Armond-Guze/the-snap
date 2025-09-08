import { getGameById, TEAM_META } from '@/lib/schedule';
import { formatGameDateParts } from '@/lib/schedule-format';
import type { Metadata } from 'next';

// Match project convention: params is a Promise resolved at runtime
interface MatchupPageProps { params: Promise<{ gameId: string }> }

export async function generateMetadata({ params }: MatchupPageProps): Promise<Metadata> {
  const { gameId } = await params;
  const g = await getGameById(gameId);
  if (!g) return { title: 'NFL Matchup Preview | The Snap' };
  const away = TEAM_META[g.away]?.name || g.away;
  const home = TEAM_META[g.home]?.name || g.home;
  const { dateLabel, timeLabel } = formatGameDateParts(g.dateUTC, { timezoneCode: 'ET' });
  const title = `${away} at ${home} – Week ${g.week} Matchup Preview (${dateLabel} ${timeLabel} ET)`;
  const description = `Preview: ${away} vs ${home} in Week ${g.week}. Kickoff ${dateLabel} ${timeLabel} ET on ${g.network || 'TBD'}. Live status, channel, and score updates.`;
  return { title, description, alternates: { canonical: `/matchup/${g.gameId}` } };
}

export const revalidate = 300;

export default async function MatchupPreviewPage({ params }: MatchupPageProps) {
  const { gameId } = await params;
  const g = await getGameById(gameId);
  if (!g) return <div className="max-w-3xl mx-auto px-4 py-12 text-white">Matchup not found.</div>;
  const { dateLabel, timeLabel, relative } = formatGameDateParts(g.dateUTC, { timezoneCode: 'ET' });
  const awayMeta = TEAM_META[g.away];
  const homeMeta = TEAM_META[g.home];
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 text-white">
      <h1 className="text-3xl font-bold mb-2">{awayMeta?.name || g.away} at {homeMeta?.name || g.home}</h1>
      <p className="text-white/60 text-sm mb-6">Week {g.week} • {dateLabel} {timeLabel} ET • {g.network || 'TBD'} {relative ? `• ${relative}` : ''}</p>
      <section className="space-y-6 text-sm leading-relaxed">
        <div>
          <h2 className="text-xl font-semibold mb-2">Game Overview</h2>
          <p className="text-white/70">Automated skeleton – add narrative generation or editorial content here. This section can include recent form, injury context, betting lines, and key matchups once data sources are integrated.</p>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">Key Storylines</h2>
          <ul className="list-disc list-inside space-y-1 text-white/70">
            <li>Storyline placeholder – e.g., quarterback performance trends.</li>
            <li>Storyline placeholder – defensive vs offensive efficiency.</li>
            <li>Storyline placeholder – injury impact analysis.</li>
          </ul>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">Team Comparison</h2>
          <p className="text-white/70">Future: insert comparative stats (EPA/play, DVOA surrogate, record) when available.</p>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">Prediction</h2>
          <p className="text-white/70">Add model-based or editorial prediction here once implemented.</p>
        </div>
      </section>
    </div>
  );
}