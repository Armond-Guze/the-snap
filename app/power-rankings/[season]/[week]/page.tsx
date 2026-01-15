import { client } from '@/sanity/lib/client';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { powerRankingsSnapshotByParamsQuery, powerRankingsSnapshotSlugsQuery } from '@/lib/queries/power-rankings';
import type { PageProps, PowerRankingsDoc, PowerRankingEntry } from '@/types';

const PLAYOFF_LABELS: Record<string, string> = {
  WC: 'Wild Card',
  DIV: 'Divisional',
  CONF: 'Conference Championship',
  SB: 'Super Bowl',
};

const PLAYOFF_ORDER: string[] = ['WC', 'DIV', 'CONF', 'SB'];

type ParsedWeek =
  | { weekNumber: number; playoffRound?: undefined }
  | { playoffRound: string; weekNumber?: undefined }
  | { invalid: true };

function parseWeekParam(raw: string): ParsedWeek {
  const normalized = raw.toLowerCase();
  if (normalized.startsWith('week-')) {
    const weekNumber = Number(normalized.replace('week-', ''));
    if (Number.isFinite(weekNumber) && weekNumber >= 1 && weekNumber <= 18) {
      return { weekNumber };
    }
  }
  const round = normalized.toUpperCase();
  if (PLAYOFF_ORDER.includes(round)) {
    return { playoffRound: round };
  }
  return { invalid: true };
}

function getPrevPlayoffRound(round?: string | null) {
  if (!round) return null;
  const index = PLAYOFF_ORDER.indexOf(round);
  if (index <= 0) return null;
  return PLAYOFF_ORDER[index - 1];
}

export async function generateStaticParams() {
  const slugs: { seasonYear?: number; weekNumber?: number; playoffRound?: string }[] = await client.fetch(powerRankingsSnapshotSlugsQuery);
  return slugs
    .map((s) => {
      if (!s?.seasonYear) return null;
      if (typeof s.weekNumber === 'number') {
        return { season: String(s.seasonYear), week: `week-${s.weekNumber}` };
      }
      if (s.playoffRound) {
        return { season: String(s.seasonYear), week: s.playoffRound.toLowerCase() };
      }
      return null;
    })
    .filter(Boolean) as Array<{ season: string; week: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { season: seasonParam, week } = await params;
  const season = Number(seasonParam);
  const parsed = parseWeekParam(week);
  if (!Number.isFinite(season) || 'invalid' in parsed) {
    return { title: 'NFL Power Rankings', description: 'Weekly NFL power rankings.' };
  }
  const weekLabel = parsed.weekNumber ? `Week ${parsed.weekNumber}` : PLAYOFF_LABELS[parsed.playoffRound || ''] || 'Playoffs';
  const title = `NFL Power Rankings ${season} — ${weekLabel}: Full 1–32, Movers & Notes`;
  const description = `Complete ${weekLabel} NFL Power Rankings for ${season}. See team movement from last week and quick notes for all 32 teams.`;
  return { title, description, alternates: { canonical: `/power-rankings/${season}/${week}` }, openGraph: { title, description } };
}

export const revalidate = 300;

export default async function RankingsWeekPage({ params }: PageProps) {
  const { season: seasonParam, week } = await params;
  const season = Number(seasonParam);
  const parsed = parseWeekParam(week);
  if (!Number.isFinite(season) || 'invalid' in parsed) {
    notFound();
  }

  const data: PowerRankingsDoc | null = await client.fetch(powerRankingsSnapshotByParamsQuery, {
    season,
    week: parsed.weekNumber ?? null,
    playoffRound: parsed.playoffRound ?? null,
  });

  if (!data) {
    return <div className="max-w-5xl mx-auto px-4 py-12 text-white">No snapshot found for {week} — {season} yet.</div>;
  }

  const prevSnapshot: PowerRankingsDoc | null = await client.fetch(powerRankingsSnapshotByParamsQuery, {
    season,
    week: parsed.weekNumber ? parsed.weekNumber - 1 : null,
    playoffRound: parsed.playoffRound ? getPrevPlayoffRound(parsed.playoffRound) : null,
  });

  const prevMap = new Map(
    (prevSnapshot?.rankings || []).map((entry) => [entry.teamAbbr || entry.teamName || entry.team?.title || '', entry.rank])
  );

  const weekLabel = parsed.weekNumber ? `Week ${parsed.weekNumber}` : PLAYOFF_LABELS[data.playoffRound || ''] || 'Playoffs';
  const published = data.date;

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 text-white">
      <h1 className="text-3xl md:text-4xl font-bold mb-2">NFL Power Rankings {season} — {weekLabel}</h1>
      <p className="text-gray-400 mb-6">Published {published ? new Date(published).toLocaleDateString() : '—'}</p>
      <ol className="space-y-3">
        {(data.rankings || [])
          .slice()
          .sort((a: PowerRankingEntry, b: PowerRankingEntry) => a.rank - b.rank)
          .map((entry: PowerRankingEntry, idx: number) => {
            const key = entry.teamAbbr || entry.teamName || entry.team?.title || `team-${idx}`;
            const prevRank = typeof entry.prevRankOverride === 'number' ? entry.prevRankOverride : prevMap.get(key);
            const movement = typeof entry.movementOverride === 'number'
              ? entry.movementOverride
              : typeof prevRank === 'number'
                ? prevRank - entry.rank
                : 0;
            return (
              <li key={`${key}-${entry.rank}`} className="flex items-start gap-3 bg-[#0d0d0d] border border-[#1e1e1e] rounded p-3">
                <div className="w-8 text-right font-bold">{entry.rank}</div>
                <div className="flex-1">
                  <div className="font-semibold">
                    <a className="hover:underline" href={`/teams/${(entry.teamAbbr || entry.teamName || '').toLowerCase()}`}>{entry.teamName || entry.team?.title || entry.teamAbbr}</a>
                    {typeof movement === 'number' && (
                      <span className={`ml-2 text-xs ${movement > 0 ? 'text-green-400' : movement < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                        {movement > 0 ? `▲ ${movement}` : movement < 0 ? `▼ ${Math.abs(movement)}` : '—'}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-300 mt-1">
                    {typeof movement === 'number' && movement !== 0
                      ? (movement > 0
                          ? `Up +${movement} to #${entry.rank}. `
                          : `Down −${Math.abs(movement)} to #${entry.rank}. `)
                      : `Hold at #${entry.rank}. `}
                    {entry.note || ''}
                  </p>
                </div>
                {typeof prevRank === 'number' && (
                  <div className="text-xs text-gray-400">Prev: {prevRank}</div>
                )}
              </li>
            );
          })}
      </ol>
    </div>
  );
}
