import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { getGameById, TEAM_META } from '@/lib/schedule';
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
      title: 'NFL Matchup Not Found | The Snap',
      robots: { index: false, follow: true },
    };
  }

  const away = TEAM_META[game.away]?.name || game.away;
  const home = TEAM_META[game.home]?.name || game.home;
  return {
    title: `${away} at ${home} | The Snap`,
    alternates: { canonical: `${SITE_URL}/game-center/${game.gameId}` },
    robots: { index: false, follow: true },
  };
}

export default async function MatchupAliasPage({ params }: MatchupPageProps) {
  const { gameId } = await params;
  const game = await getGameById(gameId);
  if (!game) notFound();
  permanentRedirect(`/game-center/${game.gameId}`);
}
