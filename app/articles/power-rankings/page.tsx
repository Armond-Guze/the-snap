import { client } from "@/sanity/lib/client";
import { powerRankingsLatestSnapshotQuery } from "@/lib/queries/power-rankings";
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { SITE_URL } from "@/lib/site-config";

export const metadata: Metadata = {
  title: 'NFL Power Rankings – Weekly Team Rankings & Analysis | The Snap',
  description: 'Follow the latest NFL Power Rankings updated each week for all 32 teams. See who is rising or falling with fresh commentary on every squad.',
  openGraph: {
    title: 'NFL Power Rankings – Weekly Team Rankings & Analysis | The Snap',
    description: 'Weekly updated rankings for all 32 NFL teams with movement notes and analysis.',
    url: `${SITE_URL}/articles/power-rankings`,
    type: 'website',
  },
  alternates: { canonical: `${SITE_URL}/articles/power-rankings` },
};

export const revalidate = 60;

type LatestSnapshotTarget = {
  seasonYear: number;
  weekNumber?: number;
  playoffRound?: string;
};

export default async function PowerRankingsArticlePage() {
  let latestSnapshot: LatestSnapshotTarget | null = null;

  try {
    latestSnapshot = await client.fetch(powerRankingsLatestSnapshotQuery);
  } catch (error) {
    console.error('Power Rankings query failed:', error);
  }

  if (
    latestSnapshot?.seasonYear &&
    (typeof latestSnapshot.weekNumber === 'number' || latestSnapshot.playoffRound)
  ) {
    const weekPart = latestSnapshot.playoffRound
      ? latestSnapshot.playoffRound.toLowerCase()
      : `week-${latestSnapshot.weekNumber}`;
    redirect(`/articles/power-rankings/${latestSnapshot.seasonYear}/${weekPart}`);
  }

  redirect('/power-rankings/changelog');
}
