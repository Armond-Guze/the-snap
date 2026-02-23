import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import type { PageProps } from '@/types';
import { SITE_URL } from '@/lib/site-config';

const PLAYOFF_LABELS: Record<string, string> = {
  WC: 'Wild Card',
  DIV: 'Divisional',
  CONF: 'Conference Championship',
  SB: 'Super Bowl',
  OFF: 'Offseason',
};

const PLAYOFF_ORDER: string[] = ['WC', 'DIV', 'CONF', 'SB', 'OFF'];

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
  if (normalized === 'offseason') {
    return { playoffRound: 'OFF' };
  }
  const round = normalized.toUpperCase();
  if (PLAYOFF_ORDER.includes(round)) {
    return { playoffRound: round };
  }
  return { invalid: true };
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
  const baseUrl = SITE_URL;
  const canonical = `${baseUrl}/articles/power-rankings/${season}/${week}`;
  const ogImage = `${baseUrl}/api/og?${new URLSearchParams({
    title,
    subtitle: description,
    category: 'Power Rankings',
    date: `${season} ${weekLabel}`,
  }).toString()}`;
  return {
    title,
    description,
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph: { title, description, url: canonical, images: [{ url: ogImage }], type: 'article' },
    twitter: { card: 'summary_large_image', title, description, images: [ogImage] },
  };
}

export default async function RankingsWeekRedirectPage({ params }: PageProps) {
  const { season, week } = await params;
  redirect(`/articles/power-rankings/${season}/${week}`);
}
