import { client } from "@/sanity/lib/client";
import { powerRankingsLatestSnapshotForSeasonQuery } from "@/lib/queries/power-rankings";
import { getActiveSeason } from "@/lib/season";
import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { SITE_URL } from "@/lib/site-config";

const TEAM_COLOR_CLASSES: Record<string, string> = {
  '#97233F': 'text-[#97233F]',
  '#A71930': 'text-[#A71930]',
  '#241773': 'text-[#241773]',
  '#00338D': 'text-[#00338D]',
  '#0085CA': 'text-[#0085CA]',
  '#0B162A': 'text-[#0B162A]',
  '#FB4F14': 'text-[#FB4F14]',
  '#311D00': 'text-[#311D00]',
  '#041E42': 'text-[#041E42]',
  '#0076B6': 'text-[#0076B6]',
  '#203731': 'text-[#203731]',
  '#03202F': 'text-[#03202F]',
  '#002C5F': 'text-[#002C5F]',
  '#006778': 'text-[#006778]',
  '#E31837': 'text-[#E31837]',
  '#000000': 'text-[#000000]',
  '#0080C6': 'text-[#0080C6]',
  '#003594': 'text-[#003594]',
  '#008E97': 'text-[#008E97]',
  '#4F2683': 'text-[#4F2683]',
  '#002244': 'text-[#002244]',
  '#D3BC8D': 'text-[#D3BC8D]',
  '#0B2265': 'text-[#0B2265]',
  '#125740': 'text-[#125740]',
  '#004C54': 'text-[#004C54]',
  '#FFB612': 'text-[#FFB612]',
  '#AA0000': 'text-[#AA0000]',
  '#D50A0A': 'text-[#D50A0A]',
  '#0C2340': 'text-[#0C2340]',
  '#5A1414': 'text-[#5A1414]',
};

const getTeamColorClass = (color?: string | null) => {
  if (!color) return 'text-white';
  const normalized = color.toUpperCase();
  return TEAM_COLOR_CLASSES[normalized] ?? 'text-white';
};

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

export default async function PowerRankingsArticlePage() {
  try {
    const season = await getActiveSeason();
    const latestSnapshot: { seasonYear: number; weekNumber?: number; playoffRound?: string } | null =
      season ? await client.fetch(powerRankingsLatestSnapshotForSeasonQuery, { season }) : null;

    if (latestSnapshot?.seasonYear && (latestSnapshot.weekNumber || latestSnapshot.playoffRound)) {
      const weekPart = latestSnapshot.playoffRound
        ? latestSnapshot.playoffRound.toLowerCase()
        : `week-${latestSnapshot.weekNumber}`;
      redirect(`/articles/power-rankings/${latestSnapshot.seasonYear}/${weekPart}`);
    }

    notFound();
  } catch (error) {
    console.error('Power Rankings error:', error);
    notFound();
  }
}
