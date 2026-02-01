import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { GameCenterHero } from '@/app/components/game-center/GameCenterHero';
import { GameCenterInfoGrid } from '@/app/components/game-center/GameCenterInfoGrid';
import { GameCenterInsights } from '@/app/components/game-center/GameCenterInsights';
import { GameCenterCuratedArticles } from '@/app/components/game-center/GameCenterCuratedArticles';
import { GameCenterTimeline } from '@/app/components/game-center/GameCenterTimeline';
import { buildGameCenterPayload } from '@/lib/game-center';
import { fetchSanitySeasonGames } from '@/lib/schedule';

export const revalidate = 300;

interface PageProps {
  params: Promise<{ gameId: string }>;
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thegamesnap.com';

export async function generateStaticParams() {
  const schedule = await fetchSanitySeasonGames();
  return schedule.map((game) => ({ gameId: game.gameId }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { gameId } = await params;
  const payload = await buildGameCenterPayload(gameId);
  if (!payload) {
    return {
      title: 'Game not found | The Snap',
      description: 'Unable to locate this matchup in the current schedule.',
      robots: { index: true, follow: true },
    };
  }
  const url = `${siteUrl}/game-center/${gameId}`;
  return {
    title: `${payload.meta.pageTitle} | The Snap`,
    description: payload.meta.description,
    robots: { index: true, follow: true },
    openGraph: {
      title: payload.meta.pageTitle,
      description: payload.meta.description,
      url,
      type: 'article',
    },
    alternates: { canonical: url },
  };
}

export default async function GameCenterPage({ params }: PageProps) {
  const { gameId } = await params;
  const payload = await buildGameCenterPayload(gameId);
  if (!payload) notFound();

  const infoItems = [
    { label: 'Kickoff (ET)', value: payload.hero.kickoffLabel },
    { label: 'Stage', value: payload.hero.subtitle },
    { label: 'Broadcast', value: payload.hero.detailLabel || 'TBD' },
    { label: 'Status', value: payload.hero.statusLabel },
  ];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-12 lg:px-0">
      <GameCenterHero data={payload.hero} />
      <GameCenterInfoGrid items={infoItems} />
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <GameCenterInsights insights={payload.insights} />
          {payload.curatedArticles.length ? (
            <GameCenterCuratedArticles articles={payload.curatedArticles} />
          ) : null}
        </div>
        <GameCenterTimeline entries={payload.timeline} />
      </div>
    </div>
  );
}
