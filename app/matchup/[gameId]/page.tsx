import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';

import { getGameById, TEAM_META } from '@/lib/schedule';
import { formatGameDateParts } from '@/lib/schedule-format';
import { SITE_URL } from '@/lib/site-config';

interface MatchupPageProps {
  params: Promise<{ gameId: string }>;
}

export const revalidate = 300;

export async function generateMetadata({ params }: MatchupPageProps): Promise<Metadata> {
  const { gameId } = await params;
  const game = await getGameById(gameId);

  if (!game) {
    return {
      title: 'Matchup not found | The Snap',
      description: 'Unable to locate this NFL matchup in the current schedule.',
      robots: { index: false, follow: false },
    };
  }

  const away = TEAM_META[game.away]?.name || game.away;
  const home = TEAM_META[game.home]?.name || game.home;
  const { dateLabel, timeLabel } = formatGameDateParts(game.dateUTC, { timezoneCode: 'ET' });
  const canonical = `${SITE_URL}/game-center/${game.gameId}`;

  return {
    title: `${away} at ${home} GameCenter | The Snap`,
    description: `${away} vs ${home} in Week ${game.week}. Kickoff ${dateLabel} ${timeLabel} ET on ${game.network || 'TBD'}.`,
    alternates: { canonical },
    robots: { index: false, follow: true },
  };
}

export default async function MatchupPreviewPage({ params }: MatchupPageProps) {
  const { gameId } = await params;
  const game = await getGameById(gameId);

  if (!game) notFound();

  permanentRedirect(`/game-center/${game.gameId}`);
}
